import assert from "node:assert/strict";
import { test } from "node:test";
import { createAutoCollectController, readAutoCollectPreferences } from "../src/auto-collect.mjs";

function fixture() {
  const values = new Map(), warnings = [], storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  class Drop {
    constructor(type = "coin") { this.DroppingType = type; this.node = { isValid: true, activeInHierarchy: true }; this.ui = { isValid: true }; this.collected = false; this.calls = 0; this.updates = 0; this.allowed = true; }
    characterUpdate() { this.updates++; return "native"; }
    collectable() { return !this.collected && this.allowed; }
    collect() { if (this.collectable()) { this.collected = true; this.calls++; } }
  }
  class ZenDrop extends Drop { update() { this.updates++; return "garden"; } }
  const bank = { count: 0, full() { return this.count >= 3; } }, level = { AutoCollectList: ["gem"] }, ui = {};
  const original = Drop.prototype.characterUpdate, gardenOriginal = ZenDrop.prototype.update;
  const native = { dropping: Drop, droppingInZen: ZenDrop, LevelPlay: { component: level }, UIInGame: { component: ui }, PlantFoodCount: { component: bank } };
  const controller = createAutoCollectController({}, native, { warn: value => warnings.push(value) }, storage);
  controller.scan();
  return { Drop, ZenDrop, controller, native, bank, level, ui, storage, values, warnings, original, gardenOriginal };
}

test("new, malformed, and inaccessible preferences leave all three collectors disabled", () => {
  const expected = { other: false, sun: false, plantfood: false };
  for (const text of [null, "null", "{", "true", '{"other":"true","sun":1,"plantfood":[]}' ]) assert.deepEqual(readAutoCollectPreferences({ getItem: () => text }), expected);
  assert.deepEqual(readAutoCollectPreferences({ getItem() { throw Error("denied"); } }), expected);
  const f = fixture(), drop = new f.Drop(); drop.characterUpdate(.016); assert.equal(drop.calls, 0); assert.equal(drop.updates, 1); f.controller.dispose();
});

test("all eight toggle combinations separate sun and plant food from every other pickup", () => {
  const f = fixture();
  for (let mask = 0; mask < 8; mask++) {
    ["other", "sun", "plantfood"].forEach((key, index) => f.controller.setEnabled(key, !!(mask & (1 << index))));
    for (const type of ["coin", "gem", "sprout", "ticket", "sun", "plantfood", "", "future-reward"]) {
      const drop = new f.Drop(type), expected = type === "sun" ? !!(mask & 2) : type === "plantfood" ? !!(mask & 4) : !!type && !!(mask & 1);
      assert.equal(drop.characterUpdate(.016), "native"); assert.equal(drop.calls, Number(expected), `${mask}: ${type}`);
      for (let i = 0; i < 50; i++) drop.characterUpdate(.016);
      assert.equal(drop.calls, Number(expected), "no duplicate native collection");
    }
  }
  assert.deepEqual(f.level.AutoCollectList, ["gem"]); f.controller.dispose();
});

test("live toggles immediately govern both existing drops and reused pooled drops", () => {
  const f = fixture(), drop = new f.Drop("sun"); drop.characterUpdate(.016); assert.equal(drop.calls, 0);
  f.controller.setEnabled("sun", true); drop.characterUpdate(.016); assert.equal(drop.calls, 1);
  drop.collected = false; f.controller.setEnabled("sun", false); drop.characterUpdate(.016); assert.equal(drop.calls, 1);
  f.controller.setEnabled("sun", true); drop.characterUpdate(.016); assert.equal(drop.calls, 2);
  assert.deepEqual(readAutoCollectPreferences(f.storage), { other: false, sun: true, plantfood: false }); f.controller.dispose();
});

test("full plant-food banks wait silently and pick up when a slot becomes available", () => {
  const f = fixture(), drop = new f.Drop("plantfood"); f.controller.setEnabled("plantfood", true); f.bank.count = 3;
  for (let i = 0; i < 120; i++) drop.characterUpdate(.016); assert.equal(drop.calls, 0); assert.deepEqual(f.warnings, []);
  f.bank.count = 2; drop.characterUpdate(.016); assert.equal(drop.calls, 1);
  drop.collected = false; f.bank.count = 3; f.native.getFreePlantFood = () => true; drop.characterUpdate(.016); assert.equal(drop.calls, 2); f.controller.dispose();
});

