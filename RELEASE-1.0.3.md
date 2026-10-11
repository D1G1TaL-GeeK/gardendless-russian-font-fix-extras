## Russian Font Display Fix & Extras 1.0.3

Version 1.0.2 was withdrawn because its language handling was incompatible with GP-Next 1.5.5. This replacement includes all accumulated changes since 1.0.1 and the corrections below.

### English

- **GP-Next stays in English** on 1.5.4 and 1.5.5. The mod discovers the currently loaded language module instead of a fixed old build filename. Panel language and the selected game language remain separate.
- **Loading starts in English** while a Russian translation pack registers. Russian/English game startup selection remains available; Russian uses the registered language index. Missing Russian translations fall back to English with a log message.
- **Turning off “Configure item auto-collection” clears all three item checkboxes**, stops mod collection immediately, and saves the cleared state. Re-enabling does not restore the old selections. Legacy active selections keep their submenu enabled after upgrading.
- **Piñata Party stays hidden during loading/menu-transition tips and global notifications**, including their fade-out, and returns after the message disappears. Its native timer continues.

Also included: five font slots with 15 choices and live previews; dialogue sizing; readable objectives, hints, Almanac and shop layouts; HUD margins; coin-priced power-ups; separate drop/sun/plant-food collection; a live **1–10×** fast-forward slider/input with **0.1** precision; decimal input and retained settings scroll; optional Last Stand preparation copy fix.

**Requirements:** Gardendless **0.15.0**, GP-Next **1.5.4 or 1.5.5**, enabled **Experimental → JS Modding**, and a separate enabled Russian translation pack for Russian game text. Other versions are unverified.

**Install/update:** download **Russian_Font_Display_Fix_Extras_1.0.3.zip** from the assets below → F9 → Mods → Import ZIP → enable the mod → review and confirm script trust if requested → save/apply → fully close and restart the game. Import using the same mod ID; avoid two enabled versions. `_Source.zip` is for development. Never edit installed package files directly.

**Defaults:** Shantell Sans Bold / Comfortaa Bold / Caveat Bold / Comfortaa Bold / Ruslan Display; Russian game startup; **68%** text size; **Allow cheats** with manual game-side activation; auto-collection and optional improvements **off**; custom speed **2×** while inactive. Valid existing font, size, price and speed choices are preserved.

[English instructions](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/blob/v1.0.3/README.md) · [Full changelog](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/blob/v1.0.3/CHANGELOG.md)

### Русский

Версия **1.0.2 снята с публикации** из-за ошибки языка после обновления GP-Next. В **1.0.3** сохранены все накопленные правки и добавлены исправления:

- Панель **GP-Next остаётся английской** на 1.5.4 и 1.5.5; её язык отделён от языка игры. Убрана привязка к имени файла старого языкового модуля.
- Загрузка начинается **на английском**, пока регистрируется русификатор. Затем применяется выбранный русский/английский язык игры. Без доступного русского перевода остаётся английский и появляется запись в журнале.
- Отключение **«Настроить автоподбор предметов»** сразу снимает три вложенные галочки, останавливает подбор модом и сохраняет сброс. Повторное включение открывает пустое подменю. При обновлении прежний включённый автоподбор отображается с включённым общим пунктом.
- **Piñata Party скрывается до полного исчезновения подсказки**, в том числе при переходе между меню и затухании текста. Таймер пиньяты продолжает работать.

В сборке также остаются пять отдельных шрифтов с 15 вариантами и предосмотром, исправления реплик и интерфейса, автоподбор трёх категорий, усиления за монеты, ускорение **1–10× с шагом 0.1** с изменением во время игры, сохранение прокрутки настроек и необязательное исправление копий начального буста в подготовке Last Stand.

**Зависимости:** Gardendless **0.15.0**, GP-Next **1.5.4 или 1.5.5**, включённый **Experimental → JS Modding**, отдельный включённый русификатор для русского текста.

**Установка/обновление:** скачайте **Russian_Font_Display_Fix_Extras_1.0.3.zip** ниже → F9 → Mods → Import ZIP → включите мод → подтвердите доверие к скрипту при запросе → сохраните/примените → полностью закройте и заново запустите игру. Настройки — в подробностях мода или **State and controls**. Обновляйте через импорт с тем же ID; не оставляйте две версии включёнными. Архив `_Source.zip` предназначен для разработки.

**По умолчанию:** русский язык игры, размер **68%**, «Разрешить читы» с отдельной активацией в игре; автоподбор и необязательные улучшения выключены, множитель **2×** до включения ручной настройки. Сохранённые шрифты, размер, цены и ускорение остаются.

[Подробная инструкция](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/blob/v1.0.3/README.ru.md)

**INSTALL_CORRUPT:** updating through the ZIP importer preserves package integrity. If startup recovery blocks access, use the [official recovery guide](https://pvzge.com/en/guide/mod/gp-next-recovery) and retain saves/backups. / Для обновления используйте импорт ZIP. При блокировке запуска следуйте [официальной инструкции восстановления](https://pvzge.com/en/guide/mod/gp-next-recovery), сохранив сохранения и резервные копии.

**Publisher’s declaration:** mod code and documentation are 100% generated using AI OpenAI GPT 6.1. Complete mod source is included under **MIT**; third-party fonts are separately licensed under **SIL OFL 1.1**. No obligation to respond, support, fix, improve, maintain, update or adapt the mod. Provided as-is without warranty. The AirPods audio-device-switch issue is not fixed in this release.
