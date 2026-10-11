"""Build the static, bilingual GitHub Pages site. Python 3.10+, no dependencies."""
from pathlib import Path
from html import escape
import json
import re
import shutil
import struct
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
BASE = "https://d1g1tal-geek.github.io/gardendless-russian-font-fix-extras/"
REPO = "https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras"
VERSION = json.loads((ROOT / "pack.json").read_text(encoding="utf-8"))["version"]
RELEASE = f"{REPO}/releases/tag/v{VERSION}"
ZIP = f"{REPO}/releases/download/v{VERSION}/Russian_Font_Display_Fix_Extras_{VERSION}.zip"
# Change only after a substantive update to the pages, never on every build.
UPDATED = "2026-10-11"
SCREENSHOTS = json.loads(re.search(r"const screenshots = (\[[\s\S]*?\n\]);", (DOCS / "gallery.js").read_text(encoding="utf-8")).group(1))
PREVIEW = "assets/recommended-font-preview.png"
PREVIEW_SIZE = struct.unpack(">II", (ROOT / "examples/native-font-slots.png").read_bytes()[16:24])

TEXT = {
    "en": {
        "home_title": "PvZ2 Gardendless: Russian Font Fix & Extras — GP-Next",
        "home_description": "Russian/Cyrillic font and UI fixes for PvZ2 Gardendless through GP-Next. 15 font families, live previews, auto-collection, game speed settings and installation guide.",
        "install_title": "Install Russian Font Fix for PvZ2 Gardendless with GP-Next",
        "install_description": "How to install Russian Font Display Fix & Extras in PvZ2 Gardendless with GP-Next, enable a separate Russian translation pack, update the mod and handle INSTALL_CORRUPT.",
        "h1": "Russian Font Fix for PvZ2 Gardendless",
        "intro": "Russian Font Display Fix & Extras is a free GP-Next JavaScript mod for the Plants vs. Zombies 2: Gardendless fan game. It improves Cyrillic text, interface spacing and dialogue, with optional gameplay settings.",
        "badge": f"Free mod · Version {VERSION} · GP-Next",
        "download": f"Download mod {VERSION} (ZIP)", "guide": "Installation guide", "source": "Source on GitHub",
        "nav": "Page contents", "features": "Features", "fonts": "Recommended fonts", "gallery": "Game screenshots", "faq": "Questions",
        "warning": "Russian game text requires a separate enabled Russian translation pack. This font and interface mod does not include a complete translation.",
        "install_h1": "Install the Gardendless Russian Font Fix with GP-Next",
        "install_intro": f"Installation and update instructions for Russian Font Display Fix & Extras {VERSION}. Import the ready-to-use ZIP through the game; no Python, Node.js or compiler is needed.",
        "home": "Project home", "requirements": "Compatibility", "full_docs": "Full documentation", "release": "Release notes and downloads",
        "previous": "Previous screenshot", "next": "Next screenshot", "original": "Open full size", "all": "All 20 screenshots",
        "keys": "Use ← / → to browse, or select a thumbnail. Without JavaScript, each thumbnail opens the original image.",
        "viewer": "Screenshot viewer", "thumbnails": "Screenshot thumbnails",
        "gallery_note": "These 20 game screenshots were captured in earlier versions with user-selected settings. They illustrate the interface and are not the recommended default preset. The current five-font preset is shown above. Game artwork belongs to its respective owners.",
        "preview_alt": "Recommended Russian fonts: Shantell Sans Bold for FBU, Comfortaa Bold for Dave and Penny, Caveat Bold for Zomboss, Ruslan Display for warnings",
        "preview_caption": "The recommended five-font preset, rendered by the game engine. Each original font slot can be changed independently.",
        "license": "Mod code: MIT. Third-party fonts: SIL Open Font License 1.1.",
        "provenance": "Publisher's declaration: 100% of mod code and project documentation was AI-generated with OpenAI GPT 6.1; third-party fonts were created by their respective authors. The project is provided as-is, without a support or maintenance commitment.",
        "sitemap": "Sitemap", "language": "Language", "license_link": "Code license", "font_license_link": "Font licenses",
    },
    "ru": {
        "home_title": "PvZ2 Gardendless: русские шрифты и мод GP-Next",
        "home_description": "Русские шрифты и исправления интерфейса PvZ2 Gardendless через GP-Next: 15 семейств шрифтов, предпросмотр, автоподбор и ускорение игры. Скачать мод и инструкция установки.",
        "install_title": "Установка русского Font Fix для PvZ2 Gardendless — GP-Next",
        "install_description": "Как установить Russian Font Display Fix & Extras в PvZ2 Gardendless через GP-Next: отдельный русификатор, импорт ZIP, обновление и восстановление при INSTALL_CORRUPT.",
        "h1": "Русские шрифты для PvZ2 Gardendless",
        "intro": "Russian Font Display Fix & Extras — бесплатный JavaScript-мод GP-Next для фанатской игры Plants vs. Zombies 2: Gardendless. Он улучшает отображение кириллицы, отступы интерфейса и диалоги, а также добавляет необязательные настройки игры.",
        "badge": f"Бесплатный мод · Версия {VERSION} · GP-Next",
        "download": f"Скачать мод {VERSION} (ZIP)", "guide": "Как установить", "source": "Исходный код на GitHub",
        "nav": "Содержание страницы", "features": "Возможности", "fonts": "Стандартные шрифты", "gallery": "Скриншоты игры", "faq": "Вопросы",
        "warning": "Для русского текста игры нужен отдельный включённый русификатор. Этот мод исправляет шрифты и интерфейс, но не содержит полного перевода.",
        "install_h1": "Установка русских шрифтов Gardendless через GP-Next",
        "install_intro": f"Инструкция установки и обновления Russian Font Display Fix & Extras {VERSION}. Готовый ZIP импортируется прямо в игре; Python, Node.js и компилятор не нужны.",
        "home": "Главная страница", "requirements": "Совместимость", "full_docs": "Полная документация", "release": "Изменения и файлы релиза",
        "previous": "Предыдущий скриншот", "next": "Следующий скриншот", "original": "Открыть полный размер", "all": "Все 20 скриншотов",
        "keys": "Листайте клавишами ← / → или выберите миниатюру. Без JavaScript каждая миниатюра открывает исходное изображение.",
        "viewer": "Просмотр скриншотов", "thumbnails": "Миниатюры скриншотов",
        "gallery_note": "Эти 20 игровых скриншотов сделаны в прежних версиях с пользовательскими настройками. Они показывают интерфейс, а не стандартное оформление. Актуальные пять шрифтов по умолчанию показаны выше. Права на графику игры принадлежат её авторам.",
        "preview_alt": "Русские шрифты по умолчанию: Shantell Sans Bold для FBU, Comfortaa Bold для Дейва и Пенни, Caveat Bold для Зомбосса, Ruslan Display для предупреждений",
        "preview_caption": "Рекомендуемые пять шрифтов, отрисованные игровым движком. Каждый исходный шрифт можно заменить отдельно.",
        "license": "Код мода: MIT. Сторонние шрифты: SIL Open Font License 1.1.",
        "provenance": "Заявление издателя: код мода и документация на 100% сгенерированы AI OpenAI GPT 6.1; сторонние шрифты созданы их авторами. Проект предоставляется «как есть», без обязательств по поддержке и сопровождению.",
        "sitemap": "Карта сайта", "language": "Язык", "license_link": "Лицензия кода", "font_license_link": "Лицензии шрифтов",
    },
}


