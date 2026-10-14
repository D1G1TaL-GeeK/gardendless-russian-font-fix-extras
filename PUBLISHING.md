# Building and publishing

Keep the font mod UUID and version **1.0.3**, and Vasebreaker rules version **1.2.0**. Build with `python build.py`; run `node --test tests/*.test.mjs`. Publish source and generated entries together.

The player-facing release has two ZIPs: **Russian_Font_Display_Fix_Extras_1.0.3.zip** and **Vasebreaker_24_Levels_And_Rules.zip**, plus **SHA256SUMS.txt**. GitHub's automatic Source code archives contain the complete repository. Vasebreaker JSON and rule-mod source are under `vasebreaker/`.

Verify CRC, package manifests, source/entry equality, licenses, hashes, tag/commit and public downloads. Do not publish credentials, personal logs, saves, installed-pack records, or game/engine resources. Keep MIT/OFL notices and the publisher's AI declaration. Use the ZIP importer for player updates; do not edit installed package bytes.

GitHub Pages publishes `main:/docs`. Its current photographs and all SEO metadata are preserved. Website edits are a separate task. Keep `SEARCH_VISIBILITY.md`, the existing repository description/topics, stable URLs, canonical/hreflang data and sitemap. The only image on the README is the recommended font preview.
