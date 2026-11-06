"""Look up pages missing from Wayback in Common Crawl and extract them from WARC files.

Usage: python -I cc_fetch.py <missing.txt> <raw_dir>
"""
import gzip
import json
import os
import sys
import time
import urllib.request

missing_file, raw = sys.argv[1], sys.argv[2]
UA = {"User-Agent": "site-restore/1.0"}


def get(url, headers=None, timeout=120):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={**UA, **(headers or {})})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return b""
            time.sleep(5 * (attempt + 1))
        except Exception:
            time.sleep(5 * (attempt + 1))
    return None


crawls = [c["id"] for c in json.loads(get("https://index.commoncrawl.org/collinfo.json"))][:12]
pages = [l.strip() for l in open(missing_file, encoding="utf-8") if l.strip() and l.strip().endswith("/")]
found = 0
for page in pages:
    target = os.path.join(raw, *page.strip("/").split("/"), "index.html")
    if os.path.exists(target):
        continue
    for crawl in crawls:
        body = get(f"https://index.commoncrawl.org/{crawl}-index?url=https://mir.dental{page}&output=json")
        recs = []
        for line in (body or b"").decode("utf-8", "ignore").splitlines():
            try:
                r = json.loads(line)
            except ValueError:
                continue
            if r.get("status") == "200":
                recs.append(r)
        if not recs:
            continue
        r = max(recs, key=lambda x: x["timestamp"])
        off, length = int(r["offset"]), int(r["length"])
        data = get("https://data.commoncrawl.org/" + r["filename"], {"Range": f"bytes={off}-{off + length - 1}"})
        if not data:
            continue
        warc = gzip.decompress(data)
        # WARC headers \r\n\r\n HTTP headers \r\n\r\n body
        parts = warc.split(b"\r\n\r\n", 2)
        if len(parts) < 3:
            continue
        http_headers, html = parts[1].lower(), parts[2]
        if b"content-encoding: gzip" in http_headers:
            try:
                html = gzip.decompress(html)
            except OSError:
                pass
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "wb") as f:
            f.write(html)
        found += 1
        print("CC", r["timestamp"], page, flush=True)
        break
    else:
        print("none", page, flush=True)
print("found", found, "of", len(pages))