def route(language, installation=False):
    return ("ru/" if language == "ru" else "") + ("installation/" if installation else "")


def head(language, installation):
    t = TEXT[language]
    title = t["install_title" if installation else "home_title"]
    description = t["install_description" if installation else "home_description"]
    canonical = BASE + route(language, installation)
    locale = "ru_RU" if language == "ru" else "en_US"
    other_locale = "en_US" if language == "ru" else "ru_RU"
    schema = {
        "@context": "https://schema.org", "@graph": [
            {"@type": "WebSite", "@id": BASE + "#website", "url": BASE,
             "name": "Russian Font Display Fix & Extras for PvZ2 Gardendless", "inLanguage": ["en", "ru"]},
            {"@type": "WebPage", "@id": canonical + "#webpage", "url": canonical,
             "name": title, "description": description, "inLanguage": language,
             "isPartOf": {"@id": BASE + "#website"}, "about": {"@id": BASE + "#mod"}},
            {"@type": "SoftwareApplication", "@id": BASE + "#mod",
             "name": "Russian Font Display Fix & Extras", "url": BASE,
             "description": "A GP-Next mod with Russian/Cyrillic font fixes, interface spacing and optional gameplay settings for PvZ2 Gardendless. Requires a separate translation pack for Russian game text.",
             "applicationCategory": "GameApplication", "operatingSystem": "Windows",
             "softwareVersion": VERSION, "downloadUrl": ZIP,
             "softwareRequirements": "Gardendless 0.15.0; GP-Next 1.5.4 or 1.5.5; experimental.jsModding",
             "license": REPO + "/blob/main/LICENSE", "image": BASE + PREVIEW,
             "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD", "url": RELEASE},
             "publisher": {"@type": "Person", "name": "D1G1TaL-GeeK", "url": "https://github.com/D1G1TaL-GeeK"}},
        ]}
    schema_json = json.dumps(schema, ensure_ascii=False, indent=2).replace('</', '<\\/')
    return f'''<!doctype html>
<html lang="{language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description, quote=True)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{canonical}">
  <link rel="alternate" hreflang="en" href="{BASE + route('en', installation)}">
  <link rel="alternate" hreflang="ru" href="{BASE + route('ru', installation)}">
  <link rel="alternate" hreflang="x-default" href="{BASE + route('en', installation)}">
  <link rel="sitemap" type="application/xml" href="{BASE}sitemap.xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Russian Font Display Fix &amp; Extras">
  <meta property="og:title" content="{escape(title, quote=True)}">
  <meta property="og:description" content="{escape(description, quote=True)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:locale" content="{locale}">
  <meta property="og:locale:alternate" content="{other_locale}">
  <meta property="og:image" content="{BASE + PREVIEW}">
  <meta property="og:image:width" content="{PREVIEW_SIZE[0]}">
  <meta property="og:image:height" content="{PREVIEW_SIZE[1]}">
  <meta property="og:image:alt" content="{escape(t['preview_alt'], quote=True)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(title, quote=True)}">
  <meta name="twitter:description" content="{escape(description, quote=True)}">
  <meta name="twitter:image" content="{BASE + PREVIEW}">
  <meta name="twitter:image:alt" content="{escape(t['preview_alt'], quote=True)}">
  <link rel="stylesheet" href="{BASE}gallery.css">
  <link rel="stylesheet" href="{BASE}site.css">
  <script type="application/ld+json">{schema_json}</script>
</head>'''


