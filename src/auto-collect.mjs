const AUTO_COLLECT_KEY = "local.gardendless.russian-font-fix.auto-collect.v1";
function readAutoCollectState(storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage)?.getItem(AUTO_COLLECT_KEY) ?? "null");
    const preferences = { other: value?.other === true, sun: value?.sun === true, plantfood: value?.plantfood === true };
    const enabled = value?.enabled === true || (value?.enabled !== false && Object.values(preferences).some(Boolean));
    if (!enabled) for (const key of Object.keys(preferences)) preferences[key] = false;
    return { enabled, preferences };
  } catch (_) { return { enabled: false, preferences: { other: false, sun: false, plantfood: false } }; }
}
export function readAutoCollectPreferences(storage) {
  return readAutoCollectState(storage).preferences;
}
export function createAutoCollectController(cc, native, log = {}, storage) {
  const state = readAutoCollectState(storage), preferences = state.preferences, bound = new WeakSet(), undo = [];
  let enabled = state.enabled, disposed = false, warned = false;
  function save() {
    try { (storage ?? globalThis.localStorage)?.setItem(AUTO_COLLECT_KEY, JSON.stringify({ enabled, ...preferences })); }
    catch (_) { log.warn?.("Автоподбор изменён на текущий запуск; сохранить настройку не удалось."); }
  }
  function pickupType(drop, garden) {
    const type = typeof drop.DroppingType === "string" ? drop.DroppingType.trim().toLowerCase() : "";
    if (type === "plantfood") return "plantfood";
    return garden ? "other" : type === "sun" ? "sun" : type ? "other" : null;
  }
  function collect(drop, dt, garden) {
    if (disposed || !enabled || !(dt > 0) || drop.collected || drop.disabled || drop.fadingAway || drop.node?.isValid === false ||
      drop.node?.activeInHierarchy === false || drop.enabled === false || drop.mouseListen === false) return;
    const level = native.LevelPlay?.component, ui = native.UIInGame?.component;
    if (!garden && (!level || level.gameOver || level.gameWon || level.gameLost || ui?.paused || ui?.exitNextTick || ui?.restartNextTick || ui?.sceneEnabled === false)) return;
    const type = pickupType(drop, garden);
    if (!type || !preferences[type] || typeof drop.collect !== "function" || typeof drop.collectable !== "function" || !drop.collectable()) return;
    if (!drop.ui || drop.ui.isValid === false) return;
    if (type === "plantfood") {
      const bank = native.PlantFoodCount?.component;
      if (!bank || (bank.full() && native.getFreePlantFood?.() !== true)) return;
    }
    drop.collect();
  }
  function patch(proto, key, garden) {
    if (!proto || bound.has(proto) || typeof proto[key] !== "function") return;
    bound.add(proto);
    const original = proto[key], own = Object.getOwnPropertyDescriptor(proto, key);
    const replacement = function(dt, ...args) {
      // Native level rules can collect before our post-update preference check.
      // Mask only their automatic Plant Food entry during this synchronous
      // update. Mouse pickup still runs normally, and the list is restored.
      const list = !garden && pickupType(this, false) === "plantfood" &&
        (!enabled || !preferences.plantfood) ? native.LevelPlay?.component?.AutoCollectList : null;
      const removed = [];
      if (Array.isArray(list)) {
        for (let i = list.length - 1; i >= 0; i--) {
          if (typeof list[i] === "string" && list[i].trim().toLowerCase() === "plantfood") {
            removed.push([i, list[i]]);
            list.splice(i, 1);
          }
        }
      }
      let result;
      try { result = original.call(this, dt, ...args); }
      finally { for (const [i, value] of removed.reverse()) list.splice(i, 0, value); }
      try { collect(this, dt, garden); }
      catch (error) { if (!warned) { warned = true; log.warn?.(`Автоподбор: ${String(error?.message ?? error)}`); } }
      return result;
    };
    proto[key] = replacement;
    undo.push(() => { if (proto[key] === replacement) { if (own) Object.defineProperty(proto, key, own); else delete proto[key]; } });
  }
  function scan() {
    if (disposed) return;
    Object.assign(native, native.resolveAutoCollect?.() ?? {});
    patch(native.dropping?.prototype, "characterUpdate", false);
    patch(native.droppingInZen?.prototype, "update", true);
  }
  return {
    scan,
    get enabled() { return enabled; },
    get preferences() { return { ...preferences }; },
    setActive(value) {
      if (disposed || typeof value !== "boolean") return false;
      enabled = value;
      if (!enabled) for (const key of Object.keys(preferences)) preferences[key] = false;
      save();
      scan();
      return true;
    },
    setEnabled(key, value) {
      if (disposed || !Object.hasOwn(preferences, key) || typeof value !== "boolean") return false;
      preferences[key] = value;
      if (value) enabled = true;
      save();
      scan();
      return true;
    },
    dispose() { if (disposed) return; disposed = true; for (const restore of undo.reverse()) restore(); undo.length = 0; }
  };
}
