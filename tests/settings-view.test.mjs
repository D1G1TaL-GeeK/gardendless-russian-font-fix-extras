import assert from "node:assert/strict";
import { test } from "node:test";
import { createSettingsControlView } from "../src/settings-view.mjs";

function fixture(action) {
  const jobs = new Map(), events = new Map(); let next = 0;
  const outer = { isConnected: true, scrollTop: 80, scrollLeft: 6, parentElement: null };
  const inner = { isConnected: true, scrollTop: 970, scrollLeft: 12, parentElement: outer };
  const field = { parentElement: inner, getAttribute: () => "Multiplier" };
  const doc = { querySelectorAll: () => [field], scrollingElement: outer, addEventListener: (type, fn) => events.set(type, fn), removeEventListener: type => events.delete(type) };
  const frame = { getComputedStyle: () => ({ overflowY: "auto", overflowX: "visible" }), requestAnimationFrame: fn => { jobs.set(++next, fn); return next; }, cancelAnimationFrame: id => jobs.delete(id) };
  const view = createSettingsControlView(doc, frame);
  const panel = view.wrapPanel({ groups: [{ items: [{ key: "speed", label: "Multiplier", type: "number", getValue: () => 2, setValue: action }] }] });
  const flush = () => { for (const [id, fn] of [...jobs]) { jobs.delete(id); fn(); } };
  return { outer, inner, field, events, jobs, view, item: panel.groups[0].items[0], flush };
}

test("all scrollable ancestors regain their positions after the native form replacement", async () => {
  let entered;
  const f = fixture(value => { entered = value; return "saved"; });
  assert.equal(await f.item.setValue(2.1), "saved"); assert.equal(entered, 2.1);
  f.inner.scrollTop = 0; f.inner.scrollLeft = 0; f.outer.scrollTop = 0;
  f.flush(); assert.equal(f.inner.scrollTop, 970); assert.equal(f.inner.scrollLeft, 12); assert.equal(f.outer.scrollTop, 80);
  f.inner.scrollTop = 0; f.flush(); assert.equal(f.inner.scrollTop, 970); assert.equal(f.jobs.size, 0); f.view.dispose();
});

test("restoration is scheduled even if setting application rejects", async () => {
  const f = fixture(() => { throw Error("rejected"); });
  await assert.rejects(f.item.setValue(7), /rejected/);
  f.inner.scrollTop = 0; f.flush(); assert.equal(f.inner.scrollTop, 970); f.view.dispose();
});

test("manual user scrolling cancels queued restoration", async () => {
  const f = fixture(() => true); await f.item.setValue(3);
  f.inner.scrollTop = 420; f.events.get("wheel")({ isTrusted: true }); f.flush();
  assert.equal(f.inner.scrollTop, 420); assert.equal(f.jobs.size, 0); f.view.dispose();
});

test("user scrolling during an asynchronous setting is not undone when it completes", async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  const applying = f.item.setValue(3);
  f.inner.scrollTop = 420; f.events.get("wheel")({ isTrusted: true });
  finish(true); await applying; f.flush();
  assert.equal(f.inner.scrollTop, 420); assert.equal(f.jobs.size, 0); f.view.dispose();
});

test("new updates, disconnected panes and disposal cannot apply stale scroll positions", async () => {
  const f = fixture(() => true); await f.item.setValue(3);
  f.inner.scrollTop = 640; await f.item.setValue(4); f.inner.scrollTop = 0; f.flush(); assert.equal(f.inner.scrollTop, 640);
  f.inner.isConnected = false; f.inner.scrollTop = 0; f.flush(); assert.equal(f.inner.scrollTop, 0);
  await f.item.setValue(5); f.view.dispose(); f.flush(); assert.equal(f.jobs.size, 0); assert.equal(f.events.size, 0);
});

test("getter metadata and action return values remain intact without a DOM", async () => {
  const view = createSettingsControlView(null, {}), panel = { title: "Settings", groups: [{ title: "Game", items: [{ type: "action", label: "Reset", onClick: () => 42 }, { type: "number", label: "Value", min: 1, getValue: () => 2, setValue: () => false }] }] };
  const result = view.wrapPanel(panel);
  assert.equal(result.title, panel.title); assert.equal(result.groups[0].items[1].getValue(), 2); assert.equal(result.groups[0].items[1].min, 1);
  assert.equal(await result.groups[0].items[0].onClick(), 42); assert.equal(await result.groups[0].items[1].setValue(11), false);
  assert.notEqual(result, panel); view.dispose();
});
