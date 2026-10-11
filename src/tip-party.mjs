export function createTipPartyController(cc) {
  const hidden = new Map();
  let disposed = false;
  const valid = node => !!node && node.isValid !== false;
  function visible(node) {
    if (!valid(node)) return false;
    for (let current = node; current; current = current.parent) {
      if (current.active === false || current.activeInHierarchy === false) return false;
      const opacity = current.getComponent?.(cc.UIOpacity);
      if (opacity?.enabled !== false && opacity?.opacity === 0) return false;
    }
    return true;
  }
  function restore(root, state) {
    if (valid(root)) {
      for (const [child, sibling] of state.children) {
        if (!valid(child) || child.parent !== state.wrapper) continue;
        child.parent = root;
        child.setSiblingIndex?.(sibling);
      }
    }
    if (valid(state.wrapper)) { state.wrapper.removeFromParent(); state.wrapper.destroy(); }
    hidden.delete(root);
  }
  function hide(root) {
    let state = hidden.get(root);
    if (!state) {
      const wrapper = new cc.Node("RussianTipHiddenParty");
      wrapper.layer = root.layer;
      wrapper.active = false;
      wrapper.parent = root;
      const size = root.getComponent?.(cc.UITransform);
      if (size) {
        const ui = wrapper.addComponent(cc.UITransform);
        ui.setContentSize(size.width, size.height);
        ui.setAnchorPoint(size.anchorPoint.x, size.anchorPoint.y);
      }
      state = { wrapper, children: new Map() };
      hidden.set(root, state);
    }
    const children = [...(root.children ?? [])].map(child => [child, child.getSiblingIndex?.() ?? state.children.size]);
    for (const [child, sibling] of children) {
      if (child === state.wrapper) continue;
      state.children.set(child, sibling);
      child.parent = state.wrapper;
    }
  }
  return {
    scan() {
      if (disposed) return;
      const scene = cc.director.getScene(), nodes = [];
      const walk = node => { if (!valid(node)) return; nodes.push(node); for (const child of node.children ?? []) walk(child); };
      walk(scene);
      const parties = new Set(nodes.filter(node => node.name === "LODEntrance"));
      const showing = nodes.some(node => (node.name === "GamingTips" || node.name === "LoaderFlower") && visible(node) &&
        (node.children ?? []).some(child => visible(child) && !child.__rffOwnedFont && String(child.getComponent?.(cc.Label)?.string ?? "").trim()));
      for (const [root, state] of hidden) if (!showing || !parties.has(root) || !valid(root)) restore(root, state);
      if (showing) for (const root of parties) if (visible(root)) hide(root);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [root, state] of hidden) restore(root, state);
    }
  };
}
