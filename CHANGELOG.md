# Changelog / Изменения

## 1.0.3 — updated build, 2026-10-14 / обновлённая сборка

The version number is unchanged. Included accumulated local fixes: stable level captions, zombie-preview placement, aligned objective bullets, native wallet display on booster hover, costume/shop layout, Plant Food controlled only by its own pickup switch, and safe cancellation of destroyed power-ups. Game/GP-Next diagnostics now accumulate in one Gardendless-debug.txt file.

Partially restored Vasebreaker is distributed separately: 12 regular + 12 endless levels in 12 worlds; zero starting sun, randomized plant/zombie contents, sun and Plant Food in vases, explosion interactions and occasional Plantern. Endless rounds clear the previous board and grow the right-hand vase band from 2 to 5 columns. Ten-second inactivity opening warns for the final five seconds. Includes world-specific Gargantuars, no graves over vases, corrected Plantern closing, SporeShroom clone cleanup, late Pharaoh guards and native projectile-pool preservation. Sky City is excluded. Rules retain version 1.2.0.

Главная страница и релиз сокращены, архив вазобоя и инструкция добавлены отдельно. Пример шрифтов сохранён; игровые снимки остались на сайте. SEO-описание, темы, адреса, карта сайта и метаданные сохранены. Полного ручного прохождения всех режимов не было.


## 1.0.3 — 2026-10-11

- GP-Next 1.5.4/1.5.5 stays in English independently of the chosen game language. The mod discovers the loaded language module instead of a fixed old filename.
- Startup language is applied before the native loading scene reads settings. Loading uses English while Russian registers; a missing translation keeps English. Slow initial loading does not consume the registration timeout.
- The saved master auto-collection switch clears all three item choices when disabled, stopping mod collection immediately in levels and gardens. Re-enabling opens an empty submenu. Legacy active collectors migrate to an enabled visible submenu.
- Piñata Party also hides during LoaderFlower loading/menu-transition tips, including fade-out. Native card state, child positions and timer remain intact.
- Regenerated the README font preview from the recommended five-font preset. Release notes contain no game screenshots.
- **1.0.2 was withdrawn**, including its release and tag. Its previous tests covered settings and package format but missed the language regression.

### Русский

- Панель GP-Next 1.5.4/1.5.5 остаётся английской независимо от языка игры. Убрана привязка к старому имени языкового модуля.
- Выбор языка применяется до чтения настроек загрузочным экраном. До регистрации русского перевода загрузка идёт на английском; без русификатора английский остаётся.
- Отключение общего пункта автоподбора снимает все вложенные галочки, немедленно прекращает подбор модом и сохраняет сброс. Повторное включение открывает пустое подменю.
- Piñata Party скрывается также во время подсказок загрузки и перехода между меню, включая затухание.
- Предосмотр в README приведён к стандартным пяти шрифтам. Скриншоты игры в описание релиза не добавлены. Версия 1.0.2 снята с публикации.

### Validation / Проверки

- 50 controller/preference tests passed, including the master reset, legacy migration and cold language publication.
- 204 assertions across 12 cases using the actual GP-Next 1.5.4/1.5.5 language modules: English/Chinese/Spanish initial panel locales, Russian/English game choices and native splash initialization.
- 622 assertions against the GP-Next 1.5.5 settings renderer and game UI, including master reset, decimal input, retained scroll and live speed.
- 288 assertions over 40 native LoaderFlower transitions, fade-out, global notifications, late card children and disposal.
- 50 rendering assertions for the recommended font preview and targeted loading-tip clipping at two pixel densities.

Checks are isolated and do not operate the player's running game. The AirPods audio-device-switch issue is unchanged.

## 1.0.2 — 2026-10-11 (withdrawn / снят)

### Fonts and dialogue

- Five independent selectors replace the old three-category system: FBU (interface), Brianne (Dave), Ashley Script (Zomboss), Pico12 (Penny), and House of Terror (warnings/defeat). Each has a role description, all 15 bundled font choices, and a live Cocos preview.
- Recommended defaults: **Shantell Sans Bold / Comfortaa Bold / Caveat Bold / Comfortaa Bold / Ruslan Display**, respectively. Valid saved preferences migrate and remain saved; the style-reset button applies the new preset.
- Penny's ordinary/portrait dialogue matches Dave's native base size, retaining its independent font and native bubble dimensions. Long text fits measured width and glyph height.
- Caveat Bold in Zomboss's slot receives a moderate optical size correction, including its preview.

### Hints and interface

- Loading tips use a glyph-measured texture padded for letters/outlines, fixing reproduced clipping of the family-medal/Mint tip. Native text rotation, animation visibility, and loading completion remain intact.
- Hints prefer authored lines at readable sizes and use balanced wrapping for longer paragraphs. Exit/restart confirmations retain complete authored sentences.
- Piñata Party's card/buttons temporarily hide during global notifications and return afterwards. The event timer continues; world arrows remain available.
- The player-list title fits between Fix Player and Close. Sold-out shop buttons stay inside their cards; normal prices/icons return when applicable.
- The daily-earned-gems caption is larger. Plant Decoding legend captions have separate rows and margins from icons/frame.
- Almanac descriptions gain upper/paragraph spacing. Upgrade descriptions and Enabled buttons fit inside their cards. The Plant Medals title stays clear of the frame.
- Test Levels and Play Custom Levels occupy separate areas; the custom-level caption remains stable while scrolling.
- Objectives use a compact size near the sound-setting captions. The bottom level name centers between power-ups and the progress panel; the journey introduction stays above power-ups.
- Pause/fast-forward and Zen Garden controls/counters have inward margins. The in-level shovel moves left with its D hint following the native offset. The paid plant-food button/price leaves room for F.
- Repeated layout scans do not accumulate offsets; supported layouts restore on unloading and adapt to scale/resizing.

