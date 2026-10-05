"""Check a handoff ZIP without extracting it (Python 3.9+)."""
import argparse
import hashlib
from html.parser import HTMLParser
import posixpath
import re
from urllib.parse import unquote, urlsplit
import zipfile


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs, self.ids = [], set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for key in ('src', 'href'):
            if key in attrs:
                self.refs.append(attrs[key])
        for key in ('srcset', 'data-srcset'):
            if attrs.get(key, '').startswith('data:'):
                continue
            self.refs.extend(part.strip().split()[0] for part in attrs.get(key, '').split(',') if part.strip())


def verify(path):
    with zipfile.ZipFile(path) as archive:
        assert archive.testzip() is None, 'ZIP CRC failure'
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate filenames'
        assert all(not n.startswith('/') and '..' not in n.split('/') for n in names), 'Unsafe paths'
        data = {n: archive.read(n) for n in names}
    allowed_top = {'INSTALL.md', 'VERSION.txt', 'SHA256SUMS.txt'}
    assert all(n.startswith('site/') or n in allowed_top for n in names)
    assert not any(re.search(r'(^|/)(\.git|node_modules|video|analysis|output|typography|release)(/|$)', n) for n in names)
    sums = dict(line.split('  ', 1)[::-1] for line in data['SHA256SUMS.txt'].decode().splitlines())
    assert set(sums) == set(data) - {'SHA256SUMS.txt'}
    for name, checksum in sums.items():
        assert hashlib.sha256(data[name]).hexdigest() == checksum, name
    docs = {n: Document(b.decode('utf-8-sig')) for n, b in data.items() if n.endswith('.html')}
    assert len(docs) == 17
    count = 0
    for name, doc in docs.items():
        for ref in doc.refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc:
                continue
            dest = posixpath.normpath('site/' + unquote(url.path).lstrip('/') if url.path.startswith('/') else posixpath.join(posixpath.dirname(name), unquote(url.path))) if url.path else name
            if dest not in data:
                dest = dest.rstrip('/') + '/index.html'
            assert dest in data, (name, ref, dest)
            if url.fragment and dest in docs:
                assert unquote(url.fragment) in docs[dest].ids, (name, ref)
            count += 1
    for name, body in data.items():
        if name.endswith('.css'):
            for ref in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)', body.decode()):
                if urlsplit(ref).scheme:
                    continue
                dest = posixpath.normpath(posixpath.join(posixpath.dirname(name), urlsplit(ref).path))
                assert dest in data, (name, ref)
        if name.endswith('/index.html'):
            text = body.decode()
            assert 'noindex' not in text and 'rel="canonical"' in text and text.count('hreflang=') == 3, name
            assert 'tel:+77017000012' in text, name
    assert data['site/sitemap.xml'].count(b'<loc>') == 16
    print(f'PASS: {len(data)} files, 17 HTML, {count} local HTML references, CSS resources, SEO, checksums, archive contents')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive')
    verify(parser.parse_args().archive)