def header(language, installation):
    t = TEXT[language]
    links = ""
    for lang in ("en", "ru"):
        current = ' aria-current="page"' if lang == language else ''
        links += f'<a href="{BASE + route(lang, installation)}" lang="{lang}" hreflang="{lang}"{current}>{lang.upper()}</a>'
    return f'''<body><main class="wrap">
<header class="top"><a class="brand" href="{BASE + route(language)}"><span>Gardendless</span> / Russian Font Fix &amp; Extras</a>
<nav class="language" aria-label="{t['language']}">{links}</nav></header>'''


def actions(language):
    t = TEXT[language]
    return f'<nav class="actions"><a href="{ZIP}">{t["download"]}</a><a href="{BASE + route(language, True)}">{t["guide"]}</a><a href="{REPO}">{t["source"]}</a></nav>'


def features(language):
    if language == "en":
        return '''<div class="cards">
<article><h3>Readable Cyrillic text</h3><p>Choose from 15 bundled font families for five original font slots. Preview interface text, Dave, Zomboss, Penny and warnings in the game engine. Adjust the overall text size from 50% to 80%.</p></article>
<article><h3>Interface and dialogue spacing</h3><p>Improve text fitting, hint wrapping, Almanac spacing, HUD margins and shop controls. Penny uses Dave's native dialogue base size. Piñata Party is hidden while menu-transition tips are visible.</p></article>
<article><h3>Optional gameplay settings</h3><p>Configure separate auto-collection switches for other drops, sun and plant-food leaves; set a live fast-forward multiplier from 1× to 10× in steps of 0.1; choose cheat handling and edit power-up coin prices.</p></article>
</div><p>The auto-collection group and custom fast-forward are off by default. Turning off the collection group clears all its nested switches. Selecting a cheat mode does not automatically activate the game's cheats.</p>'''
    return '''<div class="cards">
<article><h3>Читаемая кириллица</h3><p>Выберите одно из 15 семейств для каждого из пяти исходных шрифтов. Предпросмотр интерфейса, реплик Дейва, Зомбосса, Пенни и предупреждений рисует игровой движок. Общий размер текста настраивается от 50% до 80%.</p></article>
<article><h3>Отступы интерфейса и диалогов</h3><p>Улучшены подгонка текста, переносы подсказок, отступы альманаха, поля игрового интерфейса и кнопки магазина. У Пенни базовый размер реплик такой же, как у Дейва. Пиньята скрывается на время подсказок при переходах между меню.</p></article>
<article><h3>Дополнительные настройки игры</h3><p>Отдельные галочки автоподбора прочего дропа, солнца и листиков подкормки; множитель ускорения от 1× до 10× с шагом 0,1, изменяемый во время игры; режим читов и настройка стоимости усилений в монетах.</p></article>
</div><p>Группа автоподбора и ручная настройка ускорения по умолчанию выключены. Отключение группы автоподбора снимает все вложенные галочки. Выбор режима читов сам по себе не включает игровые читы.</p>'''


