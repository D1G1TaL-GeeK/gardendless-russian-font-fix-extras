# Search visibility of the Gardendless font mod

The public GitHub repository and its GitHub Pages website serve different purposes. The repository contains source, documentation and release downloads. The website presents the mod, its fonts, compatibility and installation in English and Russian. Neither is guaranteed to appear in a search engine.

## Implemented on 2026-10-11

- A clear bilingual repository description and 20 relevant GitHub topics.
- README introductions naming PvZ2 / Plants vs. Zombies 2, Gardendless, GP-Next, Russian fonts, Cyrillic and the separate translation requirement.
- Four static HTML pages: English and Russian project pages, plus an installation guide in each language. Important copy, navigation and all screenshot links are available without JavaScript.
- Unique page titles/descriptions, one main heading per page, self-canonical links, reciprocal EN/RU `hreflang` with `x-default`, and explicit index/follow directives.
- Open Graph and Twitter metadata using the existing preview of the actual recommended fonts. Structured data describes the free mod and its current version; no ratings or reviews are invented.
- A UTF-8 XML sitemap containing the four canonical pages and the preview/gallery images. Each HTML footer links to it.
- Accessible image descriptions, declared dimensions, deferred gallery scripting and lazy loading for the existing large screenshots.
- Content-specific script/style filenames prevent an older cached gallery script from running against newly published HTML.
- Mutual links between the repository, website, documentation and release downloads. The existing repository URL and release links remain stable.

## Checks and hosting limits

The repository is public and unarchived. Anonymous requests return HTTP 200, with no observed `noindex` meta tag or `X-Robots-Tag`. The Pages website is served over HTTPS; missing URLs return a real HTTP 404. A check from this machine cannot prove that Google's own crawler has fetched or indexed a URL.

`https://d1g1tal-geek.github.io/robots.txt` returned HTTP 404 during the audit. A missing robots file is not a crawl prohibition. A robots.txt file placed inside this project subdirectory would not control crawling: robots rules belong at the origin root. The sitemap is hosted at the project root and is valid for these project pages. [Google's robots.txt documentation](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

GitHub controls the repository's HTML head, HTTP responses and github.com robots rules. A repository README cannot install a working Google verification meta tag or override those platform settings. The owner can verify the **Pages website**, where the HTML source is under this project's control.

## Google Search Console: owner setup

1. Open [Google Search Console](https://search.google.com/search-console/welcome) in your own Google account.
2. Add a **URL-prefix** property with this exact address, including HTTPS and the final slash:

   `https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/`

3. Choose **HTML tag** verification and copy Google's actual `google-site-verification` tag. Add its exact value to the site's source generator so the tag remains after rebuilding, publish, then press Verify. Alternatively, publish Google's exact verification HTML file at the URL it specifies. Do not request passwords, account cookies, or recovery codes.
4. In **Sitemaps**, submit `sitemap.xml` (full address below).
5. In **URL inspection**, inspect the English and Russian homepages and installation guides. Run a live test, then request indexing once. Repeating requests does not make crawling faster.
6. Use the Page indexing report to distinguish “Discovered — currently not indexed”, “Crawled — currently not indexed”, a chosen alternate canonical, or an actual fetch/blocking error. Review the specific reported reason before making further changes.

Sitemap: [sitemap.xml](https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/sitemap.xml).

This ownership step and submission were **not performed automatically**: no verified Search Console account or verification token was available. Verification proves control, not search ranking. [Google verification instructions](https://support.google.com/webmasters/answer/9008080), [sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## Other search engines and useful discovery

The same static pages and sitemap can be used in [Bing Webmaster Tools](https://www.bing.com/webmasters/) and [Yandex Webmaster](https://webmaster.yandex.com/). Their site ownership verification requires the owner's account and the exact provider-issued verification token/file. The site has no engine-specific crawl exclusions under our control. No account connection or submission to these services is claimed here.

Relevant community guides or a mod listing may link to the repository or installation page when helpful to real players. Such a link can make discovery easier; this work did not post messages, create artificial backlinks, buy links/stars or submit to unrelated directories.

## Keyword choices and expectations

Useful phrases appear naturally in the title, description and explanatory copy: “PvZ2 Gardendless Russian font fix”, “GP-Next mod”, “Cyrillic fonts”, “Gardendless русские шрифты”, “исправление кириллицы”, “установка мода GP-Next” and “автоподбор солнца”. The page explicitly explains that a separate русификатор is needed instead of advertising a full translation it does not provide.

GitHub topics help visitors discover relevant repositories on GitHub; they are not a guaranteed Google ranking factor. `meta keywords` is unused by Google, so it is deliberately omitted. No new repository name, custom domain, tracking service or duplicate keyword-only pages are needed for this work. The mod's AI provenance and license notices remain visible.

Google may need days or weeks to recrawl; indexing and position depend on its own assessment of the pages. Search results or a `site:` query are not a substitute for an owner's Search Console inspection. [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [GitHub topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).
