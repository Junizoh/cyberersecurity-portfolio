const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

pool.on('error', () => {
  console.error('Unexpected error from the PostgreSQL connection pool.');
});

class DatabaseConnectionError extends Error {
  constructor(cause) {
    super('PostgreSQL database connection failed.', { cause });
    this.name = 'DatabaseConnectionError';
  }
}

let schemaInitialization;

function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    return Promise.reject(new DatabaseConnectionError());
  }

  if (!schemaInitialization) {
    schemaInitialization = pool
      .query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          contact_number TEXT NOT NULL DEFAULT '',
          message TEXT NOT NULL,
          submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .then(() => undefined)
      .catch((error) => {
        schemaInitialization = undefined;
        throw new DatabaseConnectionError(error);
      });
  }

  return schemaInitialization;
}

async function saveContactMessage({ name, email, contact_number, subject, message }) {
  try {
    await initializeDatabase();
    const submittedAt = new Date();
    const result = await pool.query(
      `INSERT INTO contact_messages
        (name, email, subject, contact_number, message, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, submitted_at`,
      [name, email, subject, contact_number || '', message, submittedAt],
    );

    return {
      id: result.rows[0].id,
      name,
      email,
      subject,
      submittedAt: result.rows[0].submitted_at.toISOString(),
    };
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      throw error;
    }

    throw new DatabaseConnectionError(error);
  }
}

module.exports = {
  DatabaseConnectionError,
  initializeDatabase,
  pool,
  saveContactMessage,
};
