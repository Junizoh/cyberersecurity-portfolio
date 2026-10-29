require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { initializeDatabase, pool } = require('../db/database');

const sqlitePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', 'data', 'portfolio.sqlite3');

async function migrate() {
  let sqlite;
  let client;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.');
    }

    if (!fs.existsSync(sqlitePath)) {
      throw new Error('The SQLite database file does not exist.');
    }

    sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
    const columns = sqlite.pragma('table_info(contact_messages)');
    const hasContactNumber = columns.some((column) => column.name === 'contact_number');
    const contactNumberColumn = hasContactNumber ? 'contact_number' : "'' AS contact_number";
    const messages = sqlite
      .prepare(`
        SELECT id, name, email, subject, ${contactNumberColumn}, message, submitted_at
        FROM contact_messages
        ORDER BY id
      `)
      .all();

    await initializeDatabase();
    client = await pool.connect();
    await client.query('BEGIN');

    let importedCount = 0;
    for (const contact of messages) {
      const result = await client.query(
        `INSERT INTO contact_messages
          (id, name, email, subject, contact_number, message, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          contact.id,
          contact.name,
          contact.email,
          contact.subject,
          contact.contact_number,
          contact.message,
          contact.submitted_at,
        ],
      );
      importedCount += result.rowCount;
    }

    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('contact_messages', 'id'),
        COALESCE(MAX(id), 1),
        COUNT(*) > 0
      )
      FROM contact_messages
    `);
    await client.query('COMMIT');
    console.log(`SQLite migration complete. Imported ${importedCount} contact message(s).`);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    throw error;
  } finally {
    sqlite?.close();
    client?.release();
    await pool.end();
  }
}

migrate().catch(() => {
  console.error('SQLite migration failed. Check the source database, DATABASE_URL, and Neon connectivity.');
  process.exitCode = 1;
});
