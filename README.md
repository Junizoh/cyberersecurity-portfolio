# Emmanuel Williams Cybersecurity Portfolio

This repository contains a responsive cybersecurity portfolio website for Emmanuel Williams, along with a small set of practical security tools and a test suite. The project is intentionally lightweight and uses plain HTML, CSS, and JavaScript with no build step.

## Included work

- Modern portfolio landing page with sections for About, Skills, Project Portfolio, Lab Notes, Certifications, Experience, Resume, and Contact.
- Filterable, searchable project gallery covering twelve cybersecurity project areas.
- Practical security tooling examples in `scripts/`.
- Basic Python tests for the password-strength checker in `tests/`.

## Project structure

```text
.
├── index.html
├── styles.css
├── script.js
├── db/
│   └── database.js
├── README.md
├── assets/
│   ├── background-video.mp4
│   └── profile.jpg
├── scripts/
│   ├── migrate-sqlite-to-postgres.js
│   ├── password_strength_checker.py
│   ├── http_headers_analyzer.py
│   └── file_integrity_monitor.py
├── tests/
│   ├── database.test.js
│   ├── server.test.js
│   └── test_password_strength_checker.py
└── .gitignore
```

## Run the portfolio locally

Install the Node.js dependencies and start the Express server:

```bash
npm ci
npm start
```

Set `DATABASE_URL` in the ignored `.env` file before starting the server so contact submissions use Neon:

```text
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

Keep the real connection string private and never commit it. Open http://localhost:3000/. The Express server serves the website and its assets alongside the health and contact API endpoints.

## Deploy as a Render Web Service

Create one **Web Service** from this repository and configure:

- **Runtime:** Node
- **Build command:** `npm ci`
- **Start command:** `npm start`
- **Health check path:** `/api/health`
- **Environment variable:** `NODE_ENV=production`
- **Environment variable:** `DATABASE_URL` set to the Neon connection string

Render supplies `PORT` to the service. The contact form submits to the same service using `/api/contact`.

Contact messages are stored in PostgreSQL using Neon. Set `DATABASE_URL` in the server environment to the Neon connection string; for local development, put it in the ignored `.env` file. The connection uses TLS certificate verification, and the URL is only read by the server.

To import existing messages from `data/portfolio.sqlite3`, set `DATABASE_URL` and run this one-time command before starting the service:

```bash
npm run migrate:sqlite
```

An alternate SQLite file can be supplied as an argument:

```bash
npm run migrate:sqlite -- /path/to/portfolio.sqlite3
```

The migration preserves message IDs and timestamps, skips IDs already present in Neon, and adjusts the PostgreSQL ID sequence. Keep the SQLite file as a backup until the import has been verified.

## Run the security tools

Password strength checker:

```bash
python3 scripts/password_strength_checker.py
```

HTTP security headers analyzer:

```bash
python3 scripts/http_headers_analyzer.py https://example.com --timeout 10
```

File integrity monitor:

```bash
python3 scripts/file_integrity_monitor.py /path/to/target --baseline baseline.json
python3 scripts/file_integrity_monitor.py /path/to/target --baseline baseline.json --check
```

## Run tests

```bash
npm test
python3 -m unittest discover -s tests -v
```

## Notes

- This site uses placeholders for contact links and a public CV until real details are available.
- The project list clearly labels planned, simulated, and demo work so no false claims are made.
- The Python tools are educational and should only be used against systems you own, operate, or are explicitly authorised to test.
- The portfolio uses a muted, looping background video; it is hidden for visitors who prefer reduced motion.