def font_table(language):
    labels = ("Original font", "Used for", "Recommended replacement") if language == "en" else ("Исходный шрифт", "Назначение", "Шрифт по умолчанию")
    roles = ("Main interface, buttons, hints and objectives", "Dave dialogue", "Zomboss dialogue", "Penny dialogue", "Combat warnings and defeat") if language == "en" else ("Основной интерфейс, кнопки, подсказки и цели", "Реплики Дейва", "Реплики Зомбосса", "Реплики Пенни", "Боевые предупреждения и поражение")
    slots = ("FBU", "Brianne", "Ashley Script", "Pico12", "House of Terror")
    fonts = ("Shantell Sans Bold", "Comfortaa Bold", "Caveat Bold", "Comfortaa Bold", "Ruslan Display")
    rows = "".join(f"<tr><th scope=\"row\">{slot}</th><td>{role}</td><td>{font}</td></tr>" for slot, role, font in zip(slots, roles, fonts))
    columns = "".join(f'<th scope="col">{label}</th>' for label in labels)
    return f'<div class="table-wrap"><table><thead><tr>{columns}</tr></thead><tbody>{rows}</tbody></table></div>'


def gallery(language):
    t = TEXT[language]
    first = SCREENSHOTS[0]
    thumbnails = "\n".join(f'<a href="{BASE + shot["image"]}" data-screenshot="{i}" target="_blank" rel="noopener"><img src="{BASE + shot["image"]}" alt="{escape(shot[language], quote=True)}" width="{shot["width"]}" height="{shot["height"]}" loading="lazy" decoding="async"><span>{escape(shot[language])}</span></a>' for i, shot in enumerate(SCREENSHOTS))
    return f'''<section id="gallery" class="content"><h2>{t['gallery']}</h2><p>{t['gallery_note']}</p>
<div class="viewer" aria-label="{t['viewer']}"><div class="stage"><img id="photo" src="{BASE + first['image']}" alt="{escape(first[language], quote=True)}" width="{first['width']}" height="{first['height']}" loading="lazy" decoding="async"><button id="previous" class="arrow previous" type="button" aria-label="{t['previous']}" hidden>‹</button><button id="next" class="arrow next" type="button" aria-label="{t['next']}" hidden>›</button></div>
<div class="caption" aria-live="polite" aria-atomic="true"><span id="counter" class="counter">1 / 20</span><h3 id="caption">{escape(first[language])}</h3><a id="original" href="{BASE + first['image']}" target="_blank" rel="noopener">{t['original']}</a></div></div>
<p class="help">{t['keys']}</p><h3 class="grid-title">{t['all']}</h3><div id="thumbnails" class="thumbnails" aria-label="{t['thumbnails']}">{thumbnails}</div></section>'''


