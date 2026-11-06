"""Turn the raw Wayback dump into a static site that works under any sub-path (GitHub Pages).

- absolute (https://mir.dental/...) and root-relative (/...) URLs in markup and CSS -> relative
- ?ver=... stripped from local asset URLs (files are stored without query strings)
- preview shim injected: modal forms show contacts, form submission disabled
- robots noindex, Yandex.Metrika removed (so the preview does not skew client stats)
- prints local resources that are referenced but missing (missing.txt)

Usage: python -I build.py <raw_dir> <out_dir> <shim_js>
"""
import os
import re
import shutil
import sys
import urllib.parse

raw, out, shim = sys.argv[1], sys.argv[2], sys.argv[3]
BASE_PATH = sys.argv[4] if len(sys.argv) > 4 else "/mir.dental/"  # GitHub Pages project path
HOST = r"(?:https?:)?//(?:www\.)?mir\.dental"
TEXT_EXT = {".html", ".css", ".js", ".xml", ".json", ".txt", ".svg"}
missing = set()


def rel_prefix(rel_file):
    depth = rel_file.count("/")
    return "../" * depth if depth else "./"


def local_target(path):
    """Map a site path (no host) to the file it is stored in, or None."""
    p = urllib.parse.unquote(path.split("#")[0].split("?")[0])
    if p.endswith("/") or p == "":
        p += "index.html"
    elif "." not in os.path.basename(p):
        p += "/index.html"
    return p.lstrip("/")


def fix_url(url, prefix, keep_query_for_pages=True):
    """url is either host-absolute or root-relative. Return the relative form."""
    m = re.match(HOST + r"(/.*)?$", url)
    path = (m.group(1) or "/") if m else url
    if not path.startswith("/") or path.startswith("//"):
        return url
    if path.startswith(("/wp-admin", "/wp-json", "/xmlrpc", "/feed", "/comments/feed")):
        return url
    base, _, frag = path.partition("#")
    base, _, query = base.partition("?")
    # WordPress id links (/?p=123, /?post_type=service&p=123, /?page_id=123) -> real page
    if base == "/" and query:
        q = urllib.parse.parse_qs(query)
        pid = (q.get("p") or q.get("page_id") or [None])[0]
        if pid and pid in ID_MAP:
            base, query = ID_MAP[pid], ""
    target = local_target(base)
    exists = os.path.exists(os.path.join(out, target))
    # WP Fastest Cache bundles of older snapshots are not archived: use the newest bundle of the same group
    if not exists and base in ASSET_ALIAS:
        base = ASSET_ALIAS[base]
        target, exists, query = base.lstrip("/"), True, ""
    m_css = re.match(r"/wp-content/cache/wpfc-minified/([^/]+)/[^/]+\.css$", base)
    if not exists and m_css and m_css.group(1) in CSS_FALLBACK:
        base = f"/wp-content/cache/wpfc-minified/{m_css.group(1)}/{CSS_FALLBACK[m_css.group(1)]}"
        target, exists, query = base.lstrip("/"), True, ""
    if not exists:
        missing.add(base)
    is_page = target.endswith("index.html")
    new = prefix + base.lstrip("/")
    if new == prefix and prefix == "./":
        new = "./"
    if query and is_page and keep_query_for_pages:
        new += "?" + query
    if frag:
        new += "#" + frag
    return new


ATTR_RE = re.compile(r'''((?:href|src|poster|action|data-[\w-]+)\s*=\s*)(["'])(.*?)\2''', re.I | re.S)
SRCSET_RE = re.compile(r'''((?:srcset|data-srcset)\s*=\s*)(["'])(.*?)\2''', re.I | re.S)
CSS_URL_RE = re.compile(r'''url\(\s*(["']?)([^"')]+)\1\s*\)''', re.I)
ABS_IN_TEXT = re.compile(HOST + r"(/[^\s\"'<>)\\]*)")


def is_local(u):
    return bool(re.match(HOST + r"(/|$)", u)) or (u.startswith("/") and not u.startswith("//"))


CUSTOM_PROP_URL_RE = re.compile(r'''(--[\w-]+\s*:\s*url\(\s*)(["']?)([^"')]+)\2''')


def fix_css(text, prefix):
    # url() inside a custom property resolves against the stylesheet that uses var(),
    # not the one that defines it -> use an absolute path with the site base.
    def prop(m):
        u = m.group(3).strip()
        if not is_local(u):
            return m.group(0)
        rel = fix_url(u, "")
        return f"{m.group(1)}{m.group(2)}{BASE_PATH}{rel}{m.group(2)}"
    text = CUSTOM_PROP_URL_RE.sub(prop, text)

    def rep(m):
        q, u = m.group(1), m.group(2).strip()
        if u.startswith(BASE_PATH):  # already handled as a custom property
            return m.group(0)
        return f"url({q}{fix_url(u, prefix)}{q})" if is_local(u) else m.group(0)
    return CSS_URL_RE.sub(rep, text)


