const AUTO_COLLECT_KEY = "local.gardendless.russian-font-fix.auto-collect.v1";
export function readAutoCollectPreferences(storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage)?.getItem(AUTO_COLLECT_KEY) ?? "null");
    return { other: value?.other === true, sun: value?.sun === true, plantfood: value?.plantfood === true };
  } catch (_) { return { other: false, sun: false, plantfood: false }; }
}
export function createAutoCollectController(cc, native, log = {}, storage) {
  const preferences = readAutoCollectPreferences(storage), bound = new WeakSet(), undo = [];
  let disposed = false, warned = false;
  function collect(drop, dt, garden) {
    if (disposed || !(dt > 0) || drop.collected || drop.disabled || drop.fadingAway || drop.node?.isValid === false ||
      drop.node?.activeInHierarchy === false || drop.enabled === false || drop.mouseListen === false) return;
    const level = native.LevelPlay?.component, ui = native.UIInGame?.component;
    if (!garden && (!level || level.gameOver || level.gameWon || level.gameLost || ui?.paused || ui?.exitNextTick || ui?.restartNextTick || ui?.sceneEnabled === false)) return;
    const type = garden ? "other" : drop.DroppingType === "sun" ? "sun" : drop.DroppingType === "plantfood" ? "plantfood" : drop.DroppingType ? "other" : null;
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
      const result = original.call(this, dt, ...args);
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
    get preferences() { return { ...preferences }; },
    setEnabled(key, value) {
      if (disposed || !Object.hasOwn(preferences, key) || typeof value !== "boolean") return false;
      preferences[key] = value;
      try { (storage ?? globalThis.localStorage)?.setItem(AUTO_COLLECT_KEY, JSON.stringify(preferences)); }
      catch (_) { log.warn?.("Автоподбор изменён на текущий запуск; сохранить настройку не удалось."); }
      scan();
      return true;
    },
    dispose() { if (disposed) return; disposed = true; for (const restore of undo.reverse()) restore(); undo.length = 0; }
  };
}
