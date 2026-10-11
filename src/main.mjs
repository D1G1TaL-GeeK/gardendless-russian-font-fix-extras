import {createPaidController,readPowerPreferences,DEFAULT_PRICES} from "./paid-powerups.mjs";
import {createFontPreview} from "./font-preview.mjs";
import {createUiController} from "./layout-ui.mjs";
import {createPlanningController} from "./planning-boost.mjs";
import {createSpeedController,createSpeedControlView} from "./game-speed.mjs";
import {createSettingsControlView} from "./settings-view.mjs";
import {createTipPartyController} from "./tip-party.mjs";
import {createAutoCollectController} from "./auto-collect.mjs";
import {FONT_SLOTS,readFontSlots,setFontSlot,resetFontSlots,fontSlotChoice,fontSlotFamily,originalFontSlot,fontOpticalFactor} from "./font-slots.mjs";
import {authoredLines,balancedLines} from "./text-fit.mjs";
const VERSION = "1.0.3";
const RUSSIAN = /[\u0401\u0410-\u044f\u0451]/;
const CLASSIC_FAMILY = { bold: "GardendlessRussianBalsamiqBold", regular: "GardendlessRussianBalsamiqRegular" };
export const FONT_OPTIONS = [
 {value:"classic",label:"Balsamiq Sans",family:CLASSIC_FAMILY.bold,file:"BalsamiqSans-Bold.ttf"},
 {value:"bubbles",label:"Rubik Bubbles",family:"GardendlessRussianRubikBubbles",file:"RubikBubbles-Regular.ttf"},
 {value:"ruslan",label:"Ruslan Display",family:"GardendlessRussianRuslan",file:"RuslanDisplay-Regular.ttf"},
 ...[["shantell","Shantell Sans Bold","ShantellSans-Bold.ttf"],["pangolin","Pangolin","Pangolin-Regular.ttf"],["underdog","Underdog","Underdog-Regular.ttf"],["neucha","Neucha","Neucha.ttf"],["lobster","Lobster","Lobster-Regular.ttf"],["caveat","Caveat Bold","Caveat-Bold.ttf"],["seymour","Seymour One","SeymourOne-Regular.ttf"],["nunito","Nunito ExtraBold","Nunito-ExtraBold.ttf"],["rubik","Rubik SemiBold","Rubik-SemiBold.ttf"],["comfortaa","Comfortaa Bold","Comfortaa-Bold.ttf"],["ptsanscaption","PT Sans Caption Bold","PTSansCaption-Bold.ttf"],["marmelad","Marmelad","Marmelad-Regular.ttf"]].map(([value,label,file])=>({value,label,file,family:"GardendlessRussian"+value}))
];
const STARTUP_LANGUAGE_KEY = "local.gardendless.russian-font-fix.startup-language.v1";
export function readStartupLanguage(storage) {
  try { return (storage ?? globalThis.localStorage)?.getItem(STARTUP_LANGUAGE_KEY) === "en" ? "en" : "ru"; }
  catch (_) { return "ru"; }
}
const styleTheme = fontSlotChoice;
const fontFor = (resources,style) => fontSlotFamily(resources,style,FONT_OPTIONS);
const STYLE_KEYS = ["font", "useSystemFont", "fontFamily", "fontSize", "lineHeight", "spacingX", "isBold", "enableWrapText", "overflow", "cacheMode", "verticalAlign", "outlineWidth"];
const SIZE_RATIO = 0.68;
const PREFERENCE_KEY = "local.gardendless.russian-font-fix.size-percent.v1";
const LINE_RATIO = 1.17;
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const positive = (value, fallback = 1) => Math.max(0.001, Math.abs(number(value, fallback)));

function savedPercent() {
  try {
    const value = Number(globalThis.localStorage?.getItem(PREFERENCE_KEY));
    if (Number.isFinite(value) && value >= 50 && value <= 80) return Math.round(value);
  } catch (_) {}
  return SIZE_RATIO * 100;
}

function component(node, cc, name) {
  if (!node?.getComponent) return null;
  for (const type of [cc[name], `cc.${name}`]) {
    if (!type) continue;
    try { const result = node.getComponent(type); if (result) return result; } catch (_) {}
  }
  return null;
}

function transform(node, cc) { return component(node, cc, "UITransform"); }
function anchor(node, cc) { return number(transform(node, cc)?.anchorPoint?.x, 0.5); }
function scale(node) { const v = node.worldScale ?? node.scale; return { x: positive(v?.x), y: positive(v?.y) }; }
function point(node) { const v = node.worldPosition ?? node.position; return { x: number(v?.x), y: number(v?.y) }; }

function box(node, cc) {
  const ui = transform(node, cc);
  if (!ui) return null;
  const s = scale(node), p = point(node);
  const w = positive(ui.width ?? ui.contentSize?.width, 0), h = positive(ui.height ?? ui.contentSize?.height, 0);
  const ax = number(ui.anchorPoint?.x, 0.5), ay = number(ui.anchorPoint?.y, 0.5);
  return { left: p.x - w * s.x * ax, right: p.x + w * s.x * (1 - ax), bottom: p.y - h * s.y * ay, top: p.y + h * s.y * (1 - ay), width: w * s.x, height: h * s.y };
}

function descendants(node, ancestor) {
  for (let current = node; current; current = current.parent) if (current === ancestor) return true;
  return false;
}

function labelList(scene, cc) {
  for (const type of [cc.Label, "cc.Label"]) {
    if (!type) continue;
    try { return scene?.getComponentsInChildren?.(type) ?? []; } catch (_) {}
  }
  return [];
}

function measurer(resources) {
  let canvas;
  try { canvas = globalThis.document?.createElement?.("canvas")?.getContext?.("2d"); } catch (_) {}
  const cache = new Map();
  return (text, style) => {
    const key = `${fontFor(resources,style)}:${text}`;
    if (cache.has(key)) return cache.get(key);
    let width = 0;
    if (canvas) {
      canvas.font = `100px "${fontFor(resources,style)}"`;
      width = canvas.measureText(text).width / 100;
    }
    if (!(width > 0)) {
      const theme = styleTheme(resources,style);
      const m = resources.custom ? resources.metrics?.[theme === "classic" ? "bold" : theme] : null;
      width = [...text].reduce((sum, c) => sum + (m ? number(m.widths[c], 700) / m.unitsPerEm : 0.68), 0);
    }
    if (cache.size >= 2048) cache.clear();
    cache.set(key, width);
    return width;
  };
}

function wrapWords(text, width, fontSize, measure, style) {
  const lines = [];
  for (const paragraph of text.trim().split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next, style) * fontSize > width) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function russianTime(text) {
  return text.replace(/(\d+)\s*d\b/gi,"$1 д.").replace(/(\d+)\s*h\b/gi,"$1 ч.")
    .replace(/(\d+)\s*m\b/gi,"$1 мин.").replace(/(\d+)\s*s\b/gi,"$1 с.");
}


