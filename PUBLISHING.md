# Building and publishing

Project: **Russian Font Display Fix & Extras 1.0.3**. Keep the mod UUID unchanged when publishing updates. The manifest and source VERSION must match.

1. Run `node --test tests/*.test.mjs` with Node.js 20+, then `python build.py` with Python 3.10+. No extra Python packages are required.
2. Check the generated entry, archive paths/CRC, font licenses, and SHA-256 sums. Exclude credentials, personal configuration, saves, logs, game/engine files, and installed-pack records.
3. Commit the complete source and generated entry. Tag the matching commit `v1.0.3` and publish a GitHub release.
4. Attach `Russian_Font_Display_Fix_Extras_1.0.3.zip`, `Russian_Font_Display_Fix_Extras_1.0.3_Source.zip`, and `SHA256SUMS.txt`. Players install the first ZIP; the second includes all mod and gallery source.
5. Use [CHANGELOG.md](CHANGELOG.md) for release notes. Do not embed game screenshots in release descriptions. The README may show the generated preview of the recommended five-font preset. Existing gallery screenshots show earlier versions and user-selected settings.
6. Verify the published tag/commit, asset downloads/checksums, documentation links, and gallery.

For development and player updates, import the ZIP/folder through GP-Next. Do not edit `gp-next/installed/`: its bytes are verified against the recorded digest, and direct edits cause `INSTALL_CORRUPT`. Changed scripts need renewed trust if prompted.

The manifest accepts GP-Next `>=1.5.4 <2.0.0`, API v2 and pack format v1, and requires `experimental.jsModding`. Isolated checks cover Gardendless 0.15.0 / Cocos 3.8.4 and GP-Next 1.5.4/1.5.5. A separate translation pack is required for Russian text. Other versions/mods may need adaptation.

Retain the publisher's AI OpenAI GPT 6.1 declaration, no-support/no-maintenance commitment, MIT notice, and third-party SIL OFL 1.1 notices. Complete source may be downloaded, modified, forked, redistributed, and used personally or commercially under those licenses.

## Project website

GitHub Pages publishes `main:/docs`. Run `python tools/build_site.py` after changing website copy or the mod version, then `python tools/check_site.py`. Commit the generated HTML, `docs/sitemap.xml`, preview asset and their source together. Update `UPDATED` in the site builder only when page content changes significantly. Keep both languages at stable, separate URLs with reciprocal `hreflang` and self-canonical links.

Website/documentation-only changes can be pushed to `main` without creating a new mod release or replacing existing release assets. See [SEARCH_VISIBILITY.md](SEARCH_VISIBILITY.md) for search-engine ownership verification and sitemap submission. Preserve real verification tags/files if added later; do not invent verification tokens or add them to a published release package.
