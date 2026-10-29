const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const database = require('../db/database');

after(async () => {
  await database.pool.end();
});

test('requires DATABASE_URL without exposing it in connection errors', async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    await assert.rejects(
      database.initializeDatabase(),
      (error) => {
        assert.ok(error instanceof database.DatabaseConnectionError);
        assert.equal(error.message, 'PostgreSQL database connection failed.');
        return true;
      },
    );
  } finally {
    if (previousDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});

test('uses verified TLS, creates the schema, and inserts contact data with parameters', async (t) => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://test.invalid/portfolio';
  const queries = [];
  t.mock.method(database.pool, 'query', async (sql, parameters) => {
    queries.push({ sql, parameters });
    if (sql.includes('INSERT INTO contact_messages')) {
      return {
        rows: [{ id: 7, submitted_at: new Date('2026-01-02T03:04:05.000Z') }],
      };
    }

    return { rows: [] };
  });

  try {
    assert.deepEqual(database.pool.options.ssl, { rejectUnauthorized: true });

    const savedMessage = await database.saveContactMessage({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Database test',
      contact_number: '',
      message: 'Parameterized database insert test.',
    });

    assert.equal(queries.length, 2);
    assert.match(queries[0].sql, /CREATE TABLE IF NOT EXISTS contact_messages/);
    assert.match(queries[0].sql, /contact_number TEXT NOT NULL DEFAULT ''/);
    assert.match(queries[0].sql, /submitted_at TIMESTAMPTZ NOT NULL/);
    assert.match(queries[1].sql, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6\)/);
    assert.deepEqual(queries[1].parameters.slice(0, 5), [
      'Test User',
      'test@example.com',
      'Database test',
      '',
      'Parameterized database insert test.',
    ]);
    assert.equal(savedMessage.id, 7);
    assert.equal(savedMessage.submittedAt, '2026-01-02T03:04:05.000Z');
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});
