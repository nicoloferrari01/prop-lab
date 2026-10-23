#!/usr/bin/env python3
"""Append ?v=<short sha> to local asset URLs in app/index.html.

Runs in the Pages deploy, on the copy that gets uploaded. The stamped
file is not committed. Re-running replaces an existing ?v= instead of
stacking another one.
"""
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "app" / "index.html"
META = '<meta http-equiv="Cache-Control" content="no-cache">'
LOCAL = re.compile(
    r"^(?:style\.css|app\.js|league\.js|injuries\.js|update\.js|schedule\.js|"
    r"data/(?:nba/)?[^/?#]+\.js|icon\.svg|apple-touch-icon\.png)$"
)


def short_sha():
    if len(sys.argv) > 1 and sys.argv[1]:
        return sys.argv[1][:7]
    try:
        sha = subprocess.check_output(
            ["git", "rev-parse", "--short=7", "HEAD"], cwd=ROOT, text=True
        ).strip()
        if sha:
            return sha
    except (OSError, subprocess.CalledProcessError):
        pass
    return os.environ.get("GITHUB_SHA", "dev")[:7]


def stamp(html, sha):
    if META not in html:
        html = html.replace("<head>", "<head>\n" + META, 1)
    if re.search(r"\bdata-v=\"", html):
        html = re.sub(r"\bdata-v=\"[^\"]*\"", f'data-v="{sha}"', html, count=1)
    else:
        html = html.replace("<html", f'<html data-v="{sha}"', 1)

    def bust(match):
        attr, quote, url = match.group(1), match.group(2), match.group(3)
        base = re.sub(r"\?v=[0-9a-fA-F]+$", "", url)
        if not LOCAL.match(base):
            return match.group(0)
        return f"{attr}={quote}{base}?v={sha}{quote}"

    return re.sub(r"\b(href|src)=([\"'])([^\"']+)\2", bust, html)


def main():
    sha = short_sha()
    html = HTML.read_text()
    stamped = stamp(html, sha)
    HTML.write_text(stamped)
    refs = re.findall(r"\?v=[0-9a-fA-F]+", stamped)
    print(f"stamped {len(refs)} asset refs with v={sha}")


if __name__ == "__main__":
    main()
