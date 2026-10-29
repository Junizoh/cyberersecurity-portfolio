const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDirectory = path.resolve(__dirname, '..', 'data');
const databasePath = path.join(dataDirectory, 'portfolio.sqlite3');

fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    contact_number TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    submitted_at TEXT NOT NULL
  );
`);

const contactColumns = db.prepare('PRAGMA table_info(contact_messages)').all();
if (!contactColumns.some((column) => column.name === 'contact_number')) {
  db.exec("ALTER TABLE contact_messages ADD COLUMN contact_number TEXT NOT NULL DEFAULT ''");
}

const insertMessageStatement = db.prepare(`
  INSERT INTO contact_messages (name, email, subject, contact_number, message, submitted_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function saveContactMessage({ name, email, contact_number, subject, message }) {
  const submittedAt = new Date().toISOString();
  const result = insertMessageStatement.run(
    name,
    email,
    subject,
    contact_number || '',
    message,
    submittedAt,
  );

  return {
    id: Number(result.lastInsertRowid),
    name,
    email,
    subject,
    submittedAt,
  };
}

module.exports = {
  db,
  databasePath,
  saveContactMessage,
};
