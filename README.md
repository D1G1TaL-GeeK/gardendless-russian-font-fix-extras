# PvZ2 Gardendless — Russian Font Display Fix & Extras

**Version 1.0.3.** A free **GP-Next** mod for **Plants vs. Zombies 2: Gardendless**: readable Russian/Cyrillic fonts, interface and dialogue fixes, separate auto-collection settings, coin-priced boosters and optional 1–10× speed.

**По-русски:** русские шрифты и исправления интерфейса PvZ2 Gardendless. Для русского текста игры нужен отдельный русификатор. [Описание и установка на русском](README.ru.md).

This update also **partially restores Vasebreaker**: a separate pack with **12 regular and 12 endless levels** across 12 worlds, with randomized contents and restored vase rules.

[Latest release 1.0.3](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/releases/tag/v1.0.3) · [Project website](https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/) · [Website installation guide](https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/installation/)

## Downloads

| File | What it contains |
| --- | --- |
| [Russian_Font_Display_Fix_Extras_1.0.3.zip](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/releases/download/v1.0.3/Russian_Font_Display_Fix_Extras_1.0.3.zip) | Font and interface mod; import this ZIP directly into GP-Next. A complete Russian translation is installed separately. |
| [Vasebreaker_24_Levels_And_Rules.zip](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/releases/download/v1.0.3/Vasebreaker_24_Levels_And_Rules.zip) | Vasebreaker levels and the nested Vase_Chaos_Rules.zip. Unzip this outer archive first. |

## Font and interface mod

- Fifteen font families, five independently configurable game-font slots and live previews.
- Improved dialogue sizes, level objectives, HUD spacing, notifications and shop/costume layouts.
- Separate auto-collection of other drops, sun and Plant Food. Turning the master switch off clears all three choices.
- Optional coin-priced power-ups and native balance display when hovering over them; optional 1–10× fast-forward.
- English GP-Next panel, selectable Russian/English game startup, and one local TXT diagnostic log.

![Recommended Russian/Cyrillic fonts for the five native PvZ2 Gardendless font slots](examples/native-font-slots.png)

Recommended preset: **Shantell Sans Bold / Comfortaa Bold / Caveat Bold / Comfortaa Bold / Ruslan Display**. Text size: **68%**. Optional collection and game improvements start disabled. Saved choices survive updates.

### Installation

Checked with **Gardendless 0.15.0 / Cocos 3.8.4** and **GP-Next 1.5.4 / 1.5.5**. Vasebreaker rules require **GP-Next 1.5.5**.

1. Download the font ZIP above. Enable **F9 → Experimental → JS Modding** and confirm the script notice if prompted.
2. Open **Mods → Import ZIP** and select the font ZIP without unpacking it. Install and enable a Russian translation pack separately if you want Russian game text.
3. Enable **Russian Font Display Fix & Extras**, apply the selection and confirm script trust if requested.
4. Fully close and restart the game. Mod settings are available under its name or **State and controls**. When updating, replace the same mod ID and keep one enabled copy.

[Detailed features and settings](FEATURES.md) · [Changelog](CHANGELOG.md) · [Official GP-Next guide](https://pvzge.com/en/guide/mod/gp-next)

## Vasebreaker

Unzip the separate Vasebreaker archive, import its **Vase_Chaos_Rules.zip** through **F9 → Mods → Import ZIP**, enable the rules and restart. Then open **Play Local Level** in the game's settings and select a JSON from **levels/**. The outer archive is a level bundle, so it is not imported as a mod.

The pack includes zero starting sun, sun and Plant Food in vases, randomized plants and world-specific zombies, explosion damage to vases, occasional Plantern reveals, and endless rounds. Endless fields are cleared between rounds; the right-hand vase band grows from 2 to 5 columns. After 10 seconds without player input, a random vase opens, with a warning blink during the last 5 seconds. Sky City is excluded.

[Full Vasebreaker installation and rules](VASEBREAKER.md). This is a partial community restoration, not a complete recreation of every original mode.

## Logs and troubleshooting

The font mod writes game/GP-Next messages and errors to `%APPDATA%\com.pvzge.game\gp-next\logs\Gardendless-debug.txt`. Use **Журнал и диагностика → Сохранить копию журнала TXT** in its settings to export a copy. Collection begins after the mod loads.

Update through the ZIP importer. Editing `gp-next/installed/` can cause `INSTALL_CORRUPT`; use the [official recovery guide](https://pvzge.com/en/guide/mod/gp-next-recovery) if startup is blocked.

## Source and licenses

Complete source is in this repository; GitHub's **Source code** downloads are for developers. Build the font mod with `python build.py`; run its standalone tests with `node --test tests/*.test.mjs`. Vasebreaker source and level JSON are under **vasebreaker/**.

Code and documentation: [MIT](LICENSE). Bundled fonts: [SIL OFL 1.1 notices](THIRD_PARTY_NOTICES.md). Publisher's declaration: code/documentation are 100% AI-generated using OpenAI GPT 6.1; third-party fonts retain their own authorship. Provided as-is, without a support or maintenance commitment.

[Search visibility and SEO setup](SEARCH_VISIBILITY.md) · [Русский сайт](https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/ru/)
