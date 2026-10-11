import assert from "node:assert/strict";
import { test } from "node:test";
import { createSpeedController, readSpeedPreferences } from "../src/game-speed.mjs";

function fixture() {
  const values = new Map(), warnings = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const clock = { gameSpeed: 1 }, level = { component: { gameLost: false }, sandBoxModeOn: false, gameStarted: true };
  let factor = 1, slowed = false;
  class UI {
    constructor() { this.node = { isValid: true, activeInHierarchy: true }; this.sceneEnabled = true; this.paused = false; }
    update() { clock.gameSpeed = this.paused || slowed ? 0 : factor * (level.sandBoxModeOn && !level.gameStarted ? 4 : 1); return "native-result"; }
    speedUp() { factor = factor === 1 ? 1.5 : 1; }
  }
  const original = UI.prototype.update, ui = new UI(); UI.component = ui;
  const native = { UIInGame: UI, LevelPlay: level, getGamingSpeed: () => factor, getSuperSlowed: () => slowed };
  const controller = createSpeedController({ director: clock }, native, { warn: value => warnings.push(value) }, storage);
  return { clock, controller, ui, UI, native, original, storage, values, warnings, level, slow(value) { slowed = value; } };
}

test("fresh and unreadable preferences disable custom speed without losing the native default", () => {
  assert.deepEqual(readSpeedPreferences({ getItem: () => null }), { enabled: false, multiplier: 2 });
  assert.deepEqual(readSpeedPreferences({ getItem() { throw Error("denied"); } }), { enabled: false, multiplier: 2 });
  for (const value of ['{', 'null', 'true', '{"enabled":"true","multiplier":99}']) {
    assert.deepEqual(readSpeedPreferences({ getItem: () => value }), { enabled: false, multiplier: 2 });
  }
  const f = fixture(); assert.equal(f.ui.update(), "native-result"); f.ui.speedUp(); f.ui.update(); assert.equal(f.clock.gameSpeed, 1.5); f.controller.dispose();
});

test("the complete 1–10 range uses one-decimal values and preserves the native toggle", () => {
  const f = fixture(); f.controller.setEnabled(true);
  for (let tenth = 10; tenth <= 100; tenth++) {
    const value = tenth / 10; assert.equal(f.controller.setMultiplier(String(value)), true);
    f.ui.update(); assert.equal(f.clock.gameSpeed, 1);
    f.ui.speedUp(); assert.equal(f.ui.update(), "native-result"); assert.equal(f.clock.gameSpeed, value);
    for (let frame = 0; frame < 20; frame++) f.ui.update(); assert.equal(f.clock.gameSpeed, value);
    f.ui.speedUp(); f.ui.update(); assert.equal(f.clock.gameSpeed, 1);
  }
  f.controller.dispose();
});

test("invalid input keeps the last valid setting; extra decimal places are rounded", () => {
  const f = fixture(); f.controller.setMultiplier(3.1);
  for (const value of [0, -1, 10.1, Infinity, NaN, "", " ", "oops", null, false, [], {}]) {
    assert.equal(f.controller.setMultiplier(value), false); assert.equal(f.controller.multiplier, 3.1);
  }
  assert.equal(f.controller.setMultiplier("2,1"), true); assert.equal(f.controller.multiplier, 2.1);
  f.controller.setMultiplier(2.16); assert.equal(f.controller.multiplier, 2.2);
  assert.equal(f.controller.setEnabled("true"), false); assert.equal(f.controller.enabled, false); f.controller.dispose();
});

test("editing and disabling custom speed during acceleration do not multiply the previous result", () => {
  const f = fixture(); f.ui.speedUp(); f.ui.update(); f.controller.setEnabled(true); assert.equal(f.clock.gameSpeed, 2);
  for (const value of [2.1, 5, 10, 1, 3.5]) { f.controller.setMultiplier(value); assert.equal(f.clock.gameSpeed, value); }
  f.controller.setEnabled(false); assert.equal(f.clock.gameSpeed, 1.5); f.ui.update(); assert.equal(f.clock.gameSpeed, 1.5);
  f.controller.setEnabled(true); assert.equal(f.clock.gameSpeed, 3.5); f.controller.dispose(); assert.equal(f.clock.gameSpeed, 1.5); assert.equal(f.UI.prototype.update, f.original);
});

