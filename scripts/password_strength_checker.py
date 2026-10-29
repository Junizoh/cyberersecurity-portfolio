#!/usr/bin/env python3
"""Local password strength checker for educational use.

This tool checks password characteristics without storing or transmitting the password.
It is intentionally heuristic and should not be treated as a security guarantee.
"""

from __future__ import annotations

import re
from typing import Dict, List

COMMON_PATTERNS = (
    'password', 'pass123', 'admin', 'welcome', 'qwerty', 'letmein', '123456',
    'welcome1', 'changeme', 'secret', 'iloveyou'
)


def evaluate_password(password: str) -> Dict[str, object]:
    """Return a security-oriented evaluation for a password candidate."""
    if not isinstance(password, str):
        raise TypeError('Password must be a string.')

    score = 0
    reasons: List[str] = []
    length = len(password)

    if length >= 16:
        score += 2
        reasons.append('Long enough for a stronger baseline.')
    elif length >= 12:
        score += 1
        reasons.append('Moderate length.')
    else:
        reasons.append('Too short; use at least 12 characters when possible.')

    if re.search(r'[a-z]', password) and re.search(r'[A-Z]', password):
        score += 1
    else:
        reasons.append('Add uppercase and lowercase characters.')

    if re.search(r'\d', password):
        score += 1
    else:
        reasons.append('Add at least one digit.')

    if re.search(r'[^A-Za-z0-9]', password):
        score += 1
    else:
        reasons.append('Add a special character.')

    if any(pattern in password.lower() for pattern in COMMON_PATTERNS):
        reasons.append('Avoid common words, names, and obvious sequences.')
    else:
        score += 1

    if re.search(r'(.)\1{2,}', password):
        reasons.append('Reduce repeated characters and patterns.')
    else:
        score += 1

    if re.search(r'(012|123|234|345|456|567|678|789|890|901)', password):
        reasons.append('Avoid sequences such as 1234 or abcde.')
    else:
        score += 1

    # Clamp score into a simple 0-4 scale.
    rating = 0 if score <= 3 else 1 if score <= 5 else 2 if score <= 7 else 3 if score <= 9 else 4
    labels = ['Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong']

    return {
        'length': length,
        'score': rating,
        'label': labels[rating],
        'reasons': reasons,
    }


def main() -> None:
    password = input('Enter a password to evaluate (input is not stored or transmitted): ').strip()
    if not password:
        print('No password entered.')
        return

    report = evaluate_password(password)
    print(f"Password length: {report['length']}")
    print(f"Overall rating: {report['label']} (score {report['score']}/4)")
    print('Guidance:')
    for item in report['reasons']:
        print(f' - {item}')
    print('\nNote: This tool is a heuristic and cannot guarantee password safety.')


if __name__ == '__main__':
    main()
