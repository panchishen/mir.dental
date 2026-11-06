"""Download the latest 200 snapshot of every mir.dental URL from the Wayback Machine.

Sequential and throttled: web.archive.org firewalls clients that request too fast.
Usage: python -I download.py <cdx_file> <out_dir> [delay_seconds]
"""
import gzip
import json
import os
import sys
import time
import urllib.parse
import urllib.request

cdx_file, out_dir = sys.argv[1], sys.argv[2]
DELAY = float(sys.argv[3]) if len(sys.argv) > 3 else 2.5
SKIP = ("zerif-lite", "pirate-forms", "revslider", "wp-json", "xmlrpc")
PRIORITY = {"text/html": 0, "text/css": 1, "application/x-javascript": 1, "text/javascript": 1}


def local_path(url):
    path = urllib.parse.unquote(urllib.parse.urlsplit(url).path)
    if path.endswith("/") or path == "":
        path += "index.html"
    elif "." not in os.path.basename(path):
        path += "/index.html"
    return os.path.join(out_dir, *[s for s in path.split("/") if s])


latest = {}
for line in open(cdx_file, encoding="utf-8"):
    parts = line.split()
    if len(parts) < 4 or any(s in parts[2] for s in SKIP):
        continue
    _, ts, orig, mime = parts[:4]
    path = local_path(orig)
    if path not in latest or ts > latest[path][0]:
        latest[path] = (ts, orig, mime)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "site-restore/1.0", "Accept-Encoding": "identity"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    if data[:2] == b"\x1f\x8b":
        try:
            data = gzip.decompress(data)
        except OSError:
            pass
    return data


items = sorted(latest.items(), key=lambda kv: PRIORITY.get(kv[1][2], 2))
log = open(os.path.join(os.path.dirname(os.path.abspath(out_dir)), "download.log"), "a", encoding="utf-8")
ok = fail = 0
for i, (path, (ts, orig, mime)) in enumerate(items):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        # re-save earlier gzip-encoded downloads decompressed
        with open(path, "rb") as f:
            head = f.read(2)
        if head == b"\x1f\x8b" and not path.endswith(".gz"):
            try:
                data = gzip.decompress(open(path, "rb").read())
                open(path, "wb").write(data)
            except OSError:
                pass
        ok += 1
        continue
    url = f"https://web.archive.org/web/{ts}id_/{orig}"
    for attempt in range(8):
        try:
            data = fetch(url)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(data)
            ok += 1
            break
        except urllib.error.HTTPError as e:
            if e.code in (404, 403, 410):
                log.write(f"FAIL {e.code} {orig}\n")
                fail += 1
                break
            time.sleep(30)
        except Exception as e:  # connection refused = rate-limit firewall
            log.write(f"retry {attempt} {orig}: {e}\n")
            log.flush()
            time.sleep(60 * (attempt + 1))
    else:
        log.write(f"FAIL gaveup {orig}\n")
        fail += 1
    if i % 25 == 0:
        print(f"progress {i}/{len(items)} ok={ok} fail={fail}", flush=True)
    time.sleep(DELAY)

meta = {os.path.relpath(p, out_dir).replace("\\", "/"): {"ts": v[0], "url": v[1]} for p, v in latest.items()}
with open(os.path.join(os.path.dirname(os.path.abspath(out_dir)), "snapshots.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
print(f"done ok={ok} fail={fail} total={len(items)}", flush=True)