test("pauses and cinematic slowdown stay at zero when settings change", () => {
  const f = fixture(); f.controller.setEnabled(true); f.controller.setMultiplier(5); f.ui.speedUp(); f.ui.update();
  f.ui.paused = true; f.ui.update(); assert.equal(f.clock.gameSpeed, 0); f.controller.setMultiplier(10); assert.equal(f.clock.gameSpeed, 0);
  f.ui.paused = false; f.ui.update(); assert.equal(f.clock.gameSpeed, 10); f.slow(true); f.ui.update(); assert.equal(f.clock.gameSpeed, 0);
  f.controller.setEnabled(false); assert.equal(f.clock.gameSpeed, 0); f.controller.setEnabled(true); assert.equal(f.clock.gameSpeed, 0);
  f.slow(false); f.ui.update(); assert.equal(f.clock.gameSpeed, 10); f.ui.paused = true; f.controller.dispose(); assert.equal(f.clock.gameSpeed, 0);
});

test("the sandbox preparation factor is retained and active gameplay uses only the chosen factor", () => {
  const f = fixture(); f.level.sandBoxModeOn = true; f.level.gameStarted = false;
  f.controller.setEnabled(true); f.controller.setMultiplier(3.5); f.ui.update(); assert.equal(f.clock.gameSpeed, 4);
  f.ui.speedUp(); f.ui.update(); assert.equal(f.clock.gameSpeed, 14); f.level.gameStarted = true; f.ui.update(); assert.equal(f.clock.gameSpeed, 3.5); f.controller.dispose();
});

test("edits between native state changes and the next frame use the latest button and phase state", () => {
  const f = fixture(); f.controller.setEnabled(true); f.controller.setMultiplier(5); f.ui.speedUp(); f.ui.update();
  f.ui.speedUp(); f.controller.setMultiplier(2.1); assert.equal(f.clock.gameSpeed, 1);
  f.ui.update(); assert.equal(f.clock.gameSpeed, 1);
  f.ui.speedUp(); f.ui.update(); f.ui.paused = true; f.controller.setMultiplier(9.9); assert.equal(f.clock.gameSpeed, 0);
  f.ui.paused = false; f.ui.update(); assert.equal(f.clock.gameSpeed, 9.9);
  f.level.sandBoxModeOn = true; f.level.gameStarted = false; f.ui.update(); assert.equal(f.clock.gameSpeed, 39.6);
  f.level.gameStarted = true; f.controller.setMultiplier(3.7); assert.equal(f.clock.gameSpeed, 3.7);
  f.level.gameStarted = false; f.controller.setEnabled(false); assert.equal(f.clock.gameSpeed, 6);
  f.controller.dispose();
});

test("late registration, scene changes and disposed callbacks leave unrelated clocks alone", () => {
  const f = fixture(); f.controller.dispose(); const native = {};
  const c = createSpeedController({ director: f.clock }, native, {}, f.storage); c.setEnabled(true); c.setMultiplier(5);
  native.resolve = () => f.native; c.scan(); f.ui.speedUp(); f.ui.update(); assert.equal(f.clock.gameSpeed, 5);
  f.UI.component = new f.UI(); f.ui.update(); assert.equal(f.clock.gameSpeed, 1.5);
  f.UI.component = f.ui; f.ui.update(); f.clock.gameSpeed = 0; c.dispose(); assert.equal(f.clock.gameSpeed, 0);
  assert.equal(c.setEnabled(true), false); assert.equal(c.setMultiplier(7), false); c.scan(); assert.equal(f.UI.prototype.update, f.original);
});

test("saved choices survive a new controller and a write failure does not break the current game", () => {
  const f = fixture(); f.controller.setMultiplier(4.7); f.controller.setEnabled(true); f.controller.dispose();
  const c = createSpeedController({ director: f.clock }, f.native, {}, f.storage); assert.equal(c.enabled, true); assert.equal(c.multiplier, 4.7); c.dispose();
  f.storage.setItem = () => { throw Error("quota"); };
  const d = createSpeedController({ director: f.clock }, f.native, { warn: text => f.warnings.push(text) }, f.storage);
  d.setMultiplier(6.2); f.ui.speedUp(); f.ui.update(); assert.equal(f.clock.gameSpeed, 6.2); assert.equal(f.warnings.length, 1); d.dispose();
});

test("read-only handlers fail safely and later mod wrappers are preserved on disposal", () => {
  const f = fixture(); const own = f.UI.prototype.update; f.UI.prototype.update = function(...args) { return own.apply(this, args); };
  const other = f.UI.prototype.update; f.controller.dispose(); assert.equal(f.UI.prototype.update, other); f.ui.speedUp(); f.ui.update(); assert.equal(f.clock.gameSpeed, 1.5);
  class Locked {} Object.defineProperty(Locked.prototype, "update", { value() {}, writable: false });
  const logs = [], c = createSpeedController({ director: { gameSpeed: 1 } }, { UIInGame: Locked }, { warn: value => logs.push(value) }, f.storage);
  c.scan(); c.scan(); assert.equal(logs.length, 1); c.dispose();
});
