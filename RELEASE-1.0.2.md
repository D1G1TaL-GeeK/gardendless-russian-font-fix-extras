> Withdrawn on 2026-10-11 due to a GP-Next panel/startup language regression. Use 1.0.3. / Снят 11.10.2026 из-за ошибки языка панели и загрузки. Используйте 1.0.3.

## Russian Font Display Fix & Extras 1.0.2

[English documentation](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/blob/v1.0.2/README.md) · [Описание по-русски](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/blob/v1.0.2/README.ru.md) · [All changes / Все изменения](https://github.com/D1G1TaL-GeeK/gardendless-russian-font-fix-extras/blob/v1.0.2/CHANGELOG.md)

### English

This release includes all accumulated font, layout, settings, and optional gameplay changes since 1.0.1:

- **Five independent font slots**, with 15 font choices, role descriptions, and live previews. New defaults: Shantell Sans Bold / Comfortaa Bold / Caveat Bold / Comfortaa Bold / Ruslan Display.
- **Separate auto-collection** for other drops, sun, and plant-food leaves, inside one expandable settings group. Sun/leaves are excluded from other drops; full plant-food banks wait for space.
- **Live fast-forward control, 1–10× in 0.1 steps**, with a slider and decimal field. Pause/resume, native danger slowdown, disabling, and live edits are supported. Dots/commas and Russian-layout input work; settings retain scroll after Enter.
- Loading-tip clipping, readable hint wrapping, player-list title overlap, sold-out shop button stretching, daily-earned-gems caption, Almanac/upgrade spacing, decoding legend, custom-level caption, compact objectives, and bottom level-name centering are addressed.
- Penny's dialogue matches Dave's base size; Zomboss's Caveat is moderately larger. Piñata Party temporarily hides during global messages. Level/garden controls gain margins; shovel/D and plant-food/F are separated.
- **GP-Next 1.5.5** settings and package-format checks passed. Existing saved choices remain; use the recommended-style reset to apply the new font preset.

**Dependencies:** Gardendless **0.15.0**, GP-Next **1.5.4 or 1.5.5**, enabled **Experimental → JS Modding**, and a separate enabled Russian translation pack for Russian text. Other versions are unverified. No programming tools are needed to play.

**Install/update:** download **Russian_Font_Display_Fix_Extras_1.0.2.zip** below → F9 → Mods → Import ZIP → enable the mod → review/confirm script trust, including renewed trust if requested → save/apply → fully close and restart the game. Open the mod's details or State and controls to configure it. Import with the same mod ID; do not edit installed package files.

**Defaults:** Russian startup language, text size **68%**, **Allow cheats** (manual game-side activation), all auto-collection and Game improvements checkboxes **off**, custom speed **2×** while inactive. The price editor sits beside cheat mode.

**INSTALL_CORRUPT:** GP-Next checks package bytes before engine import. Directly edited installed files no longer match their recorded digest and can block startup with an empty `modIssues` list. Reimport an unchanged package/new ZIP through the manager; if it cannot open, follow the [official recovery guide](https://pvzge.com/en/guide/mod/gp-next-recovery) and its suggested action. Keep saves/backups. This release does not bypass integrity or script-trust checks.

### Русский

В релиз вошли все накопленные правки после 1.0.1:

- **Пять отдельных шрифтов**, 15 вариантов для каждого, описание назначения и живой образец. Стандарт: Shantell Sans Bold / Comfortaa Bold / Caveat Bold / Comfortaa Bold / Ruslan Display.
- **Автоподбор** под одной раскрывающей галочкой: прочий дроп, солнце и листики отдельно. Полный банк подкормки ждёт места.
- **Ускорение 1–10× с шагом 0.1**, ползунок и поле, изменение во время игры, корректная пауза и штатное отключение. Поддержаны точка/запятая и русская раскладка; Enter не сбрасывает прокрутку настроек.
- Исправлены обрезание загрузочных подсказок, переносы, заголовок списка игроков, растягивание «Распродано», подпись заработанных алмазов, отступы Альманаха и кнопки бонусов, легенда Plant Decoding, подпись пользовательских уровней, размер целей и центрирование названия уровня.
- Реплики Пенни приведены к базовому размеру Дейва; Caveat у Зомбосса умеренно увеличен. Piñata Party скрывается во время глобального уведомления. Управление уровня/сада отодвинуто от краёв, лопата с D — от ускорения, покупка подкормки — от F.
- Проверены настройки и формат пакетов **GP-Next 1.5.5**. Сохранённые настройки остаются; новый стандарт шрифтов применяется кнопкой рекомендуемого оформления.

**Зависимости:** Gardendless **0.15.0**, GP-Next **1.5.4 или 1.5.5**, включённый **Experimental → JS Modding**, отдельный включённый русификатор для русского текста. Другие версии не проверены. Средства разработки игроку не нужны.

**Установка/обновление:** скачайте **Russian_Font_Display_Fix_Extras_1.0.2.zip** ниже → F9 → Mods → Import ZIP → включите мод → ознакомьтесь с кодом и подтвердите доверие, повторно при запросе → сохраните/примените выбор → полностью закройте и снова запустите игру. Настройки находятся в подробностях мода или State and controls. Обновляйте импортом с тем же ID, без редактирования установленных файлов.

**По умолчанию:** русский язык запуска, размер **68%**, **«Разрешить читы»** с отдельным включением в игре, автоподбор и галочки **«Улучшений игры» выключены**, множитель **2×** до активации ручной настройки.

**INSTALL_CORRUPT:** прямое изменение установленного пакета нарушает его контрольную сумму; GP-Next может остановиться до движка даже с пустым `modIssues`. Заново импортируйте неизменённый пакет/новый ZIP через менеджер. Если он недоступен, следуйте предложенному действию и [официальной инструкции восстановления](https://pvzge.com/en/guide/mod/gp-next-recovery). Сохранения и резервные копии следует сохранить. Проверки целостности и доверия не обходятся.
