export const FONT_SLOTS = [
  { key: "fbu", label: "FBU — основной интерфейс", description: "Заголовки, кнопки, цели уровня, настройки, подсказки, магазин, Альманах и счётчики.", sample: "Древний Египет — цели уровня\nСобирайте солнце и защищайте сад.", fallback: "shantell", uuid: "86YVyymTlDWLji7C0CDv7q", fullUuid: "86615cb2-9939-4358-b8e2-ec2d020efeea", file: "FBUSV8C5EI.ttf" },
  { key: "brianne", label: "Brianne — реплики Дейва", description: "Реплики Безумного Дейва в диалогах и его портретных облачках.", sample: "Эй, сосед! Зомби уже близко.\nПриготовь растения и подкормку!", fallback: "comfortaa", uuid: "aa1w9sPAdB96kCISpAyKzE", fullUuid: "aad70f6c-3c07-41f7-a902-212a40c8acc4", file: "BRIANNETOD.ttf" },
  { key: "ashley", label: "Ashley Script — реплики Зомбосса", description: "Реплики Зомбосса в диалогах и облачках у его портрета.", sample: "Мой гениальный план почти готов!\nПосмотрим, как вы защитите свой сад.", fallback: "caveat", uuid: "60rUQnbDhIK5115YpEIHas", fullUuid: "60ad4427-6c38-482b-9d75-e58a442076ac", file: "ASHLEYSCRIPTMTSTD.ttf" },
  { key: "pico", label: "Pico12 — реплики Пенни", description: "Реплики Пенни, машины времени Дейва, в диалогах и её портретных облачках.", sample: "Путешествие во времени продолжается.\nВыберите растения для следующего уровня.", fallback: "comfortaa", uuid: "22yf1a7U5OXom7R1dgKHRK", fullUuid: "22c9fd5a-ed4e-4e5e-89bb-47576028744a", file: "PICO12__.ttf" },
  { key: "terror", label: "House of Terror — предупреждения", description: "Боевые предупреждения и сообщение о поражении.", sample: "Приближается огромная волна зомби!\nЗомби съели ваши мозги!", fallback: "ruslan", uuid: "d9rgNwXkFEtq1me80kgtn3", fullUuid: "d9ae0370-5e41-44b6-ad66-7bcd2482d9f7", file: "HOUSEOFTERROR.ttf" }
];
const FONT_SLOTS_KEY = "local.gardendless.russian-font-fix.font-slots.v1";
const LEGACY_MAIN_KEY = "local.gardendless.russian-font-fix.font-style.v1";
const LEGACY_DIALOG_KEY = "local.gardendless.russian-font-fix.dialog-style.v1";
const own = (object, key) => object != null && Object.hasOwn(object, key);
export function readFontSlots(options, storage) {
  const valid = new Set(options.map(option => option.value));
  let saved, main, dialog;
  try { storage ??= globalThis.localStorage; saved = JSON.parse(storage?.getItem(FONT_SLOTS_KEY) ?? "null"); } catch (_) {}
  try { main = storage?.getItem(LEGACY_MAIN_KEY); dialog = storage?.getItem(LEGACY_DIALOG_KEY); } catch (_) {}
  if (!valid.has(main)) main = undefined;
  if (dialog === "heading") dialog = main;
  const result = {};
  for (const slot of FONT_SLOTS) {
    const legacy = slot.key === "fbu" || slot.key === "terror" ? main : dialog;
    result[slot.key] = own(saved, slot.key) && valid.has(saved[slot.key]) ? saved[slot.key] : valid.has(legacy) ? legacy : slot.fallback;
  }
  return result;
}
export function setFontSlot(resources, key, value, options, storage) {
  if (!FONT_SLOTS.some(slot => slot.key === key) || !options.some(option => option.value === value)) return false;
  resources.fontSlots = { ...resources.fontSlots, [key]: value };
  (storage ?? globalThis.localStorage)?.setItem(FONT_SLOTS_KEY, JSON.stringify(resources.fontSlots));
  return true;
}
export function resetFontSlots(resources, storage) {
  resources.fontSlots = Object.fromEntries(FONT_SLOTS.map(slot => [slot.key, slot.fallback]));
  (storage ?? globalThis.localStorage)?.setItem(FONT_SLOTS_KEY, JSON.stringify(resources.fontSlots));
}
export function fontSlotChoice(resources, key) {
  const slot = FONT_SLOTS.find(slot => slot.key === key) ?? FONT_SLOTS[0];
  return resources.fontSlots?.[slot.key] ?? slot.fallback;
}
export function fontSlotFamily(resources, key, options) {
  if (!resources.custom) return "Arial";
  const choice = fontSlotChoice(resources, key);
  return (options.find(option => option.value === choice) ?? options.find(option => option.value === "ruslan"))?.family ?? "Arial";
}
export function fontOpticalFactor(resources, key) {
  if (!resources.custom) return 1;
  const choice = fontSlotChoice(resources, key);
  return choice === "ruslan" ? 1.18 : key === "ashley" && choice === "caveat" ? 1.20 : 1;
}
export function originalFontSlot(font, node, family = "") {
  const identities = [font?._uuid, font?.uuid, font?.name, font?._native, font?.nativeUrl, font?._nativeAssetURL, family].filter(value => typeof value === "string");
  for (const slot of FONT_SLOTS) if (identities.some(value => value.split("@")[0] === slot.uuid || value.toLowerCase().split("@")[0] === slot.fullUuid || value.toLowerCase().includes(slot.file.toLowerCase()))) return slot.key;
  if (identities.some(value => /HouseofTerror|House.of.Terror/i.test(value))) return "terror";
  for (let current = node; current; current = current.parent) {
    const name = current.name ?? "";
    if (/Zomboss/i.test(name)) return "ashley";
    if (/Winnie|Penny/i.test(name)) return "pico";
    if (/CrazyDave|DaveBubble/i.test(name)) return "brianne";
    if (/^(GamingWarn|GameLoseTip)$/.test(name)) return "terror";
  }
  for (let current = node; current; current = current.parent) if (current.name === "NPC_Controller") return "brianne";
  return "fbu";
}
