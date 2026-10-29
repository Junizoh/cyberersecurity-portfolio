const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const app = require('../server');
const database = require('../db/database');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  const closePromise = new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server.closeAllConnections();
  await closePromise;
  await database.pool.end();
});

test('serves the portfolio and its public assets', async () => {
  const expectedContentTypes = new Map([
    ['/', /text\/html/],
    ['/styles.css', /text\/css/],
    ['/script.js', /javascript/],
    ['/assets/background-option-1.svg', /image\/svg\+xml/],
    ['/assets/background-video.mp4', /video\/mp4/],
  ]);

  for (const [route, contentType] of expectedContentTypes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), contentType, route);
  }
});

test('does not serve server, configuration, dependency, or database files', async () => {
  const privateRoutes = [
    '/server.js',
    '/package.json',
    '/.env',
    '/.git/config',
    '/node_modules/express/package.json',
    '/db/database.js',
    '/data/portfolio.sqlite3',
    '/assets/.private',
    '/assets/%2e%2e/server.js',
  ];

  for (const route of privateRoutes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 404, route);
  }
});

test('keeps API routes available and accepts same-origin contact submissions', async (t) => {
  const savedMessage = {
    id: 42,
    submittedAt: new Date().toISOString(),
  };
  const saveContactMessage = t.mock.method(
    database,
    'saveContactMessage',
    async () => savedMessage,
  );

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).status, 'ok');

  const contactResponse = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: baseUrl,
    },
    body: JSON.stringify({}),
  });
  assert.equal(contactResponse.status, 400);
  assert.equal(contactResponse.headers.get('access-control-allow-origin'), baseUrl);

  const savedContactResponse = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: baseUrl,
    },
    body: JSON.stringify({
      name: 'Portfolio Test',
      email: 'portfolio@example.com',
      subject: 'Deployment test',
      message: 'A valid contact request from the integration test.',
    }),
  });
  assert.equal(savedContactResponse.status, 201);
  assert.deepEqual(await savedContactResponse.json(), {
    message: 'Contact message saved.',
    id: savedMessage.id,
  });
  assert.equal(saveContactMessage.mock.calls.length, 1);
});

test('returns a generic service-unavailable response when PostgreSQL is unavailable', async (t) => {
  t.mock.method(
    database,
    'saveContactMessage',
    async () => {
      throw new database.DatabaseConnectionError();
    },
  );

  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Portfolio Test',
      email: 'portfolio@example.com',
      subject: 'Database outage',
      message: 'This request tests the database outage response.',
    }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: 'Contact service is temporarily unavailable. Please try again later.',
  });
});

test('contact form targets the same service', async () => {
  const response = await fetch(`${baseUrl}/script.js`);
  const source = await response.text();
  assert.match(source, /fetch\(['"]\/api\/contact['"]/);
  assert.doesNotMatch(source, /localhost:3000\/api\/contact/);
});
