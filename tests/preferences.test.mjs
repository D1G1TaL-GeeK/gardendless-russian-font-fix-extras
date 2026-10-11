import assert from "node:assert/strict";
import { test } from "node:test";
import { createLanguageController, readStartupLanguage } from "../src/main.mjs";
import { readPowerPreferences, DEFAULT_PRICES } from "../src/paid-powerups.mjs";
import { createPlanningController } from "../src/planning-boost.mjs";

const LANGUAGE_KEY = "local.gardendless.russian-font-fix.startup-language.v1";
const FIX_KEY = "local.gardendless.russian-font-fix.planning-boost.v1";
const POWER_KEY = "local.gardendless.russian-font-fix.powerups.v1";

function fixture() {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value))
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  const options = { Language: 0, MusicVolume: 0.4, KeyBinds: { Pause: "SPACE" }, extra: { keep: true } };
  storage.setItem("PvZ2_Settings", JSON.stringify(options));
  const ML = { currentLanguage: 0 }, languages = { EN: 0, ZH: 1, RU: 3, amount: 4 };
  const warnings = [];
  let reloads = 0;
  const KeyListener = { isInGame: false, RestartScene() { reloads++; return Promise.resolve(); } };
  const cc = { sys: { localStorage: storage }, director: { getScene: () => ({ name: "mainScene" }) } };
  const classes = { MultiLanguage: ML, LanguageEnum: languages, Setting: { getSettings: () => options }, KeyListener };
  const controllers = [];
  return {
    storage, values, ML, languages, warnings, KeyListener, options,
    get reloads() { return reloads; },
    controller() {
      const result = createLanguageController(cc, classes, { warn: text => warnings.push(text) });
      controllers.push(result);
      return result;
    },
    close() {
      for (const controller of controllers) controller.dispose();
      if (original) Object.defineProperty(globalThis, "localStorage", original);
      else delete globalThis.localStorage;
    }
  };
}

test("fresh defaults allow cheats and disable optional game fixes", () => {
  const f = fixture();
  try {
    assert.equal(readStartupLanguage(), "ru");
    assert.deepEqual(readPowerPreferences(), { mode: "native", block: false, prices: { ...DEFAULT_PRICES } });
    const fix = createPlanningController({});
    assert.equal(fix.enabled, false);
    fix.dispose();
  } finally { f.close(); }
});

test("startup language accepts English and safely rejects unknown saved values", () => {
  const f = fixture();
  try {
    f.storage.setItem(LANGUAGE_KEY, "en");
    assert.equal(readStartupLanguage(), "en");
    f.storage.setItem(LANGUAGE_KEY, "invalid");
    assert.equal(readStartupLanguage(), "ru");
    assert.equal(readStartupLanguage({ getItem() { throw Error("unavailable"); } }), "ru");
  } finally { f.close(); }
});

test("Russian launch changes only the language field and refreshes the menu once", () => {
  const f = fixture();
  try {
    const c = f.controller();
    c.start();
    assert.equal(f.ML.currentLanguage, 3);
    assert.deepEqual(JSON.parse(f.storage.getItem("PvZ2_Settings")), { ...f.options, Language: 3 });
    for (let index = 0; index < 20; index++) c.scan();
    c.start();
    assert.equal(f.reloads, 1);
    assert.deepEqual(f.warnings, []);
  } finally { f.close(); }
});

test("English launch does not require a Russian translation", () => {
  const f = fixture();
  try {
    f.storage.setItem(LANGUAGE_KEY, "en");
    delete f.languages.RU;
    f.languages.amount = 2;
    f.ML.currentLanguage = 1;
    const c = f.controller();
    c.start();
    assert.equal(f.ML.currentLanguage, 0);
    assert.equal(JSON.parse(f.storage.getItem("PvZ2_Settings")).Language, 0);
    assert.equal(f.reloads, 1);
    c.scan();
    assert.equal(f.reloads, 1);
  } finally { f.close(); }
});

test("already-English startup does not unnecessarily reload the menu", () => {
  const f = fixture();
  try {
    f.storage.setItem(LANGUAGE_KEY, "en");
    const c = f.controller();
    c.start();
    assert.equal(f.reloads, 0);
  } finally { f.close(); }
});