def faq(language):
    if language == "en":
        return f'''<article><h3>Is this a Gardendless Russian translation or russifier?</h3><p>This package fixes Russian/Cyrillic fonts and layout. Install a separate Russian translation pack to translate the game text. The mod is not tied to one specific translation-pack ID.</p></article>
<article><h3>Which game and GP-Next versions are checked?</h3><p>Gardendless 0.15.0 with Cocos 3.8.4 and GP-Next 1.5.4 / 1.5.5. The manifest accepts GP-Next ≥1.5.4 and &lt;2.0.0, but other versions have not been verified.</p></article>
<article><h3>Which ZIP should I install?</h3><p>Use <a href="{ZIP}">Russian_Font_Display_Fix_Extras_{VERSION}.zip</a>. The _Source.zip and GitHub's automatic source archives are for development. Follow the <a href="{BASE}installation/">GP-Next installation guide</a> and fully restart the game.</p></article>
<article><h3>Why can GP-Next's panel stay English?</h3><p>The mod's startup game-language setting is separate from the GP-Next panel language. Loading starts in English while the Russian translation registers; Russian game text needs the separate translation pack.</p></article>'''
    return f'''<article><h3>Это русификатор PvZ2 Gardendless?</h3><p>Пакет исправляет русские шрифты, кириллицу и размещение текста. Для перевода игры установите отдельный русификатор. Мод не привязан обязательной зависимостью к одному ID пакета перевода.</p></article>
<article><h3>Какие версии игры и GP-Next проверены?</h3><p>Gardendless 0.15.0, Cocos 3.8.4 и GP-Next 1.5.4 / 1.5.5. Манифест допускает GP-Next ≥1.5.4 и &lt;2.0.0, но другие версии не проверены.</p></article>
<article><h3>Какой архив нужно скачивать?</h3><p>Для установки нужен <a href="{ZIP}">Russian_Font_Display_Fix_Extras_{VERSION}.zip</a>. Архив _Source.zip и автоматические архивы исходного кода GitHub предназначены для разработки. Пройдите <a href="{BASE}ru/installation/">установку через GP-Next</a> и полностью перезапустите игру.</p></article>
<article><h3>Почему панель GP-Next остаётся английской?</h3><p>Язык запуска игры в моде настраивается отдельно от языка панели GP-Next. Загрузка начинается на английском, пока регистрируется русский перевод. Для русских игровых текстов нужен отдельный русификатор.</p></article>'''


def home_body(language):
    t = TEXT[language]
    return f'''<section class="hero"><div class="eyebrow">{t['badge']}</div><h1>{t['h1']}</h1><p class="intro">{t['intro']}</p>{actions(language)}<p class="callout">{t['warning']}</p></section>
<nav class="section-nav" aria-label="{t['nav']}"><a href="#features">{t['features']}</a><a href="#fonts">{t['fonts']}</a><a href="#gallery">{t['gallery']}</a><a href="#faq">{t['faq']}</a></nav>
<section id="features" class="content"><h2>{t['features']}</h2>{features(language)}</section>
<section id="fonts" class="content"><h2>{t['fonts']}</h2>{font_table(language)}
<figure class="font-preview"><img src="{BASE + PREVIEW}" alt="{escape(t['preview_alt'], quote=True)}" width="{PREVIEW_SIZE[0]}" height="{PREVIEW_SIZE[1]}" loading="lazy" decoding="async"><figcaption>{t['preview_caption']}</figcaption></figure></section>
{gallery(language)}
<section id="faq" class="content faq"><h2>{t['faq']}</h2>{faq(language)}</section>'''


