export function createSettingsControlView(doc = globalThis.document, frame = globalThis) {
  let disposed = false, revision = 0, inFlight = 0;
  const pending = new Set();
  let submenuStyle, submenuObserver;
  const submenuRows = new Set();
  const submenuLabels = new Set(["Автоподбор прочего дропа", "Автоподбор солнца", "Автоподбор листиков подкормки"]);
  function decorateSubmenu() {
    if (disposed || !doc?.querySelectorAll) return;
    for(const row of submenuRows)if(!row.isConnected){row.removeAttribute('data-rff-auto-collect-item');submenuRows.delete(row);}
    for (const control of doc.querySelectorAll('button[aria-label]')) if (submenuLabels.has(control.getAttribute('aria-label'))) {
      const row=control.closest?.('.gp-toggle-wrap');
      if(row){row.setAttribute('data-rff-auto-collect-item', '');submenuRows.add(row);}
    }
  }
  if (doc?.head?.appendChild && frame.MutationObserver) {
    submenuStyle=doc.createElement('style');
    submenuStyle.textContent='[data-rff-auto-collect-item]{margin-left:16px;padding-left:14px;border-left:2px solid var(--gp-border,#476158)}';
    doc.head.appendChild(submenuStyle);
    submenuObserver=new frame.MutationObserver(decorateSubmenu);
    submenuObserver.observe(doc.body,{childList:true,subtree:true});
    decorateSubmenu();
  }
  const cancel = () => {
    revision++;
    for (const id of pending) frame.cancelAnimationFrame?.(id);
    pending.clear();
  };
  const interrupted = event => {
    if ((pending.size || inFlight) && event.isTrusted) cancel();
  };
  for (const type of ["wheel", "touchmove", "pointerdown"]) doc?.addEventListener?.(type, interrupted, { capture: true, passive: true });
  function snapshot(label) {
    if (!doc?.querySelectorAll) return [];
    const control = [...doc.querySelectorAll("input[aria-label], select[aria-label], button[aria-label]")].find(node => node.getAttribute("aria-label") === label);
    const result = [];
    for (let node = control?.parentElement; node; node = node.parentElement) {
      const style = frame.getComputedStyle?.(node);
      if (node === doc.scrollingElement || node.scrollTop || node.scrollLeft || /auto|scroll/.test((style?.overflowY ?? "") + (style?.overflowX ?? ""))) result.push({ node, top: node.scrollTop, left: node.scrollLeft });
    }
    return result;
  }
  function restore(saved, current) {
    if (disposed || revision !== current) return;
    for (const { node, top, left } of saved) if (node.isConnected) { node.scrollTop = top; node.scrollLeft = left; }
  }
  function schedule(saved, current) {
    if (disposed || !saved.length) return;
    if (!frame.requestAnimationFrame) { frame.queueMicrotask?.(() => restore(saved, current)); return; }
    const next = again => {
      const id = frame.requestAnimationFrame(() => {
        pending.delete(id); restore(saved, current);
        if (again && !disposed && revision === current) next(false);
      });
      pending.add(id);
    };
    next(true);
  }
  function wrap(item, name) {
    const action = item[name];
    if (typeof action !== "function") return action;
    return async function(...args) {
      cancel(); const current = revision;
      const saved = snapshot(item.label ?? item.key);
      inFlight++;
      try { return await action.apply(this, args); }
      finally { inFlight--; if (revision === current) schedule(saved, current); }
    };
  }
  return {
    wrapPanel(panel) {
      return { ...panel, groups: panel.groups.map(group => ({ ...group, items: group.items.map(item => ({ ...item, ...(item.setValue ? { setValue: wrap(item, "setValue") } : {}), ...(item.onClick ? { onClick: wrap(item, "onClick") } : {}) })) })) };
    },
    dispose() {
      if (disposed) return; disposed = true; cancel();
      submenuObserver?.disconnect();submenuStyle?.remove();
      for(const row of submenuRows)row.removeAttribute('data-rff-auto-collect-item');
      submenuRows.clear();
      for (const type of ["wheel", "touchmove", "pointerdown"]) doc?.removeEventListener?.(type, interrupted, true);
    }
  };
}
