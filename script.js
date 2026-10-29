const projects = [
  {
    title: 'Password Strength Analyzer',
    category: 'tool',
    status: 'Demo tool',
    summary: 'Interactive password review that checks length, common patterns, and policy heuristics without storing the password.',
    tags: ['Policy', 'Python', 'UX', 'Risk awareness']
  },
  {
    title: 'HTTP Security Headers Analyzer',
    category: 'tool',
    status: 'Python tool',
    summary: 'Checks explicit targets for header posture, timeout handling, and remediation guidance for common web security gaps.',
    tags: ['HTTP', 'Headers', 'Security review', 'Python']
  },
  {
    title: 'File Integrity Monitor',
    category: 'tool',
    status: 'Python tool',
    summary: 'Creates SHA-256 baselines for files and flags changes with a documented, defensive workflow.',
    tags: ['Integrity', 'SHA-256', 'Monitoring', 'Python']
  },
  {
    title: 'Network Reconnaissance Lab',
    category: 'lab',
    status: 'Lab notes',
    summary: 'Documents authoriseable discovery activities, port enumeration concepts, and defensive lessons for local practice environments.',
    tags: ['Nmap', 'Linux', 'Network', 'Lab']
  },
  {
    title: 'OWASP Juice Shop Assessment',
    category: 'assessment',
    status: 'Assessment',
    summary: 'A structured evaluation of a deliberately vulnerable app with evidence collection, exploitation notes, and remediation ideas.',
    tags: ['OWASP', 'Web security', 'Testing', 'Remediation']
  },
  {
    title: 'SOC Log Analysis Dashboard',
    category: 'report',
    status: 'Simulated data',
    summary: 'Analyses authentication and system logs to identify patterns such as repeated failed logins and suspicious access activity.',
    tags: ['SOC', 'Log review', 'Analytics', 'Detection']
  },
  {
    title: 'Incident Response Case Study',
    category: 'report',
    status: 'Case study',
    summary: 'Frames a realistic incident timeline, handling of evidence, containment, recovery, and lessons learned.',
    tags: ['IR', 'Timeline', 'Evidence', 'Recovery']
  },
  {
    title: 'Phishing Email Analyzer',
    category: 'tool',
    status: 'Decision support',
    summary: 'Assesses suspicious messages for sender mismatch, domain risk, and suspicious URL indicators without opening risky links.',
    tags: ['Email', 'Phishing', 'Threat intel', 'SOC']
  },
  {
    title: 'Secure Code Review',
    category: 'assessment',
    status: 'Demo project',
    summary: 'Documents insecure patterns and presents safer alternatives for validation, encoding, authentication, and access control.',
    tags: ['Code review', 'Secure coding', 'AppSec', 'Fixes']
  },
  {
    title: 'Vulnerability Management Dashboard',
    category: 'report',
    status: 'Dashboard',
    summary: 'Shows sample findings, severity categorisation, deadlines, ownership, and remediation tracking in a structured register.',
    tags: ['Risk', 'Remediation', 'Tracking', 'Operations']
  },
  {
    title: 'Linux Security Audit Tool',
    category: 'tool',
    status: 'Read-only',
    summary: 'Audits a host for common security settings and permissions using a defensive, read-only-by-default approach.',
    tags: ['Linux', 'Auditing', 'Hardening', 'Python']
  },
  {
    title: 'Cybersecurity Risk Assessment',
    category: 'report',
    status: 'Risk register',
    summary: 'Builds a sample asset, threat, and vulnerability register with scoring, controls, and treatment recommendations.',
    tags: ['GRC', 'Risk', 'Controls', 'Frameworks']
  }
];

const projectList = document.getElementById('projectList');
const searchInput = document.getElementById('projectSearch');
const filterButtons = document.querySelectorAll('.filter-chip');
let activeFilter = 'all';

function renderProjects() {
  if (!projectList) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const visibleProjects = projects.filter((project) => {
    const matchesFilter = activeFilter === 'all' || project.category === activeFilter;
    const haystack = [project.title, project.summary, project.status, project.tags.join(' ')]
      .join(' ')
      .toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesFilter && matchesSearch;
  });

  projectList.innerHTML = visibleProjects
    .map(
      (project) => `
        <article class="project-card">
          <div class="project-header">
            <span>${project.status}</span>
            <span>${project.category}</span>
          </div>
          <div>
            <h3>${project.title}</h3>
            <p>${project.summary}</p>
          </div>
          <div class="project-meta">
            ${project.tags.map((tag) => `<span>${tag}</span>`).join('')}
          </div>
        </article>
      `
    )
    .join('');

  if (!visibleProjects.length) {
    projectList.innerHTML = `<article class="project-card"><h3>No matching projects</h3><p>Try a broader keyword or switch the current filter.</p></article>`;
  }
}

if (searchInput) {
  searchInput.addEventListener('input', renderProjects);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((chip) => chip.classList.toggle('is-active', chip === button));
    renderProjects();
  });
});

const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = window.localStorage.getItem('portfolio-theme');
const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
document.body.dataset.theme = initialTheme;

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = nextTheme;
    window.localStorage.setItem('portfolio-theme', nextTheme);
  });
}

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  let isSubmitting = false;

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const contactNumber = String(formData.get('contact_number') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !subject || !message) {
      setFormStatus('Please complete all fields before sending your message.', 'error');
      return;
    }

    if (!emailPattern.test(email)) {
      setFormStatus('Please enter a valid email address.', 'error');
      return;
    }

    if (name.length > 100 || email.length > 254 || contactNumber.length > 30 || subject.length > 200 || message.length > 5000) {
      setFormStatus('One or more fields exceed the allowed length.', 'error');
      return;
    }

    if (message.length < 20) {
      setFormStatus('Please provide a message with at least 20 characters.', 'error');
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending…';
    setFormStatus('Sending your message…');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, contact_number: contactNumber, subject, message }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.error || 'The server could not save your message.');
      }

      setFormStatus(result.message || 'Your message was sent successfully.', 'success');
      contactForm.reset();
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      setFormStatus(
        isNetworkError
          ? 'Unable to reach the server. Please check that it is running and try again.'
          : error.message,
        'error',
      );
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitButton.textContent = 'Send Message';
    }
  });
}

function setFormStatus(text, type) {
  if (!formStatus) return;

  formStatus.textContent = text;
  formStatus.classList.remove('success', 'error');

  if (type) {
    formStatus.classList.add(type);
  }
}

renderProjects();
