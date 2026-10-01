"""Build a production ZIP without changing the GitHub Pages preview."""
import argparse
import hashlib
import json
import re
import subprocess
import zipfile
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://corexengineering.kz/'

def build(output):
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    files = {p.relative_to(ROOT).as_posix(): p.read_bytes() for p in ROOT.rglob('*')
             if p.is_file() and p.suffix in ('.html', '.css', '.js')
             and p.relative_to(ROOT).parts[0] in ('index.html', '404.html', 'solutions', 'kk', 'components', 'app.js', 'components.css', 'style.css', 'products-squeeze.js', 'scroll-film.js', 'scroll-film.css', 'team-stars.js')}
    text = '\n'.join(v.decode('utf-8') for v in files.values())
    assets = set(re.findall(r'(?:assets|documents|media)/[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+', text))
    gallery = json.loads(re.search(r'const galleryCounts=(\{[^;]+\});', text).group(1).replace("'", '"'))
    for name, count in gallery.items():
        for i in range(1, count + 1):
            assets.add('assets/gallery-metarow-2-cutout.webp' if name == 'metarow' and i == 2 else f'assets/gallery-{name}-{i}.webp')
    assets.update(['assets/golostext-OFL.txt', 'assets/unbounded-OFL.txt'])
    for asset in assets:
        files[asset] = (ROOT / asset).read_bytes()
    pages = sorted(k for k in files if k.endswith('index.html'))
    assert len(pages) == 16
    urls = []
    for path in pages:
        html = files[path].decode('utf-8')
        route = path.removesuffix('index.html')
        url = BASE + route
        urls.append(url)
        ru_route = route.removeprefix('kk/')
        ru, kk = BASE + ru_route, BASE + 'kk/' + ru_route
        html = re.sub(r'<meta name="robots"[^>]*>', '', html)
        html = re.sub(r'<link rel="(?:canonical|alternate)"[^>]*>', '', html)
        html = re.sub(r'<meta property="og:url"[^>]*>', f'<meta property="og:url" content="{url}">', html)
        tags = f'<link rel="canonical" href="{url}"><link rel="alternate" hreflang="ru-KZ" href="{ru}"><link rel="alternate" hreflang="kk-KZ" href="{kk}"><link rel="alternate" hreflang="x-default" href="{ru}">'
        files[path] = html.replace('</head>', tags + '</head>').encode('utf-8')
    files['404.html'] = '''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 - CoreX Engineering</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/components.css"></head><body><main class="section"><h1>404</h1><h2>Страница не найдена / Бет табылмады</h2><a class="button blue" href="/">CoreX Engineering</a></main></body></html>'''.encode('utf-8')
    files['robots.txt'] = f'User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n'.encode()
    files['sitemap.xml'] = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{escape(u)}</loc></url>\n' for u in urls) + '</urlset>\n').encode()
    payload = {'site/' + k: v for k, v in files.items()}
    payload['INSTALL.md'] = (ROOT / 'release' / 'INSTALL.md').read_bytes()
    payload['VERSION.txt'] = f'CoreX Engineering production release\nSource commit: {revision}\nDomain: {BASE}\n'.encode()
    payload['SHA256SUMS.txt'] = ''.join(f'{hashlib.sha256(v).hexdigest()}  {k}\n' for k, v in sorted(payload.items())).encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr(name, data)
    checksum = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(f'{checksum}  {output.name}\n', encoding='utf-8')
    print(json.dumps({'archive': str(output), 'bytes': output.stat().st_size, 'files': len(payload), 'pages': len(pages), 'source': revision, 'sha256': checksum}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    build(parser.parse_args().output.resolve())
