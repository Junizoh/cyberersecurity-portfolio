#!/usr/bin/env python3
"""Simple file integrity monitor using SHA-256 hashes.

This utility creates a baseline for a selected directory and reports when files change.
It is designed for monitoring controlled lab environments and should not be used as a
replacement for enterprise integrity monitoring systems.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def sha256_for_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(65536), b''):
            digest.update(chunk)
    return digest.hexdigest()


def build_baseline(root: Path) -> dict:
    baseline = {}
    for file_path in sorted(root.rglob('*')):
        if file_path.is_file() and not file_path.name.startswith('.'):
            relative = file_path.relative_to(root)
            baseline[str(relative)] = sha256_for_file(file_path)
    return baseline


def save_baseline(path: Path, baseline: dict) -> None:
    path.write_text(json.dumps(baseline, indent=2, sort_keys=True), encoding='utf-8')


def compare_baseline(root: Path, stored_baseline: dict) -> dict:
    current = build_baseline(root)
    changes = {'added': [], 'modified': [], 'missing': []}

    for relative_path, current_hash in current.items():
        previous_hash = stored_baseline.get(relative_path)
        if previous_hash is None:
            changes['added'].append(relative_path)
        elif current_hash != previous_hash:
            changes['modified'].append(relative_path)

    for relative_path in stored_baseline:
        if relative_path not in current:
            changes['missing'].append(relative_path)

    return changes


def main() -> None:
    parser = argparse.ArgumentParser(description='Create or verify a file integrity baseline for a directory.')
    parser.add_argument('path', help='Directory to scan')
    parser.add_argument('--baseline', default='integrity-baseline.json', help='Baseline file to create or compare against')
    parser.add_argument('--check', action='store_true', help='Compare the current directory against an existing baseline')
    args = parser.parse_args()

    root = Path(args.path)
    baseline_path = Path(args.baseline)

    if not root.exists():
        raise SystemExit(f'Path not found: {root}')

    if args.check:
        if not baseline_path.exists():
            raise SystemExit(f'Baseline file not found: {baseline_path}')
        stored = json.loads(baseline_path.read_text(encoding='utf-8'))
        changes = compare_baseline(root, stored)
        print('Integrity comparison results:')
        for key, values in changes.items():
            if values:
                print(f' - {key}: {values}')
            else:
                print(f' - {key}: none')
        return

    baseline = build_baseline(root)
    save_baseline(baseline_path, baseline)
    print(f'Baseline saved to {baseline_path}.')
    print(f'Files hashed: {len(baseline)}')
    print('Keep this file protected to preserve the integrity baseline.')


if __name__ == '__main__':
    main()
