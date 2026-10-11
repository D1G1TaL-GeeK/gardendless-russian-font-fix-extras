"""Validate the generated Pages site's crawlable URLs and static HTML."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import json
import struct
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
BASE = "https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/"


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.ids = []
        self.title = ""
        self.schema = ""
        self.text = ""
        self.in_title = False
        self.in_schema = False
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "title":
            self.in_title = True
        if tag == "script":
            self.in_script = True
            self.in_schema = attrs.get("type") == "application/ld+json"

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script":
            self.in_script = self.in_schema = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_schema:
            self.schema += data
        if not self.in_script:
            self.text += data + " "

    def find(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]


def local_path(url):
    assert url.startswith(BASE), f"Unexpected local URL: {url}"
    relative = unquote(urlsplit(url).path[len(urlsplit(BASE).path):])
    path = DOCS / relative
    if urlsplit(url).path.endswith("/"):
        path /= "index.html"
    assert path.resolve().is_relative_to(DOCS.resolve()), f"Path escapes docs: {url}"
    assert path.is_file(), f"Broken local link: {url}"
    return path


def main():
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "image": "http://www.google.com/schemas/sitemap-image/1.1"}
    tree = ET.parse(DOCS / "sitemap.xml")
    urls = [entry.text for entry in tree.findall("s:url/s:loc", ns)]
    assert len(urls) == len(set(urls)) == 4, "Sitemap must list four distinct canonical HTML pages"
    pages = {}
    for url in urls:
        page = Page()
        page.feed(local_path(url).read_text(encoding="utf-8"))
        pages[url] = page
    titles, descriptions = [], []
    checks = 0
    version = json.loads((ROOT / "pack.json").read_text(encoding="utf-8"))["version"]
    for url, page in pages.items():
        language = page.find("html")[0]["lang"]
        assert language in ("en", "ru")
        assert len(page.find("h1")) == 1
        assert all(count == 1 for count in Counter(page.ids).values()), f"Duplicate IDs: {url}"
        assert 15 <= len(page.title) <= 100
        titles.append(page.title)
        description = page.find("meta", name="description")[0]["content"]
        assert 80 <= len(description) <= 250
        descriptions.append(description)
        assert page.find("link", rel="canonical")[0]["href"] == url
        assert "noindex" not in page.find("meta", name="robots")[0]["content"].lower()
        assert not page.find("meta", name="keywords")
        assert page.find("meta", property="og:url")[0]["content"] == url
        assert page.find("meta", property="og:title")[0]["content"] == page.title
        schema = json.loads(page.schema)
        application = next(node for node in schema["@graph"] if node["@type"] == "SoftwareApplication")
        assert application["softwareVersion"] == version
        assert "aggregateRating" not in application
        assert application["offers"]["price"] == "0"
        for alternate in page.find("link", rel="alternate"):
            linked = pages[alternate["href"]]
            if alternate["hreflang"] != "x-default":
                assert linked.find("html")[0]["lang"] == alternate["hreflang"]
                assert any(item["href"] == url and item["hreflang"] == language for item in linked.find("link", rel="alternate"))
        assert len(page.find("link", rel="alternate")) == 3
        for tag, attrs in page.tags:
            target = attrs.get("href") if tag in ("a", "link") else attrs.get("src")
            if target and urljoin(url, target).startswith(BASE):
                absolute = urljoin(url, target)
                path = local_path(absolute)
                fragment = urlsplit(absolute).fragment
                if fragment:
                    owner_url = absolute.split("#", 1)[0]
                    assert owner_url in pages and fragment in pages[owner_url].ids, f"Missing anchor: {absolute}"
                checks += 1
            if tag == "img":
                assert attrs.get("alt") and attrs.get("width") and attrs.get("height")
                data = local_path(attrs["src"]).read_bytes()
                assert data.startswith(b"\x89PNG\r\n\x1a\n")
                assert struct.unpack(">II", data[16:24]) == (int(attrs["width"]), int(attrs["height"]))
        if "/installation/" not in url:
            assert len([a for a in page.find("a") if "data-screenshot" in a]) == 20
        else:
            assert "INSTALL_CORRUPT" in page.text and "F9" in page.text
        assert len(page.text.strip()) > 1200, "Missing static page content"
    assert len(set(titles)) == len(set(descriptions)) == 4
    images = tree.findall("s:url/image:image/image:loc", ns)
    assert len(images) == 42
    for entry in images:
        local_path(entry.text)
    print(f"PASS: 4 static pages, metadata, reciprocal languages, JSON-LD, {checks} local links/resources, 42 sitemap image entries; all gallery thumbnails available without JavaScript")


if __name__ == "__main__":
    main()
