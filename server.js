require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const database = require('./db/database');

const app = express();
const port = Number(process.env.PORT) || 3000;

const localOrigins = new Set([
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
]);

const configuredOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = configuredOrigin
  ? new Set(configuredOrigin.split(',').map((origin) => origin.trim()).filter(Boolean))
  : localOrigins;

app.disable('x-powered-by');
app.use(helmet());
app.use((req, res, next) => {
  const requestOrigin = req.get('origin');
  const requestHost = req.get('host');
  const isSameOrigin = (() => {
    if (!requestOrigin || !requestHost) {
      return false;
    }

    try {
      const parsedOrigin = new URL(requestOrigin);
      return (
        ['http:', 'https:'].includes(parsedOrigin.protocol) &&
        parsedOrigin.host === requestHost
      );
    } catch {
      return false;
    }
  })();

  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isSameOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
  })(req, res, next);
});
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api', apiLimiter);

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many contact submissions. Please try again later.' },
});

const contactLimits = {
  name: 100,
  email: 254,
  contact_number: 30,
  subject: 200,
  message: 5000,
};

const requiredContactFields = ['name', 'email', 'subject', 'message'];

function validateContactRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const fields = {};
  for (const field of Object.keys(contactLimits)) {
    const value = body[field];

    if (value === undefined && field === 'contact_number') {
      fields[field] = '';
      continue;
    }

    if (typeof value !== 'string') {
      return { error: `${field} must be provided as text.` };
    }

    fields[field] = value.trim();

    if (!fields[field] && requiredContactFields.includes(field)) {
      return { error: `${field} is required.` };
    }

    if (fields[field].length > contactLimits[field]) {
      return { error: `${field} must not exceed ${contactLimits[field]} characters.` };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return { error: 'email must be a valid email address.' };
  }

  return { value: fields };
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
  });
});

app.post('/api/contact', contactLimiter, async (req, res, next) => {
  const validation = validateContactRequest(req.body);

  if (validation.error) {
    res.status(400).json({ error: validation.error });
    return;
  }

  try {
    const savedMessage = await database.saveContactMessage(validation.value);
    res.status(201).json({
      message: 'Contact message saved.',
      id: savedMessage.id,
    });
  } catch (error) {
    if (error instanceof database.DatabaseConnectionError) {
      console.error('The contact message could not be saved because PostgreSQL is unavailable.');
      res.status(503).json({
        error: 'Contact service is temporarily unavailable. Please try again later.',
      });
      return;
    }

    next(error);
  }
});

app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'index.html'), (error) => {
    if (error) {
      next(error);
    }
  });
});

app.get(
  ['/styles.css', '/script.js'],
  express.static(__dirname, { dotfiles: 'deny', index: false }),
);
app.use(
  '/assets',
  express.static(path.join(__dirname, 'assets'), { dotfiles: 'deny', index: false }),
);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err.status || (err.message === 'Origin is not allowed by CORS' ? 403 : 500);
  const response = {
    error: status === 500 ? 'Internal server error' : err.message,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.details = err.message;
  }

  res.status(status).json(response);
});

if (require.main === module) {
  database.initializeDatabase().catch(() => {
    console.error('PostgreSQL initialization failed. Check DATABASE_URL and database availability.');
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