def installation_body(language):
    t = TEXT[language]
    if language == "en":
        article = f'''<section class="content"><h2>Before you install</h2><ul><li>Checked with Gardendless 0.15.0 / Cocos 3.8.4 and GP-Next 1.5.4 / 1.5.5. Other versions have not been verified.</li><li>Russian text requires a separate enabled Russian translation pack.</li><li>Download the installable ZIP, not the _Source.zip archive. You can check its SHA-256 against SHA256SUMS.txt on the release page.</li></ul></section>
<section class="content"><h2>Install the mod in GP-Next</h2><ol class="steps">
<li><a href="{ZIP}">Download Russian_Font_Display_Fix_Extras_{VERSION}.zip</a> from the <a href="{RELEASE}">GitHub release</a>.</li>
<li>Return to the main menu. Open <strong>F9 → Experimental → JS Modding</strong>, enable it and review/confirm the GP-Next script notice.</li>
<li>Open <strong>Mods → Import ZIP</strong> and select the archive directly. Check its name and version. Install and enable your Russian translation pack separately.</li>
<li>Enable <strong>Russian Font Display Fix &amp; Extras</strong>. Review the package and confirm script trust, including renewed trust after an update if requested.</li>
<li>Save/apply the mod selection, fully close the game and launch it again. Restarting only a level is insufficient.</li>
<li>Open the mod details in <strong>F9 → Mods</strong>, or use <strong>State and controls → Русский шрифт и размеры</strong>. The mod controls are labelled in Russian; GP-Next's panel language is independent.</li>
</ol></section>
<section class="content"><h2>Update, reset or remove</h2><p>Import the new ZIP with the same mod ID. Valid saved font, size, language, price, collection and speed choices remain. Avoid keeping two versions enabled. To apply the recommended five-font defaults to an existing installation, press <strong>Вернуть рекомендуемое оформление</strong>.</p><p>To disable or remove the mod, use the mod manager, save/apply and fully restart. The latest release is {VERSION}; version 1.0.2 was withdrawn.</p></section>
<section class="content"><h2>INSTALL_CORRUPT or STARTUP_FAILED before the engine loads</h2><p>GP-Next checks installed package bytes against their recorded digest. Direct changes inside <code>gp-next/installed/</code> can cause <code>INSTALL_CORRUPT</code> and <code>STARTUP_FAILED</code> at <code>beforeEngineImport</code>, even if <code>modIssues</code> is empty. This mod cannot run a repair before its own script loads.</p><p>Preserve saves and backups. Use the recovery screen's mod-manager/import action to reimport an unchanged package. If the manager cannot open, follow <a href="https://pvzge.com/en/guide/mod/gp-next-recovery">the official GP-Next recovery guide</a>, then reimport through the manager. Other startup failures need their full error details; these codes alone do not prove one particular cause.</p></section>
<section class="content"><h2>Fonts and optional settings</h2><p>First-install text size is 68%. The recommended fonts are Shantell Sans Bold, Comfortaa Bold, Caveat Bold, Comfortaa Bold and Ruslan Display for the five original font slots. See <a href="{BASE}#fonts">the native font roles and preview</a>.</p><p>Auto-collection, manual fast-forward and the planning copy fix are off by default. Other drops exclude sun and plant-food leaves; those use separate switches. The fast-forward slider accepts 1–10× in steps of 0.1, with a decimal point or comma in the input. Selecting “Allow cheats” only permits the native cheat switch; enable cheats separately if wanted.</p></section>'''
    else:
        article = f'''<section class="content"><h2>Перед установкой</h2><ul><li>Проверены Gardendless 0.15.0 / Cocos 3.8.4 и GP-Next 1.5.4 / 1.5.5. Другие версии не проверены.</li><li>Для русского текста игры нужен отдельный включённый русификатор.</li><li>Скачайте установочный ZIP, а не архив _Source.zip. Его SHA-256 можно сверить с SHA256SUMS.txt на странице релиза.</li></ul></section>
<section class="content"><h2>Как установить мод в GP-Next</h2><ol class="steps">
<li><a href="{ZIP}">Скачайте Russian_Font_Display_Fix_Extras_{VERSION}.zip</a> из <a href="{RELEASE}">релиза на GitHub</a>.</li>
<li>Вернитесь в главное меню. Откройте <strong>F9 → Experimental → JS Modding</strong>, включите возможность и прочитайте/подтвердите уведомление GP-Next о скриптах.</li>
<li>Откройте <strong>Mods → Import ZIP</strong> и выберите архив без распаковки. Проверьте название и версию. Отдельно установите и включите русификатор.</li>
<li>Включите <strong>Russian Font Display Fix &amp; Extras</strong>. Ознакомьтесь с пакетом и подтвердите доверие к скрипту, в том числе повторно после обновления, если GP-Next запросит это.</li>
<li>Сохраните/примените выбор модов, полностью закройте игру и запустите её снова. Перезапуска одного уровня недостаточно.</li>
<li>Откройте подробности мода в <strong>F9 → Mods</strong> или <strong>State and controls → Русский шрифт и размеры</strong>. Настройки мода подписаны по-русски; язык панели GP-Next независим.</li>
</ol></section>
<section class="content"><h2>Обновление, сброс и удаление</h2><p>Импортируйте новый ZIP с тем же ID мода. Корректные сохранённые настройки шрифтов, размера, языка, цен, автоподбора и ускорения сохраняются. Не держите включёнными две версии одновременно. Чтобы применить рекомендуемые пять шрифтов к существующей установке, нажмите <strong>Вернуть рекомендуемое оформление</strong>.</p><p>Для отключения или удаления используйте менеджер модов, сохраните/примените выбор и полностью перезапустите игру. Актуальная версия — {VERSION}; версия 1.0.2 снята с публикации.</p></section>
<section class="content"><h2>INSTALL_CORRUPT или STARTUP_FAILED до загрузки движка</h2><p>GP-Next сверяет байты установленного пакета с записанной контрольной суммой. Ручные изменения внутри <code>gp-next/installed/</code> могут вызвать <code>INSTALL_CORRUPT</code> и <code>STARTUP_FAILED</code> на этапе <code>beforeEngineImport</code>, даже если <code>modIssues</code> пуст. Этот мод не может исправить установку до запуска собственного скрипта.</p><p>Сохраните игровые данные и резервные копии. Через доступное действие восстановления и менеджер модов повторно импортируйте неизменённый пакет. Если менеджер не открывается, выполните действия из <a href="https://pvzge.com/en/guide/mod/gp-next-recovery">официального руководства восстановления GP-Next</a>, затем импортируйте пакет через менеджер. Для других ошибок запуска нужны полные сведения: одни эти коды не доказывают конкретную причину.</p></section>
<section class="content"><h2>Шрифты и дополнительные настройки</h2><p>При первой установке размер текста — 68%. Для пяти исходных шрифтов рекомендуются Shantell Sans Bold, Comfortaa Bold, Caveat Bold, Comfortaa Bold и Ruslan Display. См. <a href="{BASE}ru/#fonts">назначение шрифтов и предпросмотр</a>.</p><p>Автоподбор, ручной множитель ускорения и исправление копий стартового буста по умолчанию выключены. Прочий дроп не включает солнце и листики подкормки: для них отдельные галочки. Ускорение настраивается от 1× до 10× с шагом 0,1; поле принимает точку или запятую. Режим «Разрешить читы» только разрешает штатный переключатель — сами читы при желании включаются отдельно.</p></section>'''
    return f'''<nav class="breadcrumbs" aria-label="{t['nav']}"><a href="{BASE + route(language)}">{t['home']}</a> / {t['guide']}</nav>
<section class="hero"><div class="eyebrow">{t['badge']}</div><h1>{t['install_h1']}</h1><p class="intro">{t['install_intro']}</p>{actions(language)}</section>{article}'''