export function createController(cc, resources, log = {}) {
  const states = new Map(), controls = new Map(), richStates = new Map(), almanacLayouts = new Map(), timerNodes = new Map(), tipNodes=new Map(), measure = measurer(resources);
  let disposed = false, warned = false, affected = 0;
  const ancestor = (node, pattern) => { for (let n=node;n;n=n.parent) if(pattern.test(n.name ?? "")) return n; return null; };

  function almanacPage(node) {
    let page = null;
    for (let n = node; n; n = n.parent) {
      if (/^(PlantPage|ZombiePage)$/.test(n.name ?? "")) page = n;
      if (n.name === "Almanac") return page;
    }
    return null;
  }

  function almanacRole(label) {
    if (!almanacPage(label.node)) return null;
    if (/^(PlantAlmanacElement|ZombieAlmanacElement)$/.test(label.node.parent?.name ?? "")) {
      if (label.node.name === "NAME") return "almanac-stat-name";
      if (label.node.name === "VALUE") return "almanac-stat-value";
    }
    if (label.node.parent?.name === "texts" && /^(introduction|chat)$/.test(label.node.name ?? "")) return "almanac-prose";
    return null;
  }

  function richOwner(node) {
    for (let n = node.parent; n; n = n.parent) {
      const rich = component(n, cc, "RichText");
      if (rich) return rich;
    }
    return null;
  }

  function almanacPlan(label, state) {
    const role = almanacRole(label);
    if (!role) return null;
    const prose = role === "almanac-prose", value = role === "almanac-stat-value";
    const nativeNumeric = value && !RUSSIAN.test(state.source);
    const style = styleFor(label,state);
    const card = label.node.parent;
    const family = value && /^семейство(?:\s|$)/iu.test(sourceOf(component(card.children?.find(n=>n.name === "NAME"),cc,"Label")));


    const familyWidth = (number(transform(card,cc)?.width,800) * 0.28 - number(label.node.position?.x) - 12) / positive(label.node.scale?.x);
    const source = family ? state.source.trim().replace(/^Семейство\s+/iu,"") : state.source.trim();
    const width = family ? Math.min(state.own.width,familyWidth) : state.own.width, available = Math.max(1, width - 16);
    let size = Math.floor(nativeNumeric ? number(state.original.fontSize,94.5)*number(resources.percent,68)/100 : baseSize(label, state));


    if (!prose && !nativeNumeric) size = Math.min(size, Math.max(1, Math.floor(available / Math.max(1, measure(source, style) * 1.04))));
    const lineHeight = Math.round(size * LINE_RATIO * 10) / 10;
    const lines = prose ? wrapWords(source,available / 1.04,size,measure,style) : [source];
    const geometry = prose ? { width, height: source ? null : 0 } : { width, height: Math.min(state.own.height, value ? 88 : 125) };
    return { fontFamily: nativeNumeric ? state.original.fontFamily : (fontFor(resources,style)), useSystemFont: nativeNumeric ? state.original.useSystemFont : true,
      ...(nativeNumeric ? { font: state.original.font } : {}), fontSize: size, lineHeight, spacingX: 0, isBold: false, enableWrapText: false, overflow: prose ? 3 : 1,
      verticalAlign: prose ? 0 : 1, cacheMode: 0, string: lines.join("\n"), bounds: { width, height: prose ? Infinity : geometry.height, maxSize: Infinity, multiline: prose, fixed: true, role, family }, geometry, style, lines };
  }

  function medalPlan(label,state) {
    if (label.node.name !== "Title" || label.node.parent?.name !== "PlantMedalIcon") return null;
    const width = state.own.width, height = state.own.height, source = state.source.trim();
    const usable = Math.max(1,width - (label.enableOutline ? number(label.outlineWidth,2)*2 : 0) - 8);
    let size = Math.floor(baseSize(label,state));
    const longest = Math.max(1,...source.split(/\s+/).map(word=>measure(word,styleFor(label,state))));
    size = Math.min(size,Math.floor(usable / (longest*1.04)));
    while (size > 1) {
      const lines = wrapWords(source,usable/1.04,size,measure,styleFor(label,state));
      const fitsHeight = (lines.length - 1) * size * LINE_RATIO + size * 1.35 <= height - 4;
      if (fitsHeight && (lines.length <= 2 || size <= 22)) break;
      size--;
    }
    const lines = wrapWords(source,usable/1.04,size,measure,styleFor(label,state));
    return { fontFamily: fontFor(resources,styleFor(label,state)), useSystemFont: true, fontSize: size, lineHeight: Math.round(size*LINE_RATIO*10)/10,
      spacingX: 0, isBold: false, enableWrapText: false, overflow: 1, verticalAlign: 1, cacheMode: 0, string: lines.join("\n"),
      bounds: { width, height, maxSize: Infinity, multiline: true, fixed: true, role: "medal-title" }, geometry: { width,height }, style:styleFor(label,state), lines };
  }

  function reflowAlmanac(nodes, pages = new Set()) {
    const layouts = new Set();
    const restoreLayout = (layout, saved) => {
      if (layout.isValid !== false && layout.node?.isValid !== false) {
        layout.paddingTop = saved.paddingTop; layout.paddingBottom = saved.paddingBottom; layout.spacingY = saved.spacingY;
        layouts.add(layout);
      }
    };
    for (const [layout, saved] of almanacLayouts) if (!pages.has(almanacPage(layout.node))) {
      restoreLayout(layout, saved); almanacLayouts.delete(layout);
    }
    for (const page of pages) {
      const visit = node => {
        if (ancestor(node, /^Introduction$/) && /^(texts|content|elements)$/.test(node.name)) {
          const layout = component(node, cc, "Layout");
          if (layout?.enabled) {
            layouts.add(layout);
            if (node.name !== "elements") {
              let saved = almanacLayouts.get(layout);
              if (!saved) { saved = { paddingTop: layout.paddingTop, paddingBottom: layout.paddingBottom, spacingY: layout.spacingY }; almanacLayouts.set(layout, saved); }
              if (node.name === "texts") { layout.paddingTop = saved.paddingTop + 32; layout.spacingY = saved.spacingY + 22; }
              else layout.paddingBottom = saved.paddingBottom + 20;
            }
          }
        }
        for (const child of node.children ?? []) visit(child);
      };
      visit(page);
    }
    for (const node of nodes) for (let n = node.parent; n && almanacPage(n); n = n.parent) {
      if (/^(texts|content|elements)$/.test(n.name)) {
        const layout = component(n, cc, "Layout");
        if (layout?.enabled) layouts.add(layout);
      }
    }
    const depth = node => { let d = 0; for (let n = node; n; n = n.parent) d++; return d; };
    for (const layout of [...layouts].sort((a,b) => depth(b.node) - depth(a.node))) layout.updateLayout?.(true);
  }

  function scanRichTexts(scene, russianPages) {
    let rich = [];
    for (const type of [cc.RichText, "cc.RichText"]) {
      if (!type) continue;
      try { rich = scene?.getComponentsInChildren?.(type) ?? []; break; } catch (_) {}
    }
    const present = new Set(rich), changed = [];
    for (const [owner, state] of richStates) if (!present.has(owner) || !(RUSSIAN.test(owner.string === state.applied?.string ? state.source : String(owner.string ?? "")) || adviceContext(owner.node))) {
      restoreRich(owner,state); richStates.delete(owner);
    }
    for (const owner of rich) {
      if (!RUSSIAN.test(String(owner.string ?? "")) && !adviceContext(owner.node)) continue;
      let state = richStates.get(owner);
      if (!state) {
        const keys = ["font", "useSystemFont", "fontFamily", "fontSize", "lineHeight", "maxWidth", "string"];
        state = { original: Object.fromEntries(keys.map(k=>[k,owner[k]])), source: String(owner.string ?? ""), applied: null };
        richStates.set(owner,state);
      } else if (owner.string !== state.applied?.string) state.source = String(owner.string ?? "");
      if(owner.font && owner.font!==state.original.font)state.original.font=owner.font;
      const style = originalFontSlot(state.original.font,owner.node,state.original.fontFamily);
      const size = Math.floor(number(state.original.fontSize,60) * number(resources.percent,68) / 100 * opticalFactor(style));
      const desired = { useSystemFont: true, fontFamily: fontFor(resources,style), fontSize: size, lineHeight: Math.round(size * LINE_RATIO * 10)/10,
        maxWidth: almanacPage(owner.node) ? number(transform(owner.node.parent,cc)?.width, number(state.original.maxWidth,1790)) : number(state.original.maxWidth) || number(transform(owner.node,cc)?.width,800), string: state.source.trim() };
      let dirty = false;
      for (const key of Object.keys(desired)) if (owner[key] !== desired[key]) { owner[key] = desired[key]; dirty = true; }
      state.applied = desired;
      if (dirty) changed.push(owner.node);
    }
    return changed;
  }

  function restoreRich(owner, state) {
    if (owner.isValid === false || owner.node?.isValid === false) return;
    const source = owner.string === state.applied?.string ? state.source : owner.string;
    for (const [key,value] of Object.entries(state.original)) if (key !== "string" && owner[key] !== value) owner[key] = value;
    owner.string = source;
  }

  function capture(label) {
    let state = states.get(label);
    if (!state) {
      const ui = transform(label.node, cc);
      state = { source: String(label.string ?? ""), original: Object.fromEntries(STYLE_KEYS.map(k => [k, label[k]])), own: { width: number(ui?.width ?? ui?.contentSize?.width), height: number(ui?.height ?? ui?.contentSize?.height) }, position: { x: number(label.node.position?.x), y: number(label.node.position?.y), z: number(label.node.position?.z) }, applied: null };


      if (FONT_OPTIONS.some(option => option.family === label.fontFamily) || label.fontFamily === CLASSIC_FAMILY.regular || almanacRole(label)?.startsWith("almanac-stat")) {
        const templates = [...states.entries()].filter(([source,s]) => source.node.name === label.node.name && roleFor(source) === roleFor(label) && s.applied?.fontFamily === label.fontFamily && s.applied?.fontSize === label.fontSize && s.applied?.lineHeight === label.lineHeight);
        if (templates.length && templates.every(([,s])=>s.original.fontSize === templates[0][1].original.fontSize)) {
          state.original = { ...templates[0][1].original };
          state.own = { ...templates[0][1].own };
        }
      }
      states.set(label, state);
    } else if (state.applied) {
      if (label.font && label.font !== state.original.font) state.original.font=label.font;
      if (label.string !== state.applied.string) state.source = String(label.string ?? "");
      for (const key of ["fontSize", "lineHeight"]) {
        if (label[key] !== state.applied[key]) state.original[key] = label[key];
      }
    }
    return state;
  }

  function tipIllustration(root){
    const group=root.getChildByName?.('BGT'),pictures=(group?.children??[]).filter(n=>n.name!=='BG'&&n.active!==false);
    return {group,pictures,width:pictures.length?120:0,height:pictures.length?112:0};
  }
  function rememberTip(node){
    if(!tipNodes.has(node)){const ui=transform(node,cc),w=component(node,cc,'Widget'),l=component(node,cc,'Layout');tipNodes.set(node,{size:ui?[ui.width,ui.height]:null,p:{...node.position},s:node.scale.clone(),parent:node.parent,sibling:node.getSiblingIndex?.(),w,we:w?.enabled,l,le:l?.enabled});}
    const snap=tipNodes.get(node);if(snap.l)snap.l.enabled=false;if(snap.w)snap.w.enabled=false;return snap;
  }
  function prepareTipRoot(root){
    const saved=rememberTip(root);let canvas=null,masked=false;
    for(let n=root.parent;n;n=n.parent){if(component(n,cc,'Canvas')||n.name==='Canvas'){canvas=n;break;}if(component(n,cc,'Mask'))masked=true;}


    if(canvas&&masked){const p=root.worldPosition.clone(),s=root.worldScale.clone(),cs=canvas.worldScale;root.parent=canvas;root.setWorldPosition(p);root.setScale(s.x/positive(cs.x),s.y/positive(cs.y),s.z/positive(cs.z));saved.reparented=true;}
    if(canvas&&root.parent===canvas&&root.activeInHierarchy!==false&&root.getSiblingIndex()<canvas.children.length-1){root.setSiblingIndex(canvas.children.length-1);saved.reordered=true;}
  }
  function layoutTip(label,state,desired,scene){
    const root=label.node.parent,info=tipIllustration(root),bg=info.group?.getChildByName?.('BG'),target=state.tipTarget.node,rs=scale(root),screen=screenBox(root);
    for(const node of [root,label.node,info.group,bg].filter(Boolean))rememberTip(node);
    const textWidth=desired.geometry.width*positive(target.scale.x),textHeight=desired.geometry.height*positive(target.scale.y),height=Math.max(textHeight,info.height)+24,width=textWidth+info.width+32;
    transform(root,cc)?.setContentSize(width,height);target.setPosition(info.width/2,0,number(label.node.position.z));
    if(info.group){info.group.setPosition(0,0,number(info.group.position.z));transform(info.group,cc)?.setContentSize(width,height);}
    if(bg){transform(bg,cc)?.setContentSize(width,height);bg.setPosition(0,0,number(bg.position.z));}
    for(const picture of info.pictures){const saved=rememberTip(picture),u=transform(picture,cc),factor=Math.min(1,100/(positive(u?.width,100)*positive(saved.s.x)),100/(positive(u?.height,100)*positive(saved.s.y)));picture.setScale(saved.s.x*factor,saved.s.y*factor,saved.s.z);picture.setPosition(-width/2+info.width/2+16,0,saved.p.z);}
    if(screen){
      const nodes=[];const visit=n=>{nodes.push(n);for(const c of n.children??[])visit(c);};visit(scene);
      const obstacles=nodes.filter(n=>n.activeInHierarchy!==false&&(n.name==='LODEntrance'||component(n,cc,'Button'))).map(n=>box(n,cc)).filter(b=>b&&b.width<screen.width*.4&&b.height<screen.height*.25);
      const bottom=Math.max(screen.bottom+16,...obstacles.filter(b=>b.bottom<screen.bottom+screen.height*.35).map(b=>b.top+14));
      const y=Math.min(screen.top-12-height*rs.y/2,bottom+height*rs.y/2);root.setWorldPosition((screen.left+screen.right)/2,y,root.worldPosition.z);
    }
  }
  function releaseTipRaster(state){
    if(!state.tipRaster)return;
    const {frame,texture,image}=state.tipRaster;
    if(state.tipSprite&&state.tipSprite.isValid!==false)state.tipSprite.spriteFrame=null;
    frame?.destroy?.();texture?.destroy?.();image?.destroy?.();state.tipRaster=null;
  }
  function rasterTip(label,state,desired){



    if(!globalThis.document||!cc.ImageAsset||!cc.Texture2D||!cc.SpriteFrame)return;
    const target=state.tipTarget,color=target.color;
    const key=JSON.stringify([desired.fontFamily,desired.fontSize,desired.lineHeight,desired.string,desired.geometry,color.r,color.g,color.b,color.a,resources.percent,globalThis.devicePixelRatio]);
    if(state.tipRaster?.key===key)return;
    const {width,height}=desired.geometry;
    const density=Math.max(.1,Math.min(number(globalThis.devicePixelRatio,1)*2,2040/width,2040/height));
    const surface=globalThis.document.createElement('canvas');surface.width=Math.ceil(width*density);surface.height=Math.ceil(height*density);
    const ctx=surface.getContext('2d');ctx.scale(density,density);ctx.font=`${desired.fontSize}px "${desired.fontFamily}"`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.lineJoin='round';
    const ink=inkBounds(desired.lines,desired.style,desired.fontSize),outline=label.enableOutline?number(label.outlineWidth,2):0;
    const occupied=ink.ascent+ink.descent+(desired.lines.length-1)*desired.lineHeight;
    const first=Math.max(ink.ascent+outline+8,(height-occupied)/2+ink.ascent);
    for(let i=0;i<desired.lines.length;i++){
      const y=first+i*desired.lineHeight;
      if(outline){const c=target.outlineColor;ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},${c.a/255})`;ctx.lineWidth=outline*2;ctx.strokeText(desired.lines[i],width/2,y);}
      ctx.fillStyle=`rgba(${color.r},${color.g},${color.b},${color.a/255})`;ctx.fillText(desired.lines[i],width/2,y);
    }
    if(!state.tipSprite){const n=new cc.Node('RussianTipRaster');n.parent=target.node;n.layer=target.node.layer;n.addComponent(cc.UITransform);state.tipSprite=n.addComponent(cc.Sprite);state.tipSprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;}
    releaseTipRaster(state);
    const image=new cc.ImageAsset(surface),texture=new cc.Texture2D();texture.image=image;const frame=new cc.SpriteFrame();frame.texture=texture;
    state.tipSprite.spriteFrame=frame;transform(state.tipSprite.node,cc).setContentSize(width,height);
    state.tipRaster={key,frame,texture,image,surface};target.enabled=false;
  }
  function restore(label, state) {
    releaseTipRaster(state);
    if(state.counterPill){const saved=tipNodes.get(state.counterPill);if(saved?.size&&state.counterPill.isValid!==false)transform(state.counterPill,cc)?.setContentSize(...saved.size);tipNodes.delete(state.counterPill);state.counterPill=null;}
    if(state.tipTarget){state.tipTarget.node?.destroy?.();state.tipTarget=null;if(label.isValid!==false&&label.node)label.enabled=state.tipEnabled;}
    if (label.isValid === false || !label.node || label.node.isValid === false) return;
    const current = String(label.string ?? "");
    for (const key of STYLE_KEYS) if (label[key] !== state.original[key]) label[key] = state.original[key];
    if (state.applied && current === state.applied.string && current !== state.source) label.string = state.source;
    const ui = transform(label.node, cc);
    if (state.resized && ui?.setContentSize) ui.setContentSize(state.own.width, state.own.height);
    if (state.moved && label.node.setPosition) label.node.setPosition(state.position.x, state.position.y, state.position.z);
  }

  function roleFor(label) {
    if(label.node.name === 'label' && label.node.parent?.name === 'mission' && ancestor(label.node,/^(LevelObjectiveScreen|PauseScreen)$/))return 'objective-prose';
    if (label.node.name === "Title" && label.node.parent?.name === "PlantMedalIcon") return "medal-title";
    const almanac = almanacRole(label);
    if (almanac) return almanac;
    const name = label.node.name ?? "";
    if(name === "Description" && ancestor(label.node,/^(ExitSure|RestartSure)$/) && ancestor(label.node,/^PauseScreen$/))return "pause-confirm";
    if(name === "Title" && label.node.parent?.name === "windowCommonBorder") return "window-title";
    if(ancestor(label.node,/^(?:LevelTaskCount|LevelTaskDisplayer)(?:\d+)?$/i)) return "task-count";
    if (name === "GameLoseTip") return "lose-tip";
    if (name === "GamingWarn" || ancestor(label.node,/^GamingWarn$/)) return "warning";
    if (name === "Label" && label.node.parent?.name === "GamingTips") return "game-tip";
    if (name === "Label" && label.node.parent?.name === "LoaderFlower") return "loading-tip";
    if (name === "ToolTip" && label.node.parent?.name === "LocalLevelNode" && ancestor(label.node,/^FanmadeLevelWindow$/)) return "fanmade-local";
    if ((ancestor(label.node,/^TicketCount$/) && label.node.parent?.name === "TicketCountDown") || /^истекает\s+через/iu.test(sourceOf(label).trim())) return "ticket-expiry";
    if (label.node.name === "Description" && ancestor(label.node,/^LODEntrance$/) && /^до\s+следующего\s*:/iu.test(sourceOf(label).trim())) return "pinata-countdown";
    if (name === "label" && ancestor(label.node,/^NPC_Controller$/)) return "dialog";
    if (name === "PlantName" && ancestor(label.node,/^RewardDisplayer$/)) return "reward-heading";
    if (/^(количество растений|длина кода)$/iu.test(sourceOf(label).trim())) return "arcade-caption";
    if (/^дополнительные мини-игры[!?.]*$/iu.test(sourceOf(label).trim())) return "arcade-heading";
    if (ancestor(label.node,/^ArcadeWindow$/)) {
      if (/^(количество растений|длина кода)\b/iu.test(sourceOf(label).trim())) return "arcade-caption";
      if (/^Title$/i.test(name)) return "arcade-heading";
      if (/ToolTip|base.*title|code.*title/i.test(name)) return "arcade-caption";
    }
    if (/worldname/i.test(name)) return "world";
    if (/levelname/i.test(name)) return "level";
    if (/leveldescription/i.test(name)) return "intro";
    for (let n = label.node.parent, depth = 0; n && depth < 6; n = n.parent, depth++) {
      if (/WorldmapChooser/i.test(n.name ?? "") && name === "name") return "world";
    }
    return "normal";
  }




  function stableControl(label) {
    const node = label.node.parent, layout = component(node, cc, "Layout");
    if (!node || !component(node, cc, "Button") || number(layout?.resizeMode) !== 1) return controls.get(node) ?? null;
    let control = controls.get(node);
    if (!control) {
      const ui = transform(node, cc);
      if (!ui) return null;
      const presets = { playbutton: [205.833557,108.156], gamestartbutton: [313.2878,116], boostbutton: [315.15765,94.1] };
      presets.laststandstartbutton = presets.gamestartbutton;


      const target = ancestor(node,/^AlmanacUpgradeDisplayer$/) && node.name === "PlayButton"
        ? [491.092224,171.8]
        : presets[String(node.name).toLowerCase().replace(/_/g,"")] ?? [number(ui.width),number(ui.height)];
      const horizontal = number(layout.type) === 1;
      control = { node, layout, enabled: layout.enabled, resizeMode: layout.resizeMode, original: [number(ui.width),number(ui.height)], width: target[0], height: target[1], horizontal };
      if (ancestor(node,/^AlmanacUpgradeDisplayer$/) && node.name === "PlayButton") {
        control.position = node.position.clone?.() ?? {...node.position};
        const frame = box(node.parent,cc), ps = scale(node.parent), ns = scale(node), anchorY = number(ui.anchorPoint?.y,.5);
        if (frame) node.setPosition(number(node.position.x), Math.max(control.position.y, (frame.bottom + 26*ps.y + control.height*ns.y*anchorY - point(node.parent).y)/ps.y), number(node.position.z));
      }
      if (horizontal) {
        const siblings = (node.children ?? []).filter(other => other !== label.node && other.active !== false);
        control.captionWidth = control.width - number(layout.paddingLeft) - number(layout.paddingRight) - siblings.length * number(layout.spacingX) - siblings.reduce((sum,other) => sum + number(transform(other,cc)?.width) * positive(other.scale?.x),0);


        for (const sibling of siblings) {
          const other = component(sibling,cc,"Label");
          if (other && !RUSSIAN.test(String(other.string))) other.updateRenderData?.(true);
        }
      }
      controls.set(node, control);
      if (horizontal) layout.resizeMode = 0;
      else layout.enabled = false;
      ui.setContentSize?.(control.width, control.height);
    }
    return control;
  }

  function releaseControls(present) {
    for (const [node, control] of controls) {
      if (present && [...states.keys()].some(label => label.node.parent === node && present.has(label))) continue;
      if (node.isValid !== false) {
        transform(node, cc)?.setContentSize?.(...control.original);
        if (control.position) node.setPosition?.(control.position);
        if (control.layout.isValid !== false) { control.layout.resizeMode = control.resizeMode; control.layout.enabled = control.enabled; }
      }
      controls.delete(node);
    }
  }

  function adviceContext(node) {
    if(ancestor(node,/^NPC_Controller$/i))return false;


    if(ancestor(node,/^SettingWindow$/i)&&/^(?:ToolTip|KeyTip|RestartTip)$/i.test(node?.name??""))return true;
    if(ancestor(node,/^KeyTips?$/i))return false;
    return !!ancestor(node,/tip|hint|help|instruction|howtoplay|guide|^InfoWindow$/i);
  }
  function styleFor(label,state) {
    return originalFontSlot(state?.original.font ?? label.font,label.node,state?.original.fontFamily ?? label.fontFamily);
  }

  function opticalFactor(style) { return fontOpticalFactor(resources,style); }
  function baseSize(label, state) { return Math.max(1, number(state?.original.fontSize ?? label.fontSize, 40) * number(resources.percent, SIZE_RATIO * 100) / 100 * opticalFactor(styleFor(label,state))); }
  function sourceOf(label) { const s = states.get(label); return s && label?.string === s.applied?.string ? s.source : String(label?.string ?? ""); }
  function idealWidth(label) {
    const state = states.get(label);
    if (!RUSSIAN.test(sourceOf(label)) && !adviceContext(label.node)) return box(label.node, cc)?.width ?? 0;
    const style = styleFor(label,state);
    return Math.max(...sourceOf(label).trim().split(/\r?\n/).map(t => measure(t, style))) * baseSize(label, state) * scale(label.node).x;
  }

  function screenBox(node) {
    for (let n = node; n; n = n.parent) {
      if (n.name === "Canvas" || component(n, cc, "Canvas")) {
        const b = box(n, cc), s = scale(n); if (b && b.width / s.x > 100 && b.height / s.y > 100) return b;
      }
    }
    return null;
  }

  function frameFor(label) {
    const p = point(label.node);
    for (let n = label.node.parent, depth = 0; n && depth < 9; n = n.parent, depth++) {
      const b = box(n, cc), ns = scale(n);
      if (!b || b.width / ns.x < 30 || b.height / ns.y < 15 || p.x < b.left - ns.x || p.x > b.right + ns.x || p.y < b.bottom - ns.y || p.y > b.top + ns.y) continue;
      const button = component(n, cc, "Button");
      const visual = button || component(n, cc, "Sprite") || component(n, cc, "Slider");

      if (visual || (b.width / ns.x >= 180 && b.height / ns.y >= 90)) return { node: n, box: b, button: !!button };
    }
    return null;
  }

  function budget(label, state, labels) {
    const node = label.node, p = point(node), s = scale(node), ax = anchor(node, cc);
    const frame = frameFor(label), screen = screenBox(node);
    let width = screen ? screen.width * 0.78 / s.x : Infinity;
    let height = Infinity;
    let maxSize = screen ? screen.height * 0.075 / s.y : Infinity;
    const role = roleFor(label), control = stableControl(label);
    if (role === "world") {

      const group = labels.filter(other => roleFor(other) === "world" && other.node.parent === node.parent && RUSSIAN.test(sourceOf(other)));
      width = Math.min(width, state.own.width > 50 ? state.own.width : 640);
      const rows=Math.max(1,...group.map(other=>sourceOf(other).trim().split(/\s+/).length));
      const longest=Math.max(1,...group.flatMap(other=>sourceOf(other).trim().split(/\s+/).map(word=>measure(word,styleFor(other,states.get(other))))));
      height=Math.min(state.own.height>15?state.own.height:236,236);
      maxSize=Math.min(100,Math.floor((width-20)/(longest*1.04)),Math.floor((height-16)/(rows*1.3)));
      return {width,height,maxSize,multiline:true,fixed:true,role};
    }
    if (role === "level" || role === "intro") {


      return { width: Math.min(width,state.own.width*0.94), height: state.own.height*0.94, maxSize, multiline: false, fixed: true, role };
    }
    if (control) {
      width = control.horizontal ? control.captionWidth : control.width * 0.90;
      height = control.height * 0.90;
      return { width: Math.max(3,width), height: Math.max(3,height), maxSize: Infinity, multiline: false, fixed: true, control, role };
    }
    const title = role === "level" || role === "intro" || /title|plantname|worldname/i.test(node.name ?? "");
    const fixed = number(state.original.overflow) !== 0 && state.own.width > 10;
    if (fixed) {
      width = Math.min(width, state.own.width * 0.94);
      if (state.own.height > 8 && (!title || state.own.height >= 90)) height = state.own.height * 0.94;
    }
    if (frame) {
      const b = frame.box;
      const pad = Math.min(b.width * 0.055, 20 * s.x), gap = 18 * s.x;
      const left = b.left + pad, right = b.right - pad;
      let available = ax < 0.25 ? right - p.x : ax > 0.75 ? p.x - left : 2 * Math.min(p.x - left, right - p.x);
      height = Math.min(height, b.height * (frame.button ? 0.88 : 0.78) / s.y);
      for (const other of labels) {
        if (other === label || other.node.activeInHierarchy === false || !descendants(other.node, frame.node)) continue;
        const op = point(other.node), os = scale(other.node);

        if (Math.abs(op.y - p.y) > Math.min(baseSize(label, state) * s.y, baseSize(other, states.get(other)) * os.y) * 0.55) continue;
        const oa = anchor(other.node, cc);
        const opposite = (ax < 0.25 && oa > 0.75 && op.x > p.x) || (ax > 0.75 && oa < 0.25 && op.x < p.x);
        if (opposite) {
          const span = Math.abs(op.x - p.x) - gap;
          const mine = idealWidth(label), theirs = idealWidth(other);
          available = Math.min(available, span * mine / Math.max(1, mine + theirs));
        } else if (op.x > p.x && ax <= 0.75) {
          const edge = op.x - idealWidth(other) * oa - gap;
          available = Math.min(available, (edge - p.x) * (ax > 0.25 ? 2 : 1));
        } else if (op.x < p.x && ax >= 0.25) {
          const edge = op.x + idealWidth(other) * (1 - oa) + gap;
          available = Math.min(available, (p.x - edge) * (ax < 0.75 ? 2 : 1));
        }
      }

      for (let branch = node; branch && branch !== frame.node; branch = branch.parent) {
        for (const obstacle of branch.parent?.children ?? []) {
          if (obstacle === branch || component(obstacle, cc, "Label") || obstacle.active === false) continue;
          if (!component(obstacle, cc, "Sprite") && !component(obstacle, cc, "Slider") && !component(obstacle, cc, "Button")) continue;
          const ob = box(obstacle, cc);
          if (!ob || p.y < ob.bottom - baseSize(label, state) * s.y * 0.25 || p.y > ob.top + baseSize(label, state) * s.y * 0.25) continue;
          let extra = 0;
          if (component(obstacle, cc, "Slider")) {
            for (const child of obstacle.children ?? []) if (/handle/i.test(child.name ?? "")) extra = Math.max(extra, (box(child, cc)?.width ?? 0) * 0.5);
          }
          if (ob.left > p.x && ax <= 0.75) available = Math.min(available, (ob.left - extra - gap - p.x) * (ax > 0.25 ? 2 : 1));
          else if (ob.right < p.x && ax >= 0.25) available = Math.min(available, (p.x - ob.right - extra - gap) * (ax < 0.75 ? 2 : 1));
        }
      }
      if (available / s.x > 5) width = Math.min(width, available / s.x);
    }

    const compactTextBox = fixed && number(state.original.overflow) === 2 && state.own.width / Math.max(1, state.own.height) < 5 && /\s/.test(state.source);
    const prose = /brief|description|illustration|mission/i.test(node.name ?? "") || (fixed && state.original.enableWrapText !== false && state.source.length > 55) || compactTextBox;
    const multiline = !title && (prose || /\S[^\n]*\n[^\n]*\S/.test(state.source)) && fixed && (!frame?.button || state.original.enableWrapText !== false);
    const soloButton = frame?.button && frame.node === node.parent && ax > 0.25 && ax < 0.75 && labelList(frame.node,cc).length === 1;
    return { width: Math.max(3, width), height: Math.max(3, height), maxSize, multiline, fixed, role, soloButton };
  }

  let inkCanvas;
  function inkBounds(lines,style,size) {
    try{inkCanvas??=globalThis.document?.createElement("canvas").getContext("2d");if(inkCanvas){inkCanvas.font=`${size}px "${fontFor(resources,style)}"`;return {ascent:Math.max(...lines.map(t=>inkCanvas.measureText(t).actualBoundingBoxAscent??size)),descent:Math.max(...lines.map(t=>inkCanvas.measureText(t).actualBoundingBoxDescent??size*.3))};}}catch(_){}
    return {ascent:size,descent:size*.35};
  }
  function fitBlock(label,state,{width,height,base=baseSize(label,state),style=styleFor(label,state),role=roleFor(label),source=state.source.trim(),maxLines=2,forceWrap=false,grow=false,preserveLines=false}) {
    const outline=label.enableOutline ? Math.min(number(state.original.outlineWidth,2), role === "warning" ? 3 : Infinity) : 0;
    const usable=Math.max(1,width-outline*2-10), space=Math.max(1,height-outline*2-8);
    const natural=Math.max(...source.split(/\r?\n/).map(t=>measure(t,style)));
    const single=Math.min(base,usable/Math.max(.01,natural*1.04),space/1.35);
    const hint=["game-tip","loading-tip","advice"].includes(role),authored=authoredLines(source);
    const authoredSize=Math.min(base,usable/Math.max(.01,natural*1.04));
    const keepLines=preserveLines || (hint&&authoredSize>=base*.88&&authored.length<=maxLines);
    const multiline=keepLines || forceWrap || source.includes("\n") || (single < base*.8 && /\s/.test(source));
    const arrange=size=>keepLines?authored:multiline?(hint?balancedLines:wrapWords)(source,usable/1.04,size,measure,style):[source.replace(/\s*\r?\n\s*/g," ")];
    let size=Math.max(1,Math.floor(keepLines?authoredSize:multiline?base:single));
    let lines=arrange(size);
    if (multiline) while(size>1 && (Math.max(...lines.map(t=>measure(t,style)))*size*1.04>usable || lines.length>maxLines || (!grow && (lines.length-1)*size*LINE_RATIO+size*1.35>space))) {
      size--;lines=arrange(size);
    }
    let ink=inkBounds(lines,style,size),lineHeight=Math.max(size*LINE_RATIO,ink.ascent+ink.descent+outline*2+4);
    let tipHeight=(lines.length-1)*lineHeight+Math.max(size*1.65,ink.ascent+ink.descent)+outline*2+24;



    if(["advice","fanmade-title","arcade-confirm","arcade-reward","game-tip","loading-tip","fanmade-local","pause-confirm","dialog"].includes(role))while(size>1&&tipHeight>height){size--;lines=arrange(size);ink=inkBounds(lines,style,size);lineHeight=Math.max(size*LINE_RATIO,ink.ascent+ink.descent+outline*2+4);tipHeight=(lines.length-1)*lineHeight+Math.max(size*1.65,ink.ascent+ink.descent)+outline*2+24;}
    return {fontFamily:fontFor(resources,style),useSystemFont:true,fontSize:size,lineHeight:Math.round(lineHeight*10)/10,
      spacingX:0,isBold:false,enableWrapText:false,overflow:1,verticalAlign:1,cacheMode:0,string:lines.join("\n"),
      ...(role === "warning" ? {outlineWidth:outline} : {}),bounds:{width,height:grow?Infinity:height,maxSize:Infinity,multiline,fixed:true,role},geometry:{width,height:grow?tipHeight:height},style,lines};
  }



  function timerNode(node, present) {
    present.add(node);
    let saved = timerNodes.get(node);
    if (!saved) {
      const ui=transform(node,cc), p=node.position, s=node.scale, widget=component(node,cc,"Widget"),label=component(node,cc,"Label");
      saved={node,size:ui ? [number(ui.width),number(ui.height)] : null,
        position:[number(p?.x),number(p?.y),number(p?.z)],scale:[number(s?.x,1),number(s?.y,1),number(s?.z,1)],
        widget,right:widget?.right,sibling:node.getSiblingIndex?.(),
        label,fontSize:label?.fontSize,lineHeight:label?.lineHeight};
      timerNodes.set(node,saved);
    }
    return saved;
  }

  function restoreTimerNode(saved) {
    const {node,widget}=saved;
    if (node.isValid === false) return;
    if(saved.size) transform(node,cc)?.setContentSize?.(...saved.size);
    node.setScale?.(...saved.scale);
    node.setPosition?.(...saved.position);
    if(saved.label && saved.label.isValid !== false) {
      saved.label.fontSize=saved.fontSize;saved.label.lineHeight=saved.lineHeight;
    }
    if(widget?.isValid !== false && widget && saved.right !== undefined) {
      widget.right=saved.right;widget.updateAlignment?.();
    }
  }

  function restoreTimerOrder(saved) {
    for(const s of saved.sort((a,b)=>number(a.sibling)-number(b.sibling))) {
      if(s.node.isValid !== false && s.sibling !== undefined)s.node.setSiblingIndex?.(s.sibling);
    }
  }

  function layoutTimers(labels,scene) {
    const present=new Set();
    for(const label of labels) {
      if(!states.has(label)) continue;
      if(roleFor(label) === "pinata-countdown") {
        const title=label.node.parent?.children?.find(n=>n.name === "Title"),t=title && component(title,cc,"Label");
        if(t && !RUSSIAN.test(sourceOf(t))) {
          const saved=timerNode(title,present);
          title.setPosition?.(saved.position[0],saved.position[1]+9,saved.position[2]);
          if(saved.size)transform(title,cc)?.setContentSize?.(saved.size[0],saved.size[1]*.9);
          if(t.fontSize !== saved.fontSize*.9 || t.lineHeight !== saved.lineHeight*.9) {
            t.fontSize=saved.fontSize*.9;t.lineHeight=saved.lineHeight*.9;t.updateRenderData?.(true);
          }
        }
        continue;
      }
      if(roleFor(label) !== "ticket-expiry") continue;
      const root=ancestor(label.node,/^TicketCount$/),badge=label.node.parent;
      if(!root || badge?.name !== "TicketCountDown") continue;
      const b=timerNode(badge,present),l=timerNode(label.node,present),ui=transform(badge,cc);
      ui?.setContentSize?.(300,110);
      label.node.setScale?.(1,1,l.scale[2]);label.node.setPosition?.(0,0,l.position[2]);

      const countHeight=number(transform(root,cc)?.height,95.4), by=positive(b.scale[1]);
      badge.setPosition?.(0,-countHeight/2-8-110*by/2,b.position[2]);

    }
    const removed=[];
    for(const [node,saved] of timerNodes)if(!present.has(node)) {restoreTimerNode(saved);removed.push(saved);timerNodes.delete(node);}
    restoreTimerOrder(removed);
  }

  function specialPlan(label,state,labels) {
    const tuned=value=>value*number(resources.percent,68)/68;
    const role=roleFor(label), node=label.node, ui=transform(node.parent,cc);
    if (node.name === "description" && ancestor(node,/^AlmanacUpgradeDisplayer$/)) {
      const button = node.parent?.getChildByName?.("PlayButton"), caption = button?.getChildByName?.("Label");
      if (caption) stableControl(component(caption,cc,"Label"));
      const frame = button && box(button,cc), ns = scale(node), ps = scale(node.parent);
      const top = point(node.parent).y + state.position.y*ps.y;
      const height = frame ? Math.max(1,(top-frame.top-22*ps.y)/ns.y) : state.own.height;
      const fit = fitBlock(label,state,{width:state.own.width,height,role:"upgrade-description",maxLines:6,forceWrap:true});
      fit.verticalAlign=0;return fit;
    }
    if(role === "pause-confirm")return fitBlock(label,state,{width:state.own.width,height:state.own.height,role,maxLines:Math.max(1,authoredLines(state.source).length),preserveLines:true});
    if(role==='objective-prose'){
      const row=node.parent,layout=component(row,cc,'Layout'),icons=(row.children??[]).filter(n=>n!==node&&n.active!==false);
      const reserved=icons.reduce((sum,n)=>sum+number(transform(n,cc)?.width)*positive(n.scale.x),0)+icons.length*number(layout?.spacingX);
      const width=Math.max(200,number(ui?.width,1200)-number(layout?.paddingLeft)-number(layout?.paddingRight)-reserved-24);
      const pause=ancestor(node,/^PauseScreen$/),sound=pause&&labels.find(other=>other.node.name==='ToolTip'&&other.node.parent?.name==='MusicVolume'&&ancestor(other.node,/^PauseScreen$/)===pause&&states.has(other));
      const reference=sound&&plan(sound,states.get(sound),labels);
      const base=reference?reference.fontSize*scale(sound.node).y/scale(node).y*.95:tuned(40)*opticalFactor(styleFor(label,state));
      return fitBlock(label,state,{width,height:400,base,style:styleFor(label,state),role,maxLines:8,forceWrap:true,grow:true});
    }
    if(role === "fanmade-local") {
      return fitBlock(label,state,{width:500,height:160,base:tuned(52),role,maxLines:2,forceWrap:true});
    }
    if(role === "loading-tip") {
      const screen=screenBox(node),ns=scale(node);
      return fitBlock(label,state,{width:screen?screen.width*.92/ns.x:2000,height:screen?screen.height*.28/ns.y:440,base:tuned(screen?screen.height*.035/ns.y:56),role,maxLines:12,grow:true,forceWrap:true});
    }
    if(role === "window-title") {
      const frame=node.parent?.parent;
      const medals=ancestor(node,/^PlantMedalDisplayer$/);
      if(medals) {
        const ns=scale(node),ps=scale(node.parent),top=point(node.parent).y+state.position.y*ps.y+16*ns.y;
        const content=[];const visit=n=>{if(n.name==='ScrollView'&&n.activeInHierarchy!==false){const r=box(n,cc);if(r)content.push(r.top);}for(const child of n.children??[])visit(child);};visit(medals);
        const height=Math.min(150,content.length?Math.max(1,(top-Math.max(...content)-20*ns.y)/ns.y):state.own.height);
        const width=Math.min(1800,Math.max(state.own.width,number(ui?.width,1200)*.72));
        const fit=fitBlock(label,state,{width,height,base:tuned(104),role,maxLines:1});
        fit.position={...state.position,y:state.position.y+16*ns.y/ps.y};return fit;
      }
      if(frame?.parent?.name === "FanmadeLevelWindow") {
        const ns=scale(node),ps=scale(node.parent),local=frame.getChildByName?.("LocalLevelNode"),caption=local?.getChildByName?.("ToolTip"),close=frame.getChildByName?.("buttonExit"),border=box(node.parent,cc);
        if(caption&&border) {
          const captionLeft=point(caption).x,left=captionLeft+500*scale(caption).x+28*ns.x,right=(close&&box(close,cc)?.left)??border.right-80*ns.x;
          if(right>left) {
            const fit=fitBlock(label,state,{width:(right-left)/ns.x-24,height:150,base:tuned(104),role,maxLines:1});
            fit.position={...state.position,x:((left+right)/2-point(node.parent).x)/ps.x};return fit;
          }
        }
      }
      if(frame?.parent?.name === "PlayerSelector") {
        const border=box(node.parent,cc),ns=scale(node),ps=scale(node.parent);
        if(border) {
          const gap=24*ns.x,center=(border.left+border.right)/2;
          let left=border.left+gap,right=border.right-gap;
          for(const name of ["FixPlayer","buttonExit"]) {
            const control=frame.getChildByName?.(name);
            if(!control || control.activeInHierarchy===false)continue;
            const r=box(control,cc);if(!r)continue;
            if((r.left+r.right)/2<center)left=Math.max(left,r.right+gap);
            else right=Math.min(right,r.left-gap);
          }
          if(right>left) {
            const width=(right-left)/ns.x;
            const fit=fitBlock(label,state,{width:Math.max(1,width-32),height:Math.max(state.own.height,150),base:tuned(104),style:styleFor(label,state),role,maxLines:1});
            fit.geometry.width=width;fit.bounds.width=width;
            fit.position={...state.position,x:((left+right)/2-point(node.parent).x)/ps.x};
            return fit;
          }
        }
      }
      const width=Math.min(1800,Math.max(state.own.width,number(ui?.width,1200)*.72));
      return fitBlock(label,state,{width,height:Math.max(state.own.height,150),base:tuned(104),style:styleFor(label,state),role,maxLines:1});
    }
    if(role === "task-count") {


      const root=ancestor(node,/^(?:LevelTaskCount|LevelTaskDisplayer)(?:\d+)?$/i),pill=root?.getChildByName?.("taskCountWindow"),icon=root?.getChildByName?.("Icon");
      if(pill&&/^Осталось(?:\s|:)/u.test(state.source)){state.counterPill=pill;const saved=rememberTip(pill);transform(pill,cc)?.setContentSize(Math.max(saved.size?.[0]??150,174),saved.size?.[1]??45);}
      const frame=pill&&box(pill,cc),s=scale(node),p=point(node),rs=scale(root??node);
      const left=frame?Math.max(frame.left+8*rs.x,((icon&&box(icon,cc)?.right)??frame.left)+6*rs.x):null;
      const right=frame?frame.right-8*rs.x:null,width=frame?Math.max(1,right-left)/s.x:Math.max(state.own.width,250),height=frame?Math.max(1,(frame.height-8*rs.y)/s.y):Math.max(state.own.height,110);
      const fit=fitBlock(label,state,{width,height,source:state.source.replace(/\s+/g," ").trim(),base:tuned(44),style:styleFor(label,state),role,maxLines:1});
      if(frame)fit.position={...state.position,x:((left+right)/2-point(node.parent).x)/scale(node.parent).x};
      return fit;
    }
    if(label.__rffFanmadeTitle) return fitBlock(label,state,{...label.__rffFanmadeTitle,source:state.source,base:tuned(48),style:styleFor(label,state),role:"fanmade-title",maxLines:2,forceWrap:true});
    if(label.__rffArcadeReward) {
      const reward=label.__rffArcadeReward,multiline=reward.maxLines===2;
      return fitBlock(label,state,{...reward,source:state.source,base:tuned(multiline?44:50),style:styleFor(label,state),role:"arcade-reward",maxLines:reward.maxLines??1,forceWrap:multiline});
    }
    if(node.parent?.name==="confirm_frame" && /^(Change|Fault|Half|Correct|Steps|Upload)$/.test(node.name)) {
      const index=['Change','Fault','Half','Correct'].indexOf(node.name),legend=index>=0,upload=node.name==='Upload',frame=box(node.parent,cc),ps=scale(node.parent),ns=scale(node);
      const style=styleFor(label,state),outline=label.enableOutline?number(label.outlineWidth,2):0;
      const left=legend?state.position.x+8:-(number(ui?.width,177.5)/2)+24;
      const width=legend?Math.max(1,number(ui?.width,177.5)/2-14-left):number(ui?.width,177.5)-48;
      const height=legend?41:upload?76:46,source=upload?state.source.replace(/^Подтверждено$/iu,"Подтверж-\nдено"):state.source.trim();
      const available=Math.max(1,width-outline*2-8);
      let size=Math.floor(upload?tuned(30):baseSize(label,state)),lines,lineHeight;
      do { lines=balancedLines(source,available/1.04,size,measure,style);const ink=inkBounds(lines,style,size);lineHeight=Math.max(size*LINE_RATIO,ink.ascent+ink.descent+outline*2+2);
        if(lines.length<=(legend||upload?2:1)&&Math.max(...lines.map(text=>measure(text,style)))*size*1.04<=available&&(lines.length-1)*lineHeight+Math.max(size*1.35,ink.ascent+ink.descent)+outline*2+6<=height)break;
      } while(--size>1);
      const position={...state.position,x:upload?0:left,y:legend?41-index*43:upload&&frame?(frame.bottom+14*ps.y+height*ns.y*.5-point(node.parent).y)/ps.y:state.position.y};
      if(legend){const sign=node.getChildByName?.('sign');if(sign){const saved=rememberTip(sign);sign.setPosition(saved.p.x-8,saved.p.y,saved.p.z);}}
      return {fontFamily:fontFor(resources,style),useSystemFont:true,fontSize:size,lineHeight:Math.round(lineHeight*10)/10,spacingX:0,isBold:false,enableWrapText:false,overflow:1,verticalAlign:1,cacheMode:0,string:lines.join('\n'),geometry:{width,height},position,style,lines,bounds:{width,height,maxSize:Infinity,multiline:true,fixed:true,role:upload?'arcade-confirm':'arcade-legend'}};
    }
    if(role === "world") {
      const b=budget(label,state,labels);
      return fitBlock(label,state,{width:b.width,height:b.height,source:state.source.trim().split(/\s+/).join("\n"),base:b.maxSize*number(resources.percent,68)/68,style:styleFor(label,state),role,maxLines:20,forceWrap:true});
    }
    if(role === "level" && label.__rffLevelCaption) {
      return fitBlock(label,state,{...label.__rffLevelCaption,role,maxLines:1});
    }
    if(role === "intro") {
      const b=budget(label,state,labels),fit=fitBlock(label,state,{width:b.width,height:Math.max(100,state.own.height),role,maxLines:2});
      const screen=screenBox(node),ns=scale(node),ps=scale(node.parent),icons=[];
      const nativePowerClass=cc.js?.getClassByName?.('PowerupFingers');
      const visit=n=>{const power=nativePowerClass?n.getComponent?.(nativePowerClass):null;if(power&&n.activeInHierarchy!==false)for(const field of ['fireButton','snowButton','tossButton','zapButton','cherryButton']){const button=power[field]?.node;if(button?.activeInHierarchy!==false){const r=button&&box(button,cc);if(r)icons.push(r);}}if(n.activeInHierarchy!==false&&/^(?:PowerupFingers|Powerup_(?:Snow|Toss|Zap|Flame|Cherry)|PlantFoodCount)$/.test(n.name??"")){const r=box(n,cc);if(r)icons.push(r);}for(const child of n.children??[])visit(child);};
      let top=node;while(top.parent)top=top.parent;visit(top);
      const currentBottom=point(node.parent).y+state.position.y*ps.y-fit.geometry.height*ns.y*number(transform(node,cc)?.anchorPoint?.y,.5);
      const bottom=Math.max(currentBottom,...icons.filter(r=>!screen||r.bottom<screen.bottom+screen.height*.25).map(r=>r.top+12));
      if(bottom>currentBottom)fit.position={...state.position,y:state.position.y+(bottom-currentBottom)/ps.y};
      return fit;
    }
    if(role === "lose-tip") return fitBlock(label,state,{width:state.own.width,height:state.own.height,style:styleFor(label,state),role,maxLines:2});
    if(label.__rffStorePrice) return fitBlock(label,state,{...label.__rffStorePrice,source:state.source,base:tuned(52),style:styleFor(label,state),role:"store-price",maxLines:1});
    if(role === "warning") {


      let canvas=node.parent;while(canvas?.parent && !component(canvas,cc,"Canvas") && canvas.name !== "Canvas") canvas=canvas.parent;
      const designWidth=number(transform(canvas,cc)?.width,1024);
      const width=designWidth*.86/.5;
      return fitBlock(label,state,{width,height:290,base:90*number(resources.percent,68)/68*opticalFactor(styleFor(label,state)),style:styleFor(label,state),role,maxLines:2,forceWrap:true});
    }
    if(role === "game-tip") {
      const screen=screenBox(node),root=node.parent,rs=scale(root),info=tipIllustration(root);
      const panelWidth=screen?screen.width*.92/rs.x:state.own.width*positive(node.scale.x)+24;



      const tipScale=Math.max(1,panelWidth/900),width=Math.max(120,(panelWidth-info.width-32)/tipScale),effectiveY=rs.y*tipScale;
      return {...fitBlock(label,state,{width,height:screen?screen.height*.40/effectiveY:600,base:tuned(screen?screen.height*.035/effectiveY:70),style:styleFor(label,state),role,maxLines:20,grow:true,forceWrap:true}),tipScale};
    }
    if(role === "dialog") {
      const style=styleFor(label,state);
      let base=baseSize(label,state);
      if(style==='pico') {
        const root=ancestor(node,/^NPC_Controller$/),portrait=Boolean(ancestor(node,/Icon_bubble$/));
        const reference=labels.find(other=>other!==label&&roleFor(other)==='dialog'&&ancestor(other.node,/^NPC_Controller$/)===root&&Boolean(ancestor(other.node,/Icon_bubble$/))===portrait&&styleFor(other,states.get(other))==='brianne');
        const original=reference&&states.get(reference)?.original;
        const nativeSize=number(original?.fontSize??reference?.fontSize,70);
        const ratio=reference?scale(reference.node).y/scale(node).y:1;
        base=nativeSize*ratio*number(resources.percent,68)/100*opticalFactor(style);
      }
      return fitBlock(label,state,{width:state.own.width,height:state.own.height,base,style,role,maxLines:12,forceWrap:true});
    }
    if(role === "reward-heading") return fitBlock(label,state,{width:Math.max(state.own.width,number(ui?.width)*.93),height:state.own.height,style:styleFor(label,state),role});
    if(role === "ticket-expiry") {
      const source=russianTime(state.source.trim().replace(/\s+/g," ")).replace(/^истекает\s+через\s*/iu,"").replace(/[!]+$/u,"");
      const native=label.node.parent?.name === "TicketCountDown";
      const width=native ? number(ui?.width)*.90 : Math.max(state.own.width,number(ui?.width)*.89);
      const height=native ? number(ui?.height)*.87 : Math.max(state.own.height,number(ui?.height)*.86);
      return fitBlock(label,state,{width,height,source,base:tuned(native?48:42),style:styleFor(label,state),role,maxLines:2});
    }
    if(role === "pinata-countdown") {
      const time=russianTime(state.source.trim().replace(/^до\s+следующего\s*:\s*/iu,"").replace(/\s+/g," "));
      const fit=fitBlock(label,state,{width:320,height:84,source:`До следующего:\n${time}`,base:tuned(30),style:styleFor(label,state),role,maxLines:2,forceWrap:true});




      fit.position={...state.position};
      return fit;
    }
    if(role === "arcade-heading") return fitBlock(label,state,{width:Math.max(state.own.width,number(ui?.width)*.85),height:Math.max(state.own.height,140),style:styleFor(label,state),role});
    if(role === "arcade-caption") {
      const b=budget(label,state,labels);
      const source=state.source.trim().replace(/^Количество растений$/iu,"Число растений");
      return fitBlock(label,state,{width:b.width,height:Math.max(state.own.height,80),source,style:styleFor(label,state),role});
    }
    if(adviceContext(node)) {
      const b=budget(label,state,labels),height=Number.isFinite(b.height)?b.height:Math.max(state.own.height,baseSize(label,state)*1.8);
      const fit=fitBlock(label,state,{width:b.width,height,style:styleFor(label,state),role:"advice",maxLines:20});
      fit.bounds={...b,height,multiline:fit.bounds.multiline,role:"advice"};return fit;
    }
    return null;
  }

  function basePlan(label, state, labels) {
    const specific = almanacPlan(label,state) ?? medalPlan(label,state) ?? specialPlan(label,state,labels);
    if (specific) return specific;
    const b = budget(label, state, labels), style = styleFor(label, state);
    const outline = label.enableOutline ? positive(label.outlineWidth, 2) * 2 : 2;
    const width = Math.max(1, b.width - outline - 3);
    const height = Math.max(1, b.height - outline - 3);
    let source = b.multiline ? state.source.trim() : state.source.trim().replace(/\s*\r?\n\s*/g, " ");



    if (!b.multiline && !(b.control?.horizontal) && (b.soloButton || b.control || /title|plantname/i.test(label.node.name ?? "")) && /\s/.test(source) && Number.isFinite(b.height) && b.height >= 65) {
      const fit=fitBlock(label,state,{width:b.width,height:b.height,source,base:Math.min(baseSize(label,state),b.maxSize),style,role:b.role});
      if(fit.bounds.multiline) {fit.bounds={...b,multiline:true};return fit;}
    }
    let size = Math.max(1, Math.floor(Math.min(baseSize(label, state), b.maxSize)));
    if (!b.multiline) {
      const textWidth = measure(source, style);
      if (textWidth > 0) size = Math.min(size, Math.max(1, Math.floor(width / (textWidth * 1.04))));
      size = Math.min(size, Math.max(1, Math.floor(height / 1.35)));
    } else {
      const longestWord = Math.max(...source.split(/\s+/).map(word => measure(word, style)));
      size = Math.min(size, Math.max(1, Math.floor(width / (longestWord * 1.04))));
      let low = 1, high = size;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2), lines = wrapWords(source, width / 1.04, mid, measure, style);
        if ((lines.length - 1) * mid * LINE_RATIO + mid * 1.35 <= height) low = mid;
        else high = mid - 1;
      }
      size = low;
    }
    const lines = b.multiline ? wrapWords(source, width / 1.04, size, measure, style) : [source];
    const stableBox = b.control || b.soloButton || b.role === "world" || b.role === "level" || b.role === "intro";
    const geometry = stableBox ? { width: b.width, height: b.role === "level" || b.role === "intro" ? Math.min(state.own.height,b.height) : b.height } : null;
    return { fontFamily: fontFor(resources,style), useSystemFont: true, fontSize: size, lineHeight: Math.round(size * LINE_RATIO * 10) / 10, spacingX: 0, isBold: false, enableWrapText: false, overflow: (b.multiline && b.fixed) || stableBox ? 1 : 0, verticalAlign: stableBox ? 1 : state.original.verticalAlign, cacheMode: 0, string: lines.join("\n"), bounds: b, geometry, style, lines };
  }

  function plan(label,state,labels){
    const desired=basePlan(label,state,labels),percent=number(resources.percent,68);
    if(percent<68){



      const originalPercent=resources.percent;let reference;
      try{resources.percent=68;reference=basePlan(label,state,labels);}finally{resources.percent=originalPercent;}
      const size=Math.max(1,Math.min(desired.fontSize,Math.floor(reference.fontSize*percent/68)));
      if(size<desired.fontSize){const ratio=size/desired.fontSize;desired.fontSize=size;desired.lineHeight=Math.round(desired.lineHeight*ratio*10)/10;
        if(["game-tip","loading-tip"].includes(desired.bounds.role)){
          const ink=inkBounds(desired.lines,desired.style,size),outline=label.enableOutline?number(state.original.outlineWidth,2):0;
          desired.geometry.height=(desired.lines.length-1)*desired.lineHeight+Math.max(size*1.65,ink.ascent+ink.descent)+outline*2+24;
        }
      }
    }
    return desired;
  }

  function scan() {
    if (disposed) return;
    try {
      const scene = cc.director.getScene();
      const allLabels = labelList(scene,cc);
      for(const node of tipNodes.keys())if(node.isValid===false)tipNodes.delete(node);
      const russianPages = new Set(allLabels.filter(label=>RUSSIAN.test(sourceOf(label))).map(label=>almanacPage(label.node)).filter(Boolean));
      const richChanged = scanRichTexts(scene,russianPages);
      const labels = labelList(scene, cc).filter(label=>!richOwner(label.node)), present = new Set(labels);
      for (const [label, state] of states) if (!present.has(label) || label.isValid === false || label.node?.isValid === false) {
        restore(label, state); states.delete(label);
      }

      for (const label of labels) {
        if (label.isValid === false || label.node?.isValid === false) continue;
        const state = states.get(label);
        const source = state && label.string === state.applied?.string ? state.source : String(label.string ?? "");
        if (label.node.__rffOwnedFont) { if(state){restore(label,state);states.delete(label);}continue; }
        if (RUSSIAN.test(source) || adviceContext(label.node) || (almanacRole(label) && russianPages.has(almanacPage(label.node)))) capture(label);
        else if (state) { restore(label, state); states.delete(label); }
      }
      layoutTimers(labels,scene);
      for(const label of labels)if(states.has(label)&&roleFor(label)==='game-tip')prepareTipRoot(label.node.parent);
      const plans = [];
      for (const label of labels) { const state = states.get(label); if (state) plans.push([label, state, plan(label, state, labels)]); }


      const captions = plans.filter(([label,,desired]) => (desired.bounds.soloButton || desired.bounds.control) && labelList(label.node.parent,cc).length === 1);
      const grouped = new Set();
      for (const entry of captions) {
        if (grouped.has(entry)) continue;
        const button = entry[0].node.parent, first = box(button,cc);
        if (!first) continue;
        const row = captions.filter(other => {
          const candidate = other[0].node.parent, b = box(candidate,cc);
          return candidate.parent === button.parent && b && Math.abs(point(candidate).y-point(button).y) < first.height*0.25 && b.width/first.width > 0.75 && b.width/first.width < 1.34 && b.height/first.height > 0.75 && b.height/first.height < 1.34;
        });
        const common = Math.min(...row.map(other=>other[2].fontSize));
        for (const other of row) {
          const desired=other[2];desired.fontSize=common;desired.lineHeight=Math.round(common*LINE_RATIO*10)/10;
          if(desired.bounds.multiline) {desired.lines=wrapWords(other[1].source.trim(),(desired.bounds.width-12)/1.04,common,measure,desired.style);desired.string=desired.lines.join("\n");}
          grouped.add(other);
        }
      }
      for(const [label,state,desired] of plans)if(["game-tip","loading-tip"].includes(desired.bounds.role)){
        if(!state.tipTarget?.node||state.tipTarget.node.isValid===false){
          releaseTipRaster(state);state.tipSprite=null;
          state.tipEnabled??=label.enabled;label.enabled=false;
          const loading=desired.bounds.role==='loading-tip',node=new cc.Node(loading?'RussianLoadingTipText':'RussianGameTipText');node.parent=loading?label.node:label.node.parent;node.layer=label.node.layer;node.__rffOwnedFont=true;node.addComponent(cc.UITransform);
          state.tipTarget=node.addComponent(cc.Label);state.tipTarget.color=label.color.clone();state.tipTarget.enableOutline=label.enableOutline;state.tipTarget.outlineWidth=label.outlineWidth;state.tipTarget.outlineColor=label.outlineColor.clone();state.tipTarget.horizontalAlign=1;
        }
        state.tipTarget.node.setScale(desired.tipScale??1,desired.tipScale??1,1);
        if(desired.bounds.role==='loading-tip')state.tipTarget.node.setPosition(0,desired.geometry.height/2,0);
      }
      const changedLabels = [];
      for (const [sourceLabel, state, desired] of plans) {
        const label=state.tipTarget??sourceLabel;


        let changed = false;
        for (const key of ["overflow", "enableWrapText", "cacheMode", ...("font" in desired ? ["font"] : []), ...("outlineWidth" in desired ? ["outlineWidth"] : []), "useSystemFont", "fontFamily", "isBold", "spacingX", "fontSize", "lineHeight", "verticalAlign", "string"]) if (label[key] !== desired[key]) { label[key] = desired[key]; changed = true; }
        if (desired.geometry) {
          const ui = transform(label.node, cc), g = desired.geometry;
          const height = g.height === null ? number(ui?.height) : g.height;
          if (ui && (ui.width !== g.width || ui.height !== height)) { ui.setContentSize?.(g.width,height); state.resized = true; changed = true; }
          if ((desired.bounds.soloButton || (desired.bounds.control && !desired.bounds.control.horizontal)) && number(label.node.position?.y) !== 0) {
            label.node.setPosition?.(number(label.node.position?.x),0,number(label.node.position?.z));state.moved = true;changed = true;
          }
        }
        if(desired.position && (label.node.position.x !== desired.position.x || label.node.position.y !== desired.position.y)) {
          label.node.setPosition?.(desired.position.x,desired.position.y,desired.position.z);state.moved=true;changed=true;
        }
        state.applied = desired;
        if (changed && label.node.activeInHierarchy !== false) changedLabels.push(sourceLabel);
      }


      for (const label of changedLabels) {
        (states.get(label)?.tipTarget??label).updateRenderData?.(true);
        if (["almanac-prose","game-tip"].includes(states.get(label)?.applied?.bounds.role)) {
          states.get(label).resized = true;
          if (!label.string) transform(label.node,cc)?.setContentSize?.(states.get(label).own.width,0);
        }
      }
      reflowAlmanac([...richChanged,...changedLabels.filter(label=>almanacRole(label)).map(label=>label.node)],russianPages);


      const objectiveLayouts=new Set();
      for(const [label,,desired]of plans)if(desired.bounds.role==='objective-prose')for(let n=label.node.parent;n&&!/^(LevelObjectiveScreen|PauseScreen)$/.test(n.name);n=n.parent){const layout=component(n,cc,'Layout');if(layout?.enabled)objectiveLayouts.add(layout);}
      const depth=n=>{let d=0;for(;n;n=n.parent)d++;return d;};
      for(const layout of [...objectiveLayouts].sort((a,b)=>depth(b.node)-depth(a.node)))layout.updateLayout?.(true);
      for(const [label,state,desired] of plans) if(roleFor(label) === "game-tip") layoutTip(label,state,desired,scene);
      for(const [label,state,desired] of plans)if(['game-tip','loading-tip'].includes(desired.bounds.role))rasterTip(label,state,desired);
      const ownControls = new Set(changedLabels.map(label => states.get(label)?.applied?.bounds.control).filter(control => control?.horizontal));
      for (const control of ownControls) control.layout.updateLayout?.(true);
      releaseControls(present);
      affected = plans.length;
    } catch (error) {
      if (!warned) { warned = true; log.warn?.(`Русский шрифт ${VERSION}: ${String(error?.message ?? error)}`); }
    }
  }

  return {
    scan,
    get affected() { return affected; },
    inspect(label) { return states.get(label)?.applied ?? null; },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [label, state] of states) restore(label, state);
      for (const [owner, state] of richStates) restoreRich(owner,state);
      richStates.clear();
      states.clear();
      reflowAlmanac([]);
      releaseControls(null);
      for(const saved of timerNodes.values())restoreTimerNode(saved);
      restoreTimerOrder([...timerNodes.values()]);
      timerNodes.clear();
      for(const [node,s] of tipNodes)if(node.isValid!==false){if(s.reparented&&s.parent?.isValid!==false)node.parent=s.parent;if(s.reordered||s.reparented)node.setSiblingIndex?.(s.sibling);if(s.size)transform(node,cc)?.setContentSize?.(...s.size);node.setPosition?.(s.p.x,s.p.y,s.p.z);if(s.s)node.setScale?.(s.s);if(s.w)s.w.enabled=s.we;if(s.l)s.l.enabled=s.le;}tipNodes.clear();
    }
  };
}


async function loadFonts(ctx, resources) {
  const own = ctx.files.own();
  resources.metrics = JSON.parse(await own.readText("assets/fonts/metrics.json"));
  if (typeof globalThis.FontFace !== "function" || !globalThis.document?.fonts?.add) throw new Error("FontFace недоступен");
  const cancelled = () => resources.stopped || ctx.runtime.signal?.aborted;
  await Promise.all([
    [CLASSIC_FAMILY.regular,"BalsamiqSans-Regular.ttf"],
    ...FONT_OPTIONS.map(o=>[o.family,o.file])
  ].map(async ([family,name]) => {
    const bytes = await own.readBytes(`assets/fonts/${name}`);
    if (cancelled()) return;
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const face = new globalThis.FontFace(family, data);
    await face.load();
    if (cancelled()) return;
    globalThis.document.fonts.add(face);
    resources.faces.push(face);
  }));
  if (!cancelled()) resources.custom = true;
}




export async function panelLanguageModule() {
  const entries = globalThis.performance?.getEntriesByType?.("resource") ?? [];
  const origin = globalThis.location?.origin;
  const url = entries.map(e => e.name).find(name => {
    try { const parsed = new URL(name); return parsed.origin === origin && /\/assets\/i18n-[\w-]+\.js$/.test(parsed.pathname); }
    catch (_) { return false; }
  });
  if (!url) {
    if (globalThis.window?.gpNext) throw new Error("Языковой модуль GP-Next не найден среди загруженных ресурсов.");
    return null;
  }
  const module = await import(url);
  if (typeof module.i !== "function" || typeof module.t !== "function" || typeof module.r !== "function") {
    throw new Error("Неподдерживаемый интерфейс языкового модуля GP-Next.");
  }
  // 1.5.4 exports syncFromGameLanguage; 1.5.5 exports setLocale in the same slot.
  // Passing English works with both; the caller restores the game's language.
  return { getLocale: module.t, subscribe: module.r, setEnglish: () => module.i("en") };
}

export function createLanguageController(cc, classes, log = {}) {
  const { MultiLanguage: ML, LanguageEnum: languages, Setting, KeyListener } = classes;
  let panel = null, unsubscribe = null, disposed = false, started = false, applied = false, applying = false;
  let deadline = Infinity, warned = false;
  let startupLanguage = readStartupLanguage(), requestedLanguage = null;
  function englishPanel() {
    if (disposed || !panel || !ML || applying || panel.getLocale() === "en") return;
    const language = ML.currentLanguage;
    applying = true;
    try {


      ML.currentLanguage = Number(languages?.EN ?? 0);
      panel.setEnglish();
      if (panel.getLocale() !== "en") throw new Error("Не удалось включить English в панели GP-Next.");
    } finally { ML.currentLanguage = language; applying = false; }
  }
  function russianIndex() {
    const index = Number(languages?.RU);
    return Number.isInteger(index) && index >= 2 && index < Number(languages?.amount) ? index : null;
  }
  function saveGameLanguage(index) {
    try {
      const storage = cc.sys?.localStorage;
      const source = storage?.getItem("PvZ2_Settings");
      const settings = source ? JSON.parse(source) : Setting?.getSettings?.();
      if (settings && typeof settings === "object" && !Array.isArray(settings) && settings.Language !== index) {
        storage?.setItem("PvZ2_Settings", JSON.stringify({ ...settings, Language: index }));
      }
    } catch (error) { log.warn?.(`Язык применён на этот запуск; настройка языка не сохранена: ${String(error?.message ?? error)}`); }
  }
  function applyStartupLanguage() {
    if (disposed || applied || !started || !ML) return;
    const english = Number(languages?.EN ?? 0), amount = Number(languages?.amount);
    const index = requestedLanguage === "ru" ? russianIndex()
      : Number.isInteger(english) && english >= 0 && (!(amount > 0) || english < amount) ? english : null;
    if (index === null) {
      if (Date.now() > deadline) { applied = true; log.warn?.("Русский язык недоступен; загрузка продолжена на английском. Включите русификатор и перезапустите игру."); }
      return;
    }
    applied = true;
    const previous = ML.currentLanguage;
    ML.currentLanguage = index;


    saveGameLanguage(index);
    englishPanel();


    const menu = /^(mainScene|worldMapScene|almanacScene|storeScene|awardScene|zenGardenScene)$/i.test(cc.director.getScene()?.name ?? "");
    if (menu && (requestedLanguage === "ru" || previous !== index) && !KeyListener?.isInGame && typeof KeyListener?.RestartScene === "function") {
      try { Promise.resolve(KeyListener.RestartScene()).catch(error => log.warn?.(`Язык применён; обновить меню не удалось: ${String(error?.message ?? error)}`)); }
      catch (error) { log.warn?.(`Язык применён; обновить меню не удалось: ${String(error?.message ?? error)}`); }
    }
    log.info?.(`Язык запуска применён: ${requestedLanguage === "ru" ? "Русский" : "English"}.`);
  }
  return {
    async prepare() {
      if (!ML) return;
      try { panel = await panelLanguageModule(); }
      catch (error) { if (!warned) { warned = true; log.warn?.(`Язык F9: ${String(error?.message ?? error)}`); } }
    },
    publish() { if (disposed) return; if (panel) { unsubscribe = panel.subscribe(englishPanel); englishPanel(); } },
    get startupLanguage() { return startupLanguage; },
    setStartupLanguage(value) {
      if (disposed || (value !== "ru" && value !== "en")) return false;
      startupLanguage = value;
      try { globalThis.localStorage?.setItem(STARTUP_LANGUAGE_KEY, value); }
      catch (error) { log.warn?.(`Язык следующего запуска не сохранён: ${String(error?.message ?? error)}`); }
      return true;
    },
    start(loading = false) {
      if (disposed) return;
      if (started) {
        if (!loading && deadline === Infinity) deadline = Date.now() + 10000;
        applyStartupLanguage();
        return;
      }
      started = true; requestedLanguage = startupLanguage; deadline = loading ? Infinity : Date.now() + 10000;
      if (ML && requestedLanguage === "ru" && russianIndex() === null) {
        // The translation is registered after the loading scene starts. Never
        // interpret yesterday's numeric language index as today's Spanish index.
        const english = Number(languages?.EN ?? 0);
        ML.currentLanguage = english;
        saveGameLanguage(english);
      }
      applyStartupLanguage();
    },
    scan() { englishPanel(); applyStartupLanguage(); },
    dispose() { disposed = true; unsubscribe?.(); unsubscribe = null; }
  };
}

let session = null;
export default {
  startup(ctx) {
    const cc = ctx.engine.getCc();
    const event = cc?.Director?.EVENT_BEFORE_DRAW ?? "director_before_draw";
    if (!cc?.director?.on || !cc?.director?.getScene) throw new Error("Исправление шрифта: недоступен Cocos director");

    const resources = { custom: false, faces: [], metrics: null, stopped: false, percent: savedPercent(), fontSlots: readFontSlots(FONT_OPTIONS) };


    let nativeEngine = ctx.engine;
    const classByName = name => nativeEngine?.getClassByName?.(name) ?? cc.js?.getClassByName?.(name) ?? null;
    const exportByName = (module, name) => {
      const id = `chunks:///_virtual/${module}.ts`;
      return nativeEngine?.getModuleExport?.(id, name) ?? globalThis.System?.get?.(id)?.[name] ?? null;
    };
    const language = createLanguageController(cc, { MultiLanguage: classByName("MultiLanguage"), LanguageEnum: exportByName("MultiLanguage", "LanguageEnum"), Setting: exportByName("SettingWindow", "Setting"), KeyListener: classByName("KeyListener") }, ctx.log);
    const resolveNative=()=>({SettingWindow:classByName("SettingWindow"),Players:nativeEngine?.getAllPlayerProperties?.()??exportByName("PlayerProperties","AllPlayerProperties"),profileKey:exportByName("PlayerProperties","UserDataDocument"),PowerupFingers:exportByName("PowerupFingers","PowerupFingers")??classByName("PowerupFingers"),PlantFoodCount:classByName("PlantFoodCount"),SunCount:classByName("SunCount"),LevelPlay:exportByName("levelController","LevelPlay"),CoinCount:classByName("CoinCount"),CoinCollecterInGame:classByName("CoinCollecterInGame"),sounds:exportByName("SoundRescourses","sounds"),Zen:classByName("zenGardenScene"),Commodity:classByName("StoreCommodity"),LnC:exportByName("LnC","LnC")??classByName("LnC"),UIInGame:exportByName("UI","UIInGame"),ShovelUIController:classByName("ShovelUIController")});
    const native={...resolveNative(),resolve:()=>({...resolveNative(),Plant:classByName("Plant"),ImitaterPlant:classByName("ImitaterPlant"),MultiLanguage:classByName("MultiLanguage"),LanguageEnum:exportByName("MultiLanguage","LanguageEnum")})};
    const paid=createPaidController(cc,native,readPowerPreferences(),ctx.log),ui=createUiController(cc,native,ctx.log);
    native.getGamingSpeed=()=>exportByName("UI","gamingSpeed");
    native.getSuperSlowed=()=>exportByName("UI","superSlowed");
    native.getFreePlantFood=()=>exportByName("UI","freePF");
    native.resolveAutoCollect=()=>({dropping:classByName("dropping"),droppingInZen:classByName("droppingInZen"),LevelPlay:exportByName("levelController","LevelPlay"),UIInGame:exportByName("UI","UIInGame"),PlantFoodCount:classByName("PlantFoodCount")});
    const tipParty=createTipPartyController(cc),autoCollect=createAutoCollectController(cc,native,ctx.log);
    const planning=createPlanningController(native,ctx.log),speed=createSpeedController(cc,native,ctx.log),speedView=createSpeedControlView(speed),settingsView=createSettingsControlView();
    const preview=createFontPreview(cc,resources,ctx.log,{slots:FONT_SLOTS,options:FONT_OPTIONS});
    let controller = null, listener = null, disposed = false;
    const cleanup = () => {
      if (disposed) return;
      disposed = true; resources.stopped = true;
      nativeEngine = null;
      if (listener) cc.director.off(event, listener);
      controller?.dispose();
      tipParty.dispose();autoCollect.dispose();preview.dispose();ui.dispose();paid.dispose();planning.dispose();settingsView.dispose();speedView.dispose();speed.dispose();
      language.dispose();
      for (const face of resources.faces) globalThis.document?.fonts?.delete?.(face);
      resources.faces.length = 0;
      if (session?.resources === resources) session = null;
    };
    ctx.runtime.onDispose?.(cleanup, "russian-font-layout-cleanup");
    ctx.registrations.add("preloaded-russian-font-layout", {
      async prepare() {
        await language.prepare();
        let cancel = null;
        try {
          const deadline = new Promise((_, reject) => { cancel = ctx.runtime.setTimeout(() => reject(new Error("таймаут загрузки шрифта")), 8000, { label: "russian-font-load" }); });
          await Promise.race([loadFonts(ctx, resources), deadline]);
        } catch (error) {
          resources.stopped = true;
          resources.custom = false;
          for (const face of resources.faces) globalThis.document?.fonts?.delete?.(face);
          resources.faces.length = 0;
          ctx.log.warn(`Русский шрифт: используется Arial. ${String(error?.message ?? error)}`);
        } finally { if (typeof cancel === "function") cancel(); }
      },
      publish() {
        if (disposed) return;
        nativeEngine = null;
        language.publish();
        language.start(true);
        controller = createController(cc, resources, ctx.log);
        const reported = new Set();
        listener = () => {
          for (const [name, helper] of [["язык",language],["уведомления",tipParty],["интерфейс",ui],["усиления",paid],["планирование",planning],["скорость",speed],["автоподбор",autoCollect],["шрифт",controller]]) {
            try { helper.scan(); }
            catch (error) {

              if (!reported.has(name)) { reported.add(name); ctx.log.warn(`Исправление ${name}: ${String(error?.message ?? error)}`); }
            }
          }
        };
        cc.director.on(event, listener);
        session = { controller, resources, cleanup, language, paid, ui, planning, speed, speedView, settingsView, preview, autoCollect, bindEngine: engine => { nativeEngine = engine; } };
        ctx.log.info(`Русский шрифт ${VERSION}: пять исходных шрифтов; размер ${resources.percent}%; исправление до отрисовки кадра.`);
      },
      dispose: cleanup
    });
    return cleanup;
  },
  setup(ctx) {
    if (!session) { ctx.log.warn(`Исправление шрифта ${VERSION} требует перезапуска игры.`); return; }
    const current = session;
    current.bindEngine(ctx.engine);
    current.language.start();
    current.controller.scan();
    const setPercent = value => {
      current.resources.percent = Math.round(Math.max(50, Math.min(80, number(value, 68))));
      try { globalThis.localStorage?.setItem(PREFERENCE_KEY, String(current.resources.percent)); } catch (_) {
        ctx.log.warn("Размер шрифта изменён на текущий запуск; сохранить настройку не удалось.");
      }

    };
    let pricesExpanded=false;
    ctx.controls?.definePanel?.(current.settingsView.wrapPanel({
      title: "Русский шрифт и размеры",
      description: "Автоматическая подгонка работает при любом выбранном размере. Настройка сохраняется отдельно от прогресса игры.",
      groups: [{ title: "Оформление", items: [
        {type:"select",key:"startup-language",label:"Язык запуска по умолчанию",description:"Применяется после полного перезапуска игры. Для русского языка нужен включённый русификатор.",options:[{value:"ru",label:"Русский"},{value:"en",label:"English"}],getValue:()=>current.language.startupLanguage,setValue:value=>current.language.setStartupLanguage(value)},
        ...FONT_SLOTS.map(slot=>({type:"select",key:"font-slot-"+slot.key,label:slot.label,description:slot.description,options:FONT_OPTIONS,getValue:()=>fontSlotChoice(current.resources,slot.key),setValue:value=>{
          try { setFontSlot(current.resources,slot.key,value,FONT_OPTIONS); }
          catch (_) { ctx.log.warn("Шрифт изменён на текущий запуск; сохранить настройку не удалось."); }
        }})),
        {type:"action",key:"reset-style",label:"Вернуть рекомендуемое оформление",onClick:()=>{
          try { resetFontSlots(current.resources); }
          catch (_) { ctx.log.warn("Рекомендуемые шрифты применены; сохранить настройку не удалось."); }
        }}

      ] }, { title: "Размер текста", items: [
        { type: "number", key: "size-percent", label: "Общий размер, %", description: "Рекомендуется 68. Длинные заголовки и подписи переносятся, если в блоке хватает высоты.", min: 50, max: 80, step: 1, getValue: () => current.resources.percent, setValue: setPercent },
        { type: "action", key: "reset-size", label: "Вернуть стандартный размер", onClick: () => setPercent(68) }
      ] },{title:"Читы и усиления",items:[
        {type:"select",key:"powerup-mode",label:"Режим читов",options:[{label:"Без читов",value:"off"},{label:"Разрешить читы",value:"native"},{label:"За монеты",value:"coins"}],getValue:()=>current.paid.preferences.mode,setValue:v=>{current.paid.setMode(v);pricesExpanded=false;}},
        {type:"toggle",key:"show-prices",label:"Настроить стоимость усилений",visible:()=>current.paid.preferences.mode==="coins",getValue:()=>pricesExpanded,setValue:v=>{pricesExpanded=!!v;}},
        ...Object.entries({snow:"Снежки",toss:"Отбрасывание",zap:"Молния",flame:"Огонь",cherry:"Вишенка",food:"Одна подкормка"}).map(([key,label])=>({type:"number",key:"price-"+key,label:label+" — монеты",visible:()=>current.paid.preferences.mode==="coins"&&pricesExpanded,min:1,max:2147483647,step:1,getValue:()=>current.paid.preferences.prices[key],setValue:v=>current.paid.setPrice(key,v)})),
        {type:"action",key:"reset-prices",label:"Вернуть цены по умолчанию",visible:()=>current.paid.preferences.mode==="coins"&&pricesExpanded,onClick:()=>current.paid.resetPrices()},
        {type:"toggle",key:"show-auto-collect",label:"Настроить автоподбор предметов",description:"Открывает выбор предметов. При выключении все вложенные галочки снимаются и автоподбор прекращается сразу.",getValue:()=>current.autoCollect.enabled,setValue:v=>current.autoCollect.setActive(v)},
        {type:"toggle",key:"auto-collect-other",label:"Автоподбор прочего дропа",visible:()=>current.autoCollect.enabled,description:"Монеты, алмазы, ростки и билеты. Солнце и листики подкормки включаются отдельно. Работает также для монет и алмазов в саду.",getValue:()=>current.autoCollect.preferences.other,setValue:v=>current.autoCollect.setEnabled("other",v)},
        {type:"toggle",key:"auto-collect-sun",label:"Автоподбор солнца",visible:()=>current.autoCollect.enabled,description:"Собирает обычное солнце штатным способом. Опасные солнечные бомбы не активирует.",getValue:()=>current.autoCollect.preferences.sun,setValue:v=>current.autoCollect.setEnabled("sun",v)},
        {type:"toggle",key:"auto-collect-plantfood",label:"Автоподбор листиков подкормки",visible:()=>current.autoCollect.enabled,description:"Собирает листики, когда в банке есть место. Подкормку на растения не расходует.",getValue:()=>current.autoCollect.preferences.plantfood,setValue:v=>current.autoCollect.setEnabled("plantfood",v)}
      ]},{title:"Улучшения игры",items:[
        {type:"toggle",key:"planning-boost-fix",label:"Убирать копии от начального буста до старта раунда",description:"Во время подготовки буст из сада или за алмазы расходуется по игровой логике, но не создаёт копии. После запуска раунда копии и удобрение листиком действуют как обычно.",getValue:()=>current.planning.enabled,setValue:v=>current.planning.setEnabled(v)},
        {type:"toggle",key:"custom-game-speed",label:"Изменить стандартный множитель ускорения",description:"Заменяет ускорение штатной кнопки выбранным множителем. Пока ускорение выключено, скорость остаётся обычной.",getValue:()=>current.speed.enabled,setValue:v=>current.speed.setEnabled(v)},
        {type:"number",key:"game-speed-multiplier",label:"Множитель ускорения, ×",description:"От 1× до 10× с шагом 0.1. Можно вводить точку или запятую и подтверждать Enter. При включённом ускорении новое значение применяется сразу, при обычной скорости — после нажатия кнопки ускорения. Пауза и автоматическое отключение сохраняются.",visible:()=>current.speed.enabled,min:1,max:10,step:0.1,getValue:()=>current.speed.multiplier,setValue:v=>current.speed.setMultiplier(v)}
      ]}]
    }));
    current.preview.start();current.speedView.start();
    if (!current.resources.custom) ctx.ui.toast("Встроенный шрифт не загружен; используется Arial. Подробности в Log.", "warning");
  }
};
