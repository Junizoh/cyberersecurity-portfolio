#!/usr/bin/env python3
"""Read-only HTTP security headers analyzer.

This script checks a target URL for common security headers. It is intended for
explicitly authorised targets only and uses timeouts and safe error handling.
"""

from __future__ import annotations

import argparse
import ssl
from urllib import error, request

RECOMMENDED_HEADERS = {
    'Strict-Transport-Security': 'Enable HSTS for HTTPS to reduce downgrade and MITM risk.',
    'X-Frame-Options': 'Prevent clickjacking by denying framing or restricting it to same-origin.',
    'X-Content-Type-Options': 'Set to nosniff to stop MIME confusion.',
    'Content-Security-Policy': 'Reduce XSS and injection risk through well-scoped content policies.',
    'Referrer-Policy': 'Control how much referrer information is sent.',
    'Permissions-Policy': 'Restrict browser features and APIs that are not required.',
}


def analyze_headers(target_url: str, timeout: int = 10) -> dict:
    """Return a summary of the target URL and relevant security headers."""
    url = target_url if '://' in target_url else f'https://{target_url}'
    headers = {}

    try:
        ctx = ssl.create_default_context()
        req = request.Request(url, headers={'User-Agent': 'SecurityHeadersAnalyzer/1.0'})
        with request.urlopen(req, timeout=timeout, context=ctx) as response:
            status = response.status
            headers = dict(response.headers.items())
    except error.HTTPError as exc:
        return {
            'url': url,
            'status': exc.code,
            'error': f'HTTP error received: {exc.reason}',
            'headers': {},
        }
    except Exception as exc:  # pragma: no cover - error path exercised during CLI use
        return {
            'url': url,
            'status': None,
            'error': f'Unable to fetch target: {exc}',
            'headers': {},
        }

    missing = []
    findings = []
    for name, guidance in RECOMMENDED_HEADERS.items():
        if name in headers:
            findings.append(f'{name}: {headers[name]}')
        else:
            missing.append(f'{name} missing')

    return {
        'url': url,
        'status': status,
        'headers': headers,
        'findings': findings,
        'missing': missing,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description='Check common HTTP security headers for an authorised target.')
    parser.add_argument('target', help='URL to review, for example https://example.com or example.com')
    parser.add_argument('--timeout', type=int, default=10, help='Request timeout in seconds (default: 10)')
    args = parser.parse_args()

    result = analyze_headers(args.target, timeout=args.timeout)
    print(f'Target: {result["url"]}')
    if result.get('status') is not None:
        print(f'Status: {result["status"]}')
    if result.get('error'):
        print(f'Error: {result["error"]}')

    if result['findings']:
        print('Present headers:')
        for item in result['findings']:
            print(f' - {item}')

    if result['missing']:
        print('Missing or weak headers:')
        for item in result['missing']:
            print(f' - {item}')

    if not result['findings'] and not result['missing']:
        print('No headers were returned by the server.')

    print('\nRemediation guidance:')
    for name, guidance in RECOMMENDED_HEADERS.items():
        print(f' - {name}: {guidance}')


if __name__ == '__main__':
    main()