def footer(language):
    t = TEXT[language]
    readme = "README.ru.md" if language == "ru" else "README.md"
    return f'''<section class="content project-notice"><p>{t['license']}</p><p>{t['provenance']}</p><nav class="resource-links"><a href="{REPO}/blob/main/{readme}">{t['full_docs']}</a><a href="{RELEASE}">{t['release']}</a><a href="{REPO}/blob/main/LICENSE">{t['license_link']}</a><a href="{REPO}/blob/main/THIRD_PARTY_NOTICES.md">{t['font_license_link']}</a></nav></section>
<footer><span>Russian Font Display Fix &amp; Extras · {VERSION}</span><a href="{REPO}">GitHub</a><a href="{BASE}sitemap.xml">{t['sitemap']}</a></footer></main>'''


def sitemap():
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    image_ns = "http://www.google.com/schemas/sitemap-image/1.1"
    ET.register_namespace("", ns)
    ET.register_namespace("image", image_ns)
    root = ET.Element(f"{{{ns}}}urlset")
    for language in TEXT:
        for installation in (False, True):
            entry = ET.SubElement(root, f"{{{ns}}}url")
            ET.SubElement(entry, f"{{{ns}}}loc").text = BASE + route(language, installation)
            ET.SubElement(entry, f"{{{ns}}}lastmod").text = UPDATED
            if not installation:
                for image in [PREVIEW] + [shot["image"] for shot in SCREENSHOTS]:
                    child = ET.SubElement(entry, f"{{{image_ns}}}image")
                    ET.SubElement(child, f"{{{image_ns}}}loc").text = BASE + image
    ET.indent(root, space="  ")
    (DOCS / "sitemap.xml").write_bytes(ET.tostring(root, encoding="utf-8", xml_declaration=True) + b"\n")


def main():
    (DOCS / "assets").mkdir(exist_ok=True)
    shutil.copyfile(ROOT / "examples/native-font-slots.png", DOCS / PREVIEW)
    for language in TEXT:
        for installation in (False, True):
            target = DOCS / route(language, installation) / "index.html"
            target.parent.mkdir(parents=True, exist_ok=True)
            body = installation_body(language) if installation else home_body(language)
            script = f'<script src="{BASE}gallery.js" defer></script>' if not installation else ""
            target.write_text("\n".join((head(language, installation), header(language, installation), body, footer(language), script + "</body></html>\n")), encoding="utf-8", newline="\n")
    sitemap()
    print("Built four static EN/RU pages, the existing gallery, recommended font preview and sitemap.xml")


if __name__ == "__main__":
    main()