test("selection changes take effect on the next launch, not during a level", () => {
  const f = fixture();
  try {
    f.KeyListener.isInGame = true;
    const first = f.controller();
    first.start();
    assert.equal(first.setStartupLanguage("en"), true);
    assert.equal(first.startupLanguage, "en");
    first.scan();
    assert.equal(f.ML.currentLanguage, 3);
    assert.equal(f.reloads, 0);
    const next = f.controller();
    next.start();
    assert.equal(f.ML.currentLanguage, 0);
    assert.equal(f.reloads, 0);
  } finally { f.close(); }
});

test("pending Russian registration uses the launch selection snapshot", () => {
  const f = fixture();
  try {
    delete f.languages.RU;
    f.languages.amount = 2;
    const c = f.controller();
    c.start();
    c.setStartupLanguage("en");
    assert.equal(f.ML.currentLanguage, 0);
    Object.assign(f.languages, { RU: 3, amount: 4 });
    c.scan();
    assert.equal(f.ML.currentLanguage, 3);
    assert.equal(c.startupLanguage, "en");
  } finally { f.close(); }
});

test("missing translation times out without changing the current language", () => {
  const f = fixture(), now = Date.now;
  let time = 100;
  Date.now = () => time;
  try {
    delete f.languages.RU;
    const c = f.controller();
    c.start();
    time += 10001;
    c.scan();
    assert.equal(f.ML.currentLanguage, 0);
    assert.equal(f.warnings.length, 1);
    Object.assign(f.languages, { RU: 3, amount: 4 });
    c.scan();
    assert.equal(f.ML.currentLanguage, 0);
  } finally { Date.now = now; f.close(); }
});

test("invalid language input and disposed controllers cannot change preferences", () => {
  const f = fixture();
  try {
    const c = f.controller();
    assert.equal(c.setStartupLanguage("fr"), false);
    assert.equal(c.startupLanguage, "ru");
    c.dispose();
    assert.equal(c.setStartupLanguage("en"), false);
    c.start();
    c.scan();
    assert.equal(f.ML.currentLanguage, 0);
  } finally { f.close(); }
});

test("manually saved game-fix and power-up choices survive an update", () => {
  const f = fixture();
  try {
    f.storage.setItem(FIX_KEY, "true");
    const fix = createPlanningController({});
    assert.equal(fix.enabled, true);
    fix.setEnabled(false);
    fix.dispose();
    const next = createPlanningController({});
    assert.equal(next.enabled, false);
    next.dispose();
    f.storage.setItem(POWER_KEY, JSON.stringify({ mode: "coins", prices: { snow: 1234 } }));
    const choices = readPowerPreferences();
    assert.equal(choices.mode, "coins");
    assert.equal(choices.prices.snow, 1234);
    assert.equal(choices.prices.food, 1000);
  } finally { f.close(); }
});

test("preference save failure leaves the current level untouched", () => {
  const f = fixture();
  try {
    f.KeyListener.isInGame = true;
    const c = f.controller();
    c.start();
    f.storage.setItem = () => { throw Error("storage unavailable"); };
    assert.equal(c.setStartupLanguage("en"), true);
    c.scan();
    assert.equal(f.ML.currentLanguage, 3);
    assert.equal(f.reloads, 0);
    assert.equal(f.warnings.length, 1);
  } finally { f.close(); }
});

test("cold publication uses English before native loading can read an old Chinese or Spanish index", () => {
  const f = fixture(), now = Date.now;
  let time = 100;
  Date.now = () => time;
  try {
    delete f.languages.RU;
    f.languages.ES = 2; f.languages.amount = 3;
    f.ML.currentLanguage = 1;
    f.storage.setItem("PvZ2_Settings", JSON.stringify({ ...f.options, Language: 2 }));
    const c = f.controller();
    c.start(true);
    assert.equal(f.ML.currentLanguage, 0);
    assert.deepEqual(JSON.parse(f.storage.getItem("PvZ2_Settings")), { ...f.options, Language: 0 });
    time += 120000;
    c.scan();
    assert.deepEqual(f.warnings, [], "slow initial loading does not time out language registration");
    Object.assign(f.languages, { RU: 3, amount: 4 });
    c.start();
    assert.equal(f.ML.currentLanguage, 3);
    assert.equal(JSON.parse(f.storage.getItem("PvZ2_Settings")).Language, 3);
    assert.equal(f.reloads, 1);
  } finally { Date.now = now; f.close(); }
});
