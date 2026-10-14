export const SESSION_LOG_RELATIVE_PATH = "gp-next/logs/Gardendless-debug.txt";

export function createSessionLog(ctx = {}, options = {}) {
  const host = options.host ?? globalThis;
  const target = options.window ?? host.window ?? host;
  const output = options.console ?? host.console;
  const now = options.now ?? (() => Date.now());
  const invoke = options.invoke ?? target.__TAURI_INTERNALS__?.invoke?.bind(target.__TAURI_INTERNALS__);
  const restorers = [], pending = [], capturedGp = new Map();
  let started = false, disposed = false, inFlight = null, timer = null, debugDepth = 0, loadingHistory = true;
  let filePath = SESSION_LOG_RELATIVE_PATH, failure = "", savedLines = 0, ready = Promise.resolve(false);
  const originalWarn = output?.warn?.bind(output);
  const reportFailure = () => {
    try {
      if (ctx.log?.warn) ctx.log.warn(`Не удалось автоматически записать TXT-журнал. Используйте «Сохранить копию журнала TXT». ${failure}`);
      else originalWarn?.("[Gardendless log] Автозапись недоступна:", failure);
    } catch {}
  };
  const stringify = value => {
    if (value instanceof Error || (value && typeof value === "object" && typeof value.stack === "string")) {
      return value.stack ?? String(value.message ?? value);
    }
    if (typeof value === "string") return value;
    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (_key, item) => {
        if (typeof item === "bigint") return item.toString();
        if (item instanceof Error) return {name:item.name, message:item.message, stack:item.stack};
        if (item && typeof item === "object") {
          if (seen.has(item)) return "[Circular]";
          seen.add(item);
        }
        return item;
      }) ?? String(value);
    } catch { return String(value); }
  };
  const record = (level, source, message, time = now()) => {
    if (disposed) return;
    const timestamp = new Date(Number.isFinite(Number(time)) ? Number(time) : now()).toISOString();
    pending.push(`[${timestamp}] [${level.toUpperCase()}] [${source}] ${String(message).replace(/\r?\n/g, "\r\n")}\r\n`);
    if (level === "error" || pending.length >= 128) queueMicrotask(() => {void flush();});
  };
  const captureConsole = (level, args) => {
    const prefix = /^\[GP Next:([^\]]+)\]/.exec(String(args[0] ?? ""));
    if (prefix) {
      if (debugDepth) return;
      const message = args.slice(1).map(stringify).join(" ");
      if (loadingHistory) capturedGp.set(`${prefix[1]}|${level}|${message}`, now());
      record(level, `GP Next:${prefix[1]}`, message);
    } else record(level, "game", args.map(stringify).join(" "));
  };
  async function flush() {
    if (inFlight) {await inFlight; if (!failure && pending.length) return flush(); return !failure;}
    if (!pending.length || failure) return !failure;
    const batch = pending.splice(0);
    inFlight = (async () => {
      if (!(await ready)) {pending.unshift(...batch);return false;}
      try {
        // Same Tauri fs transport used by GP Next's own mod-data storage.
        // Append is documented at https://v2.tauri.app/reference/javascript/fs/.
        await invoke("plugin:fs|write_text_file", new TextEncoder().encode(batch.join("")), {
          headers:{path:encodeURIComponent(SESSION_LOG_RELATIVE_PATH),options:JSON.stringify({baseDir:14,append:true,create:true})}
        });
        savedLines += batch.length;
        return true;
      } catch (error) {
        pending.unshift(...batch);
        failure = stringify(error);
        reportFailure();
        return false;
      }
    })();
    try {return await inFlight;} finally {inFlight = null;}
  }
  async function loadHistory() {
    try {
      const load = options.loadLogger ?? (() => {
        if (!invoke || !host.location?.href) return null;
        const url = new URL("/assets/logger-B5QI9Y1q.js", host.location.href).href;
        return import(url);
      });
      const module = await load();
      if (disposed || !module) return;
      for (const entry of module.n?.() ?? []) {
        const level = String(entry.level ?? "info"), message = String(entry.msg ?? "");
        const key = `${entry.module}|${level}|${message}`;
        if (Math.abs((capturedGp.get(key) ?? -Infinity) - entry.time) > 3000) record(level, `GP Next:${entry.module}`, message, entry.time);
      }
      // GP Next debug entries otherwise stay inside its 200-line UI buffer.
      // Leave its single UI listener intact and preserve native console behavior.
      const prototype = module.t?.prototype, original = prototype?.debug;
      if (typeof original === "function") {
        const wrapper = function (...args) {
          try {record("debug", `GP Next:${this.module}`, args.map(stringify).join(" "));} catch {}
          debugDepth++;
          try {return original.apply(this, args);} finally {debugDepth--;}
        };
        prototype.debug = wrapper;
        restorers.push(() => {if (prototype.debug === wrapper) prototype.debug = original;});
      }
      record("info", "journal", "Доступный журнал GP Next до загрузки мода добавлен.");
    } catch (error) {record("warn", "journal", `Ранний журнал GP Next недоступен: ${stringify(error)}`);}
    finally {loadingHistory = false;capturedGp.clear();}
  }
  function start() {
    if (started) return;
    started = true;
    let platformVersion = "unknown";
    try {platformVersion = ctx.compat?.getPlatformVersion?.() ?? target.gpNext?.version ?? "unknown";} catch {}
    record("info", "session", `Gardendless: начало сеанса. GP Next ${platformVersion}; мод ${ctx.meta?.namespace ?? "russian-font-fix"} ${ctx.meta?.version ?? "1.0.3"}.`);
    for (const method of ["log","info","warn","error","debug","trace","table","dir","assert"]) {
      const original = output?.[method];
      if (typeof original !== "function") continue;
      const wrapper = function (...args) {
        try {if (method !== "assert" || !args[0]) {
          const level = method === "assert" ? "error" : ["warn","error","debug"].includes(method) ? method : "info";
          captureConsole(level, method === "assert" ? args.slice(1) : args);
        }} catch {} // A diagnostic hook must never break the game's console call.
        return original.apply(this, args);
      };
      try {
        output[method] = wrapper;
        restorers.push(() => {if (output[method] === wrapper) output[method] = original;});
      } catch {} // A console method may have been locked by another mod.
    }
    const listen = (event, listener, capture = false) => {
      target.addEventListener?.(event, listener, capture);
      restorers.push(() => target.removeEventListener?.(event, listener, capture));
    };
    listen("error", event => record("error", "uncaught", `${stringify(event.error ?? event.message ?? "Resource load failed")} ${event.filename ?? event.target?.src ?? event.target?.href ?? ""}:${event.lineno ?? ""}:${event.colno ?? ""}`), true);
    listen("unhandledrejection", event => record("error", "promise", stringify(event.reason)));
    listen("pagehide", () => {void flush();});
    ready = (async () => {
      if (!invoke) {failure = "Автозапись TXT доступна в настольной версии игры. Используйте кнопку сохранения копии.";return false;}
      try {
        const root = await invoke("plugin:path|resolve_directory", {directory:14});
        const separator = /^[A-Za-z]:|\\/.test(root) ? "\\" : "/";
        filePath = String(root).replace(/[\\/]+$/, "") + separator + SESSION_LOG_RELATIVE_PATH.replace(/\//g, separator);
        await invoke("plugin:fs|mkdir", {path:"gp-next/logs",options:{baseDir:14,recursive:true}});
        return true;
      } catch (error) {failure = stringify(error);reportFailure();return false;}
    })();
    void loadHistory();
    if (options.autoFlush !== false) timer = host.setInterval?.(() => {void flush();}, 2000);
    void ready.then(() => flush());
  }
  async function exportText() {
    await flush();
    if (savedLines) {
      const disk = await invoke("plugin:fs|read_text_file", {path:SESSION_LOG_RELATIVE_PATH,options:{baseDir:14}});
      return disk + pending.join("");
    }
    return pending.join("");
  }
  async function download() {
    const text = await exportText();
    const url = host.URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"}));
    const anchor = host.document.createElement("a");anchor.href = url;anchor.download = "Gardendless-debug.txt";
    anchor.click();host.setTimeout(() => host.URL.revokeObjectURL(url), 60000);
    return text;
  }
  async function dispose() {
    if (disposed) return;
    record("info", "session", "Конец сеанса сбора журнала.");
    disposed = true;
    if (timer !== null) host.clearInterval?.(timer);
    for (const restore of restorers.reverse()) {try {restore();} catch {}}
    await flush();
  }
  return {start,flush,exportText,download,dispose,get path(){return filePath;},get error(){return failure;},get savedLines(){return savedLines;}};
}
