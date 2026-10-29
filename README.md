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
├── README.md
├── assets/
│   ├── background-video.mp4
│   └── profile.jpg
├── scripts/
│   ├── password_strength_checker.py
│   ├── http_headers_analyzer.py
│   └── file_integrity_monitor.py
├── tests/
│   └── test_password_strength_checker.py
└── .gitignore
```

## Run the portfolio locally

You can serve the site with Python:

```bash
cd /home/black/cybersecurity-portfolio
python3 -m http.server 8000
```

Then open: http://localhost:8000/

If you use VS Code, the Live Server extension is the simplest browser preview option for this static site.

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
cd /home/black/cybersecurity-portfolio
python3 -m unittest discover -s tests -v
```

## Notes

- This site uses placeholders for contact links and a public CV until real details are available.
- The project list clearly labels planned, simulated, and demo work so no false claims are made.
- The Python tools are educational and should only be used against systems you own, operate, or are explicitly authorised to test.
- The portfolio uses a muted, looping background video; it is hidden for visitors who prefer reduced motion.
