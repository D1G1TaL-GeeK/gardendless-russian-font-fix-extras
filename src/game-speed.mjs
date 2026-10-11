const SPEED_KEY = "local.gardendless.russian-font-fix.game-speed.v1";
function validMultiplier(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const result = Number(typeof value === "string" ? value.trim().replace(",", ".") : value);
  return Number.isFinite(result) && result >= 1 && result <= 10 ? Math.round(result * 10) / 10 : null;
}
export function createSpeedControlView(controller) {
  const doc = globalThis.document, fields = new Map();
  let observer, started = false, disposed = false;
  function removeListeners(field, saved) {
    saved.slider.removeEventListener("input", saved.change);
    field.removeEventListener("change", saved.commit, true);
    field.removeEventListener("keydown", saved.keydown);
  }
  function attach() {
    if (disposed) return;
    for (const [field, saved] of fields) if (!field.isConnected) { removeListeners(field, saved); fields.delete(field); }
    if (!controller.enabled) return;
    for (const field of doc.querySelectorAll('input[type="number"][aria-label="Множитель ускорения, ×"]')) {
      if (fields.has(field) || field.min !== "1" || field.max !== "10" || field.step !== "0.1") continue;
      const parent = field.parentElement, next = field.nextSibling, style = field.getAttribute("style"), parentStyle = parent.getAttribute("style"), focused = doc.activeElement === field, row = doc.createElement("div"), slider = doc.createElement("input"), originalType = field.type;
      field.type = "text";
      parent.style.display = "flex"; parent.style.flexDirection = "column"; parent.style.alignItems = "stretch"; parent.style.gap = "8px";
      row.setAttribute("data-rff-speed-control", "");
      row.style.cssText = "display:flex;align-items:center;gap:12px;min-width:0;width:100%";
      slider.type = "range"; slider.min = "1"; slider.max = "10"; slider.step = "0.1"; slider.value = String(controller.multiplier);
      slider.setAttribute("aria-label", "Множитель ускорения — ползунок");
      slider.style.cssText = "flex:1 1 100px;min-width:80px;max-width:100%;cursor:pointer;accent-color:#69b6ff";
      field.style.width = "88px"; field.style.minWidth = "70px"; field.style.flex = "0 0 88px"; field.style.boxSizing = "border-box";
      const change = () => {
        if (disposed || !controller.enabled || !field.isConnected || field.disabled || field.closest("[inert]")) return;
        if (controller.setMultiplier(slider.value)) field.value = controller.multiplier.toFixed(1);
      };
      const commit = () => {
        const value = validMultiplier(field.value);
        field.value = String(value ?? controller.multiplier);
      };
      const keydown = event => {
        if (disposed || event.isComposing || field.disabled || field.closest("[inert]")) return;
        if (event.key === "Enter") {
          event.preventDefault(); event.stopPropagation();
          field.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const separator = event.code === "Period" && /^[юЮ]$/.test(event.key) ? "." : event.code === "Comma" && /^[бБ]$/.test(event.key) ? "," : event.code === "NumpadDecimal" && event.key !== "Delete" ? "." : null;
        if (separator) {
          event.preventDefault(); event.stopPropagation();
          field.setRangeText(separator, field.selectionStart ?? field.value.length, field.selectionEnd ?? field.value.length, "end");
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };
      slider.addEventListener("input", change);
      field.addEventListener("change", commit, true);
      field.addEventListener("keydown", keydown);
      parent.insertBefore(row, field); row.append(slider, field);
      if (focused) field.focus({ preventScroll: true });
      fields.set(field, { parent, next, style, parentStyle, row, slider, change, commit, keydown, originalType });
    }
  }
  return {
    start() {
      if (started || disposed || !doc?.body) return;
      started = true;
      if (globalThis.MutationObserver) { observer = new MutationObserver(attach); observer.observe(doc.body, { childList: true, subtree: true }); }
      attach();
    },
    dispose() {
      if (disposed) return; disposed = true; observer?.disconnect();
      for (const [field, saved] of fields) {
        removeListeners(field, saved);
        const focused = doc.activeElement === field;
        if (field.parentElement === saved.row) saved.parent.insertBefore(field, saved.next?.parentElement === saved.parent ? saved.next : saved.row.parentElement === saved.parent ? saved.row : null);
        if (saved.style === null) field.removeAttribute("style"); else field.setAttribute("style", saved.style);
        if (saved.parentStyle === null) saved.parent.removeAttribute("style"); else saved.parent.setAttribute("style", saved.parentStyle);
        saved.row.remove();
        field.type = saved.originalType;
        if (focused && field.isConnected) field.focus({ preventScroll: true });
      }
      fields.clear();
    }
  };
}
export function readSpeedPreferences(storage) {
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage)?.getItem(SPEED_KEY) ?? "null");
    return { enabled: saved?.enabled === true, multiplier: validMultiplier(saved?.multiplier) ?? 2 };
  } catch (_) { return { enabled: false, multiplier: 2 }; }
}
export function createSpeedController(cc, native, log = {}, storage) {
  let preferences = readSpeedPreferences(storage), disposed = false, owned = null, warned = false;
  const bound = new WeakSet(), undo = [];
  const clock = cc.director;
  function save() {
    try { (storage ?? globalThis.localStorage)?.setItem(SPEED_KEY, JSON.stringify(preferences)); }
    catch (_) { log.warn?.("Ускорение изменено на текущий запуск; сохранить настройку не удалось."); }
  }
  function active(ui) {
    return !!ui && native.UIInGame?.component === ui && ui.node?.isValid !== false && ui.node?.activeInHierarchy !== false;
  }
  function release() {
    if (owned && clock.gameSpeed === owned.applied) {
      const ui = owned.ui;
      const reset = !active(ui) || ui.sceneEnabled === false || ui.exitNextTick || ui.restartNextTick || ui._exitDealt || native.LevelPlay?.component?.gameLost;
      const factor = Number(native.getGamingSpeed?.()), phase = native.LevelPlay?.sandBoxModeOn && !native.LevelPlay.gameStarted ? 4 : 1;
      clock.gameSpeed = reset ? 1 : ui.paused || native.getSuperSlowed?.() === true ? 0 : factor > 0 && Number.isFinite(factor) ? factor * phase : owned.original;
    }
    owned = null;
  }
  function apply(ui) {
    if (disposed || !preferences.enabled || !active(ui)) return;
    const factor = Number(native.getGamingSpeed?.()), raw = Number(clock.gameSpeed);
    if (!(factor > 1) || !Number.isFinite(factor) || !(raw > 0) || !Number.isFinite(raw) || ui.paused || ui.sceneEnabled === false || ui.exitNextTick || ui.restartNextTick || ui._exitDealt || native.LevelPlay?.component?.gameLost || native.getSuperSlowed?.() === true) { owned = null; return; }
    const phase = native.LevelPlay?.sandBoxModeOn && !native.LevelPlay.gameStarted ? 4 : 1;
    if (Math.abs(raw - factor * phase) > .000001) { owned = null; return; }
    const applied = preferences.multiplier * phase;
    clock.gameSpeed = applied;
    owned = { ui, original: raw, applied };
  }
  function bind() {
    Object.assign(native, native.resolve?.() ?? {});
    const proto = native.UIInGame?.prototype;
    if (!proto || bound.has(proto) || typeof proto.update !== "function") return;
    const original = proto.update, descriptor = Object.getOwnPropertyDescriptor(proto, "update");
    if (descriptor && descriptor.writable === false && !descriptor.set) {
      if (!warned) { warned = true; log.warn?.("Настройка ускорения недоступна: игровой обработчик защищён от изменения."); }
      return;
    }
    const replacement = function(...args) {
      const result = original.apply(this, args);
      if (!disposed) { owned = null; apply(this); }
      return result;
    };
    try { proto.update = replacement; }
    catch (_) {
      if (!warned) { warned = true; log.warn?.("Настройка ускорения недоступна: игровой обработчик защищён от изменения."); }
      return;
    }
    bound.add(proto);
    undo.push(() => { if (proto.update === replacement) { if (descriptor) Object.defineProperty(proto, "update", descriptor); else delete proto.update; } });
  }
  bind();
  return {
    get enabled() { return preferences.enabled; },
    get multiplier() { return preferences.multiplier; },
    setEnabled(value) {
      if (disposed || typeof value !== "boolean") return false;
      release(); preferences = { ...preferences, enabled: value }; save(); bind(); apply(native.UIInGame?.component); return true;
    },
    setMultiplier(value) {
      const multiplier = validMultiplier(value);
      if (disposed || multiplier === null) return false;
      release(); preferences = { ...preferences, multiplier }; save(); bind(); apply(native.UIInGame?.component); return true;
    },
    scan() { if (!disposed) bind(); },
    dispose() { if (disposed) return; disposed = true; release(); for (const restore of undo.reverse()) restore(); }
  };
}
