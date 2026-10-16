#!/usr/bin/env python3
"""
Build script that scans the pages/ directory for .html files and
generates a pages.json manifest with metadata (title, path, dates).

Dates are sourced from git history when available:
  - created:  first commit that introduced the file
  - modified: last commit that touched the file

Falls back to filesystem mtime when git info is unavailable.
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone


PAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pages")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pages.json")


def filename_to_title(filename: str) -> str:
    """Convert a filename like 'game-slient-hill.html' to 'Game Slient Hill'."""
    name = os.path.splitext(filename)[0]  # strip .html
    name = re.sub(r"[-_]+", " ", name)    # replace dashes/underscores with spaces
    return name.title()


def git_date(filepath: str, mode: str = "last") -> str | None:
    """
    Get a git date for a file.
      mode='last'  → most recent commit (modified date)
      mode='first' → earliest commit  (created date)
    Returns ISO-8601 string or None.
    """
    try:
        cmd = ["git", "log", "--format=%aI", "--follow", "--", filepath]
        if mode == "last":
            cmd.insert(2, "-1")  # only the latest commit
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().splitlines()
            return lines[-1].strip() if mode == "first" else lines[0].strip()
    except Exception:
        pass
    return None


def fs_date(filepath: str) -> str:
    """Fallback: filesystem modification time as ISO-8601."""
    ts = os.path.getmtime(filepath)
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def build_manifest():
    if not os.path.isdir(PAGES_DIR):
        os.makedirs(PAGES_DIR, exist_ok=True)
        print(f"Created empty pages/ directory.")

    entries = []
    for filename in sorted(os.listdir(PAGES_DIR)):
        if not filename.lower().endswith(".html"):
            continue

        filepath = os.path.join(PAGES_DIR, filename)
        title = filename_to_title(filename)

        created = git_date(filepath, "first") or fs_date(filepath)
        modified = git_date(filepath, "last") or fs_date(filepath)

        entries.append({
            "title": title,
            "file": filename,
            "path": f"pages/{filename}",
            "created": created,
            "modified": modified,
        })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)

    print(f"[OK] Generated {OUTPUT_FILE} with {len(entries)} page(s).")


if __name__ == "__main__":
    build_manifest()