### Optional extras and settings

- Independent auto-collection for other drops, sun, and plant-food leaves. Sun/leaves are excluded from other drops. Full plant-food banks wait for space. Native rewards, sounds, animations, and restrictions remain in use.
- One “Configure item auto-collection” checkbox reveals the three saved choices. Collapsing it preserves active collection. Cheat mode and the price editor remain adjacent.
- Optional fast-forward override: slider/decimal field, **1–10× in 0.1 steps**. Changes apply during active acceleration and after resuming a pause; disabling restores the native factor. Native danger slowdown, restart/loss/exit, and sandbox preparation behavior remain intact.
- Decimal input accepts dots/commas and Russian-layout/keypad separators. Enter and other setting changes retain menu scroll through GP-Next redraws.
- The Last Stand copy fix remains scoped to initial boosts during preparation. All optional improvements and collection switches are **off by default**.
- Startup Russian/English, text size 68%, three cheat modes, configurable coin prices, and native wallet feedback remain available. Default cheat mode permits manual game-side activation.

### GP-Next 1.5.5 and distribution

- Checked the new settings renderer, script controls, and package snapshot format in **GP-Next 1.5.5**. The manifest still accepts `>=1.5.4 <2.0.0`; untested versions are not guaranteed compatible.
- Added `INSTALL_CORRUPT` recovery instructions: editing an installed package breaks its recorded digest. Update through Import ZIP/folder and renew script trust if prompted. A script cannot repair an installation failure before it loads.
- Release/source ZIPs contain MIT, all font SIL OFL notices, and checksums. Complete source includes the build script, tests, screenshot site's source, and existing gallery.

### Русский

- **Пять независимых шрифтов** вместо трёх категорий: основной интерфейс, Дейв, Зомбосс, Пенни и предупреждения. У каждого — назначение, 15 вариантов и живой образец.
- Новый стандартный набор: **Shantell Sans Bold / Comfortaa Bold / Caveat Bold / Comfortaa Bold / Ruslan Display**. Сохранённый выбор переносится; кнопка рекомендуемого оформления применяет новый набор.
- Реплики Пенни приведены к базовому размеру Дейва с подгонкой длинного текста. Caveat Bold у Зомбосса умеренно увеличен.
- Исправлено воспроизведённое обрезание подсказки о медалях/Мяте; учтены реальные границы букв и обводки. Переносы подсказок и подтверждений подгоняются с сохранением читаемости.
- Piñata Party скрывается на время глобального сообщения, сохраняя обновление таймера и возвращаясь после него.
- Исправлены пересечения заголовка списка игроков, растягивание «Распродано», маленькая подпись заработанных алмазов, тесные подписи Plant Decoding и прыгающая подпись пользовательских уровней.
- В Альманахе добавлены отступы описаний/абзацев, кнопки «Включено» помещаются в карточках, заголовок медалей не прилегает к рамке.
- Цели компактнее; название уровня центрируется в свободном промежутке; надпись о путешествии поднята над усилениями. Управление уровня/сада отодвинуто от краёв, лопата с D — левее ускорения, покупка подкормки — дальше от F.
- **Автоподбор** раскрывается одним пунктом: отдельные галочки для прочего дропа, солнца и листиков. Солнце/листики не входят в прочий дроп. Полный банк подкормки ждёт места.
- **Ускорение 1–10× с шагом 0.1**: ползунок и поле, изменение во время игры, корректная пауза и возврат штатной скорости при отключении. Поддержаны точка/запятая, русская раскладка, цифровой блок и Enter.
- После изменения настроек сохраняется прокрутка. Режим читов расположен рядом со стоимостью усилений. Необязательные исправления и автоподбор выключены по умолчанию.
- Проверены форма настроек и формат пакетов **GP-Next 1.5.5**. Для `INSTALL_CORRUPT` добавлена инструкция: обновлять через импорт ZIP/папки, а не прямым редактированием установленной копии.
- Полный код, сборщик, тесты, сайт со скриншотами, MIT и лицензии шрифтов доступны в репозитории и архиве исходников.

### Validation / Проверки

Checks use isolated environments, Gardendless 0.15.0/Cocos 3.8.4 fixtures, and extracted GP-Next modules. They do not control the player's running game. No full playthrough of every mode is claimed.

| Check | Result |
| --- | --- |
| Preference/controller unit tests | 47 tests passed |
| GP-Next 1.5.5 settings, decimal input, scroll retention, five selectors, nested collection, live speed | 619 assertions passed |
| Penny/Dave dialogue, glyph bounds, shovel startup/D hint, scaling/restoration | 2,134 assertions / 100 cases passed |
| Almanac, upgrades, decoding legend, objectives, Zomboss, bottom caption | 3,316 assertions / 276 cases passed |
| Responsive anchors, garden, confirmations, medals, unloading | 629 assertions / 90 cases passed |
| Earlier loading-tip regression: 51 translated tips plus targeted cases, 15 fonts, three sizes, two pixel densities | 33,576 assertions / 4,770 cases passed |
| Earlier native pickup/Piñata lifecycle regression | 173 assertions passed |

The AirPods sound-effects issue after switching audio devices is **not fixed by this release**. No automatic audio-device reset is added.

## 1.0.1

Reduced objective text size; added the 20-screenshot GitHub gallery and interactive Pages carousel.

## 1.0

Initial release: Russian font/layout adjustments, previews, startup language, three cheat modes, configurable coin-priced power-ups, Zen Garden framing, and the preparation-only copy fix.