test("pause, zero time, transitions, ended levels, hidden, fading and tutorial-locked drops are respected", () => {
  const f = fixture(); f.controller.setEnabled("other", true);
  for (const [object, key, value] of [[f.ui,"paused",true],[f.ui,"exitNextTick",true],[f.ui,"restartNextTick",true],[f.ui,"sceneEnabled",false],[f.level,"gameOver",true],[f.level,"gameWon",true],[f.level,"gameLost",true]]) {
    object[key] = value; const drop = new f.Drop(); drop.characterUpdate(.016); assert.equal(drop.calls, 0, key); delete object[key];
  }
  for (const change of [drop => drop.disabled = true, drop => drop.fadingAway = true, drop => drop.enabled = false, drop => drop.mouseListen = false, drop => drop.node.isValid = false, drop => drop.node.activeInHierarchy = false, drop => drop.ui = null, drop => drop.allowed = false]) {
    const drop = new f.Drop(); change(drop); drop.characterUpdate(.016); assert.equal(drop.calls, 0);
  }
  for (const dt of [0, -1, NaN]) { const drop = new f.Drop(); drop.characterUpdate(dt); assert.equal(drop.calls, 0); }
  f.controller.dispose();
});

test("garden pickups use only the other-drop preference and keep native methods on disposal", () => {
  const f = fixture(), drop = new f.ZenDrop(); f.controller.setEnabled("sun", true); f.controller.setEnabled("plantfood", true); drop.update(.016); assert.equal(drop.calls, 0);
  f.controller.setEnabled("other", true); assert.equal(drop.update(.016), "garden"); assert.equal(drop.calls, 1);
  f.controller.dispose(); assert.equal(f.Drop.prototype.characterUpdate, f.original); assert.equal(f.ZenDrop.prototype.update, f.gardenOriginal);
  drop.collected = false; drop.update(.016); assert.equal(drop.calls, 1); assert.equal(f.controller.setEnabled("other", true), false);
});

test("binding waits for loaded classes, ignores invalid settings and preserves another mod's replacement", () => {
  const f = fixture(); f.controller.dispose();
  const native = {}, controller = createAutoCollectController({}, native, {}, f.storage);
  controller.scan(); native.resolveAutoCollect = () => ({ ...f.native }); controller.setEnabled("other", true);
  const drop = new f.Drop(); drop.characterUpdate(.016); assert.equal(drop.calls, 1);
  assert.equal(controller.setEnabled("unknown", true), false); assert.equal(controller.setEnabled("sun", "true"), false);
  const external = () => "external"; f.Drop.prototype.characterUpdate = external; controller.dispose(); assert.equal(f.Drop.prototype.characterUpdate, external); f.Drop.prototype.characterUpdate = f.original;
});

test("the master switch clears every collector immediately and persists the reset", () => {
  const f = fixture();
  for (const key of ["other", "sun", "plantfood"]) f.controller.setEnabled(key, true);
  assert.equal(f.controller.enabled, true);
  assert.equal(f.controller.setActive(false), true);
  assert.equal(f.controller.enabled, false);
  assert.deepEqual(f.controller.preferences, { other: false, sun: false, plantfood: false });
  for (const type of ["coin", "gem", "sun", "plantfood"]) {
    const drop = new f.Drop(type); drop.characterUpdate(.016); assert.equal(drop.calls, 0);
  }
  const garden = new f.ZenDrop(); garden.update(.016); assert.equal(garden.calls, 0);
  assert.deepEqual(readAutoCollectPreferences(f.storage), f.controller.preferences);
  f.controller.setActive(true);
  assert.deepEqual(f.controller.preferences, { other: false, sun: false, plantfood: false });
  const coin = new f.Drop(); coin.characterUpdate(.016); assert.equal(coin.calls, 0);
  f.controller.dispose();
  const next = createAutoCollectController({}, {}, {}, f.storage);
  assert.equal(next.enabled, true, "an open empty submenu also survives a restart");
  assert.deepEqual(next.preferences, { other: false, sun: false, plantfood: false });
  next.dispose(); assert.equal(next.setActive(true), false);
});

test("legacy enabled collectors open their submenu; a saved master-off flag takes precedence", () => {
  const storage = { getItem: () => '{"other":true,"sun":true,"plantfood":true}' };
  const legacy = createAutoCollectController({}, {}, {}, storage);
  assert.equal(legacy.enabled, true);
  assert.deepEqual(legacy.preferences, { other: true, sun: true, plantfood: true });
  legacy.dispose();
  const off = createAutoCollectController({}, {}, {}, { getItem: () => '{"enabled":false,"other":true,"sun":true,"plantfood":true}' });
  assert.equal(off.enabled, false);
  assert.deepEqual(off.preferences, { other: false, sun: false, plantfood: false });
  assert.equal(off.setActive("true"), false);
  off.dispose();
});