def fix_html(text, prefix):
    def attr(m):
        name, q, val = m.group(1), m.group(2), m.group(3)
        if is_local(val.strip()):
            return f"{name}{q}{fix_url(val.strip(), prefix)}{q}"
        return m.group(0)

    def srcset(m):
        name, q, val = m.group(1), m.group(2), m.group(3)
        parts = []
        for item in val.split(","):
            bits = item.strip().split(None, 1)
            if bits and is_local(bits[0]):
                bits[0] = fix_url(bits[0], prefix)
            parts.append(" ".join(bits))
        return f"{name}{q}{', '.join(parts)}{q}"

    # keep canonical / og / JSON-LD pointing to the real domain: only rewrite attributes and CSS
    keep = "\x00KEEP\x00"
    text = re.sub(r'<link[^>]*rel=["\'](?:canonical|alternate|shortlink|https://api\.w\.org/)["\'][^>]*>',
                  lambda m: m.group(0).replace("mir.dental", keep), text, flags=re.I)
    text = SRCSET_RE.sub(srcset, text)
    text = ATTR_RE.sub(lambda m: attr(m) if not m.group(1).lower().startswith(("srcset", "data-srcset")) else m.group(0), text)
    text = text.replace(keep, "mir.dental")
    text = re.sub(r"(<style[^>]*>)(.*?)(</style>)", lambda m: m.group(1) + fix_css(m.group(2), prefix) + m.group(3), text, flags=re.S | re.I)
    text = re.sub(r'(style=")([^"]*)(")', lambda m: m.group(1) + fix_css(m.group(2), prefix) + m.group(3), text)
    # analytics off in preview
    text = re.sub(r"<script[^>]*>(?:(?!</script>).)*mc\.yandex\.ru/metrika(?:(?!</script>).)*</script>", "", text, flags=re.S)
    text = re.sub(r"<noscript>(?:(?!</noscript>).)*mc\.yandex\.ru(?:(?!</noscript>).)*</noscript>", "", text, flags=re.S)
    text = re.sub(r'<meta name=["\']robots["\'][^>]*>', "", text, flags=re.I)
    head_inject = '<meta name="robots" content="noindex, nofollow">'
    text = re.sub(r"<head([^>]*)>", lambda m: m.group(0) + head_inject, text, count=1, flags=re.I)
    shim_tag = f'<script src="{prefix}preview-shim.js"></script>'
    if "</body>" in text:
        text = text.replace("</body>", shim_tag + "</body>", 1)
    else:
        text += shim_tag
    return text


if os.path.exists(out):
    for name in os.listdir(out):
        if name in (".git", ".gitignore", ".claude", "README.md", "tools", "404.html"):
            continue
        p = os.path.join(out, name)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
shutil.copytree(raw, out, dirs_exist_ok=True)
shutil.copy(shim, os.path.join(out, "preview-shim.js"))

# assets of older snapshots that were replaced on the live site and not archived
ASSET_ALIAS = {"/wp-content/uploads/2026/04/logo-mir-g.svg": "/wp-content/uploads/2026/06/logomir-2.svg"}
CSS_FALLBACK = {"1f76qh4o": "htjfk.css", "d2jfehqa": "htjfk.css", "lcrfu92d": "g3sxk.css"}

ID_MAP = {}
for root, _, files in os.walk(raw):
    if "index.html" in files:
        with open(os.path.join(root, "index.html"), "rb") as f:
            head = f.read(200000).decode("utf-8", "ignore")
        m = re.search(r'<body[^>]*class="[^"]*\b(?:postid|page-id)-(\d+)', head)
        if m:
            rel_dir = os.path.relpath(root, raw).replace("\\", "/")
            ID_MAP[m.group(1)] = "/" if rel_dir == "." else "/" + rel_dir + "/"

for root, _, files in os.walk(out):
    top = os.path.relpath(root, out).split(os.sep)[0]
    if top in (".git", ".claude", "tools"):
        continue
    for name in files:
        path = os.path.join(root, name)
        rel = os.path.relpath(path, out).replace("\\", "/")
        ext = os.path.splitext(name)[1].lower()
        if ext not in TEXT_EXT or rel in ("preview-shim.js", "404.html"):
            continue
        with open(path, "rb") as f:
            data = f.read()
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        prefix = rel_prefix(rel)
        if ext == ".html":
            text = fix_html(text, prefix)
        elif ext == ".css":
            text = fix_css(text, prefix)
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(text)

# GitHub Pages: do not run Jekyll (it would drop files/dirs starting with "_")
open(os.path.join(out, ".nojekyll"), "w").close()
with open(os.path.join(os.path.dirname(os.path.abspath(raw)), "missing.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(sorted(missing)))
print("missing:", len(missing))
