# Publishing version 1.0 on GitHub

Repository name suggestion: `russian-font-display-fix-extras`.

Repository description:

> Russian font and UI fixes for PvZ2 Gardendless, font previews, startup language selection, and optional gameplay extras. AI-generated, MIT-licensed code.

1. Create a public repository and upload this project's files, including `src/`, `scripts/`, `assets/`, `tests/`, documentation, build script, and all licenses. Do not upload a ZIP as the only source file: keep the source browsable.
2. Run `python build.py`. Optionally run `node --test tests/preferences.test.mjs`.
3. Create a release with tag **v1.0** and title **Russian Font Display Fix & Extras 1.0**.
4. Attach `Russian_Font_Display_Fix_Extras_1.0.zip`, `Russian_Font_Display_Fix_Extras_1.0_Source.zip`, and `SHA256SUMS.txt` from `dist/`.
5. Use the release description below. The installable ZIP has `pack.json` at its root. Do not add an enclosing directory.

## Suggested release description

Russian Font Display Fix & Extras 1.0 improves Russian fonts, text fitting, hints, objectives, menus, the Almanac, shop layouts, and Zen Garden framing. It includes fifteen fonts, live font previews, startup language selection (Russian/English), three cheat modes, configurable coin-priced power-ups with native wallet feedback, and an optional preparation-only Last Stand copy fix.

Defaults: Ruslan Display / Shantell Sans Bold / Nunito ExtraBold, text size 68%, Russian startup language, Allow cheats (manual game-side activation), and all Game fixes checkboxes off.

Install `Russian_Font_Display_Fix_Extras_1.0.zip` through GP-Next's ZIP importer and fully restart the game. A separate Russian translation pack is required for Russian game text. Targets Gardendless 0.15.0 and GP-Next 1.5.4; later versions may require adaptation.

Project publisher's declaration: the mod code and documentation are 100% generated using AI OpenAI GPT 6.1. Third-party fonts are separately licensed under SIL OFL 1.1. Full mod source is included and may be reused under MIT. The developer/publisher has no obligation to respond to bugs, provide fixes or support, improve, maintain, or update the mod. Provided as-is, without warranty.
