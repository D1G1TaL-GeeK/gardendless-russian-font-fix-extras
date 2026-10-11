export const FONT_SLOTS = [
  { key: "fbu", label: "FBU — основной интерфейс", description: "Заголовки, кнопки, цели уровня, настройки, подсказки, магазин, Альманах и счётчики.", sample: "Древний Египет — цели уровня\nСобирайте солнце и защищайте сад.", fallback: "shantell", uuid: "86YVyymTlDWLji7C0CDv7q", fullUuid: "86615cb2-9939-4358-b8e2-ec2d020efeea", file: "FBUSV8C5EI.ttf" },
  { key: "brianne", label: "Brianne — реплики Дейва", description: "Реплики Безумного Дейва в диалогах и его портретных облачках.", sample: "Эй, сосед! Зомби уже близко.\nПриготовь растения и подкормку!", fallback: "comfortaa", uuid: "aa1w9sPAdB96kCISpAyKzE", fullUuid: "aad70f6c-3c07-41f7-a902-212a40c8acc4", file: "BRIANNETOD.ttf" },
  { key: "ashley", label: "Ashley Script — реплики Зомбосса", description: "Реплики Зомбосса в диалогах и облачках у его портрета.", sample: "Мой гениальный план почти готов!\nПосмотрим, как вы защитите свой сад.", fallback: "caveat", uuid: "60rUQnbDhIK5115YpEIHas", fullUuid: "60ad4427-6c38-482b-9d75-e58a442076ac", file: "ASHLEYSCRIPTMTSTD.ttf" },
  { key: "pico", label: "Pico12 — реплики Пенни", description: "Реплики Пенни, машины времени Дейва, в диалогах и её портретных облачках.", sample: "Путешествие во времени продолжается.\nВыберите растения для следующего уровня.", fallback: "comfortaa", uuid: "22yf1a7U5OXom7R1dgKHRK", fullUuid: "22c9fd5a-ed4e-4e5e-89bb-47576028744a", file: "PICO12__.ttf" },
  { key: "terror", label: "House of Terror — предупреждения", description: "Боевые предупреждения и сообщение о поражении.", sample: "Приближается огромная волна зомби!\nЗомби съели ваши мозги!", fallback: "ruslan", uuid: "d9rgNwXkFEtq1me80kgtn3", fullUuid: "d9ae0370-5e41-44b6-ad66-7bcd2482d9f7", file: "HOUSEOFTERROR.ttf" }
];
const FONT_SLOTS_KEY = "local.gardendless.russian-font-fix.font-slots.v1";
const LEGACY_MAIN_KEY = "local.gardendless.russian-font-fix.font-style.v1";
const LEGACY_DIALOG_KEY = "local.gardendless.russian-font-fix.dialog-style.v1";
const own = (object, key) => object != null && Object.hasOwn(object, key);
export function readFontSlots(options, storage) {
  const valid = new Set(options.map(option => option.value));
  let saved, main, dialog;
  try { storage ??= globalThis.localStorage; saved = JSON.parse(storage?.getItem(FONT_SLOTS_KEY) ?? "null"); } catch (_) {}
  try { main = storage?.getItem(LEGACY_MAIN_KEY); dialog = storage?.getItem(LEGACY_DIALOG_KEY); } catch (_) {}
  if (!valid.has(main)) main = undefined;
  if (dialog === "heading") dialog = main;
  const result = {};
  for (const slot of FONT_SLOTS) {
    const legacy = slot.key === "fbu" || slot.key === "terror" ? main : dialog;
    result[slot.key] = own(saved, slot.key) && valid.has(saved[slot.key]) ? saved[slot.key] : valid.has(legacy) ? legacy : slot.fallback;
  }
  return result;
}
export function setFontSlot(resources, key, value, options, storage) {
  if (!FONT_SLOTS.some(slot => slot.key === key) || !options.some(option => option.value === value)) return false;
  resources.fontSlots = { ...resources.fontSlots, [key]: value };
  (storage ?? globalThis.localStorage)?.setItem(FONT_SLOTS_KEY, JSON.stringify(resources.fontSlots));
  return true;
}
export function resetFontSlots(resources, storage) {
  resources.fontSlots = Object.fromEntries(FONT_SLOTS.map(slot => [slot.key, slot.fallback]));
  (storage ?? globalThis.localStorage)?.setItem(FONT_SLOTS_KEY, JSON.stringify(resources.fontSlots));
}
export function fontSlotChoice(resources, key) {
  const slot = FONT_SLOTS.find(slot => slot.key === key) ?? FONT_SLOTS[0];
  return resources.fontSlots?.[slot.key] ?? slot.fallback;
}
export function fontSlotFamily(resources, key, options) {
  if (!resources.custom) return "Arial";
  const choice = fontSlotChoice(resources, key);
  return (options.find(option => option.value === choice) ?? options.find(option => option.value === "ruslan"))?.family ?? "Arial";
}
export function fontOpticalFactor(resources, key) {
  if (!resources.custom) return 1;
  const choice = fontSlotChoice(resources, key);
  return choice === "ruslan" ? 1.18 : key === "ashley" && choice === "caveat" ? 1.20 : 1;
}
export function originalFontSlot(font, node, family = "") {
  const identities = [font?._uuid, font?.uuid, font?.name, font?._native, font?.nativeUrl, font?._nativeAssetURL, family].filter(value => typeof value === "string");
  for (const slot of FONT_SLOTS) if (identities.some(value => value.split("@")[0] === slot.uuid || value.toLowerCase().split("@")[0] === slot.fullUuid || value.toLowerCase().includes(slot.file.toLowerCase()))) return slot.key;
  if (identities.some(value => /HouseofTerror|House.of.Terror/i.test(value))) return "terror";
  for (let current = node; current; current = current.parent) {
    const name = current.name ?? "";
    if (/Zomboss/i.test(name)) return "ashley";
    if (/Winnie|Penny/i.test(name)) return "pico";
    if (/CrazyDave|DaveBubble/i.test(name)) return "brianne";
    if (/^(GamingWarn|GameLoseTip)$/.test(name)) return "terror";
  }
  for (let current = node; current; current = current.parent) if (current.name === "NPC_Controller") return "brianne";
  return "fbu";
}

export const DEFAULT_PRICES = Object.freeze({snow:1150,toss:950,zap:800,flame:1200,cherry:1500,food:1000});
const KEY="local.gardendless.russian-font-fix.powerups.v1";
const INDEX=["flame","snow","toss","zap","cherry"];
export function validPrice(value) { return /^(?:[1-9]\d*)$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value)<=2147483647; }
export function readPowerPreferences(storage=globalThis.localStorage) {
  let s={};try{s=JSON.parse(storage?.getItem(KEY)??"{}");}catch(_){}
  return {mode:s.mode==="coins"?"coins":s.mode==="off"||s.block===true?"off":"native",block:s.mode==="off"||s.block===true,prices:Object.fromEntries(Object.entries(DEFAULT_PRICES).map(([k,v])=>[k,validPrice(s.prices?.[k])?Number(s.prices[k]):v]))};
}
export function createPaidController(cc,native,preferences=readPowerPreferences(),log={}) {
  let {SettingWindow,Players,PowerupFingers,PlantFoodCount,SunCount,LevelPlay,CoinCount,CoinCollecterInGame,sounds,LnC,UIInGame}=native;
  const patched=new WeakMap(),originals=new WeakMap(),boundCallbacks=new WeakSet();
  const undo=[],nodes=new Map(),badges=new Map(),events=new WeakSet(),leases=new WeakMap(),foodPositions=new WeakMap(),visuals=new Map(),feedback=new Map();
  let lastRejected=-Infinity;
  let disposed=false,busy=false,profile=Players?.currentPlayer,lastFood=-Infinity,lastMode=preferences.mode,lastLock=false;
  const locked=()=>preferences.mode!=="native";
  const level=()=>LevelPlay?.component;
  const current=()=>Players?.currentPlayer;
  const balance=()=>Number.isSafeInteger(current()?.coin)&&current().coin>=0?current().coin:0;
  const allowedPower=p=>!!level()&&!level().PowerUpsForceHide&&(!!level().PowerUpsForceShow||(!!level().showPowerUps&&current()?.features?.feature_powerup===true))&&p?.shown;
  const required=p=>p?.mode===1||!!level()?.PowerUpsForceShow&&(!!level()?.PowerUpsTip||current()?.features?.feature_powerup!==true);
  function refresh(){const latest=native.resolve?.();if(latest){Object.assign(native,latest);({SettingWindow,Players,PowerupFingers,PlantFoodCount,SunCount,LevelPlay,CoinCount,CoinCollecterInGame,sounds,LnC,UIInGame}=native);}bindHooks();}
  function patch(obj,key,wrap) {
    if(typeof obj?.[key]!=="function")return;
    let keys=patched.get(obj);if(!keys){keys=new Set();patched.set(obj,keys);}if(keys.has(key))return;keys.add(key);
    const original=obj[key],replacement=wrap(original);obj[key]=replacement;
    let methods=originals.get(obj);if(!methods){methods=new Map();originals.set(obj,methods);}methods.set(key,original);
    undo.push(()=>{if(obj[key]===replacement)obj[key]=original;});
  }
  function cancel(p=PowerupFingers?.component) {
    if(!p)return;p.countDown=0;p.mousePushed=false;leases.delete(p);

    try{Promise.resolve(p.tryChangingIndex?.(-1,null,true)).catch(e=>log.warn?.(String(e)));}catch(e){log.warn?.(String(e));}
  }
  function syncCoin(value,animate=false) {
    const c=CoinCount?.component;

    if(c&&c.isValid!==false) {c._value=value;if(!animate)c.shownValue=value;}
  }
  function revealWallet() {
    const collector=CoinCollecterInGame?.component;


    if(collector?.node&&collector.isValid!==false)collector.hidden=false;
  }
  function rejected() {
    const now=globalThis.performance?.now?.()??Date.now();
    if(now-lastRejected<350)return;lastRejected=now;
    try{revealWallet();sounds?.playCardChooseFailed?.();}catch(error){log.warn?.(`Отклик покупки: ${String(error?.message??error)}`);}
  }
  function purchaseFeedback() {
    try{revealWallet();const clip=CoinCount?.component?.coinCollectSound;if(clip)sounds?.playOneShot?.(clip,1,.1);}catch(error){log.warn?.(`Отклик покупки: ${String(error?.message??error)}`);}
  }
  function debit(price) {
    refresh();if(busy||!validPrice(price)||!Players?.savePP)return false;
    const p=current(),index=Players.allPlayers?.indexOf(p),old=balance(),storage=cc.sys?.localStorage;
    if(!p||index<0||!storage?.getItem)return false;
    if(old<price){rejected();return false;}
    busy=true;let checkpoint;
    try {
      checkpoint=storage.getItem(native.profileKey??"PvZ2_PlayerProperties");
      p.coin=old-price;
      const result=Players.savePP();
      if(result===false||result?.then)throw Error("не подтверждено синхронное сохранение");
      const stored=JSON.parse(storage.getItem(native.profileKey??"PvZ2_PlayerProperties")??"null");
      if(current()!==p||stored?.[index]?.coin!==p.coin)throw Error("сохранение кошелька не подтверждено");
      syncCoin(p.coin,true);purchaseFeedback();return true;
    } catch(error) {
      p.coin=old;syncCoin(old);
      try{if(checkpoint!==null&&checkpoint!==undefined)storage.setItem(native.profileKey??"PvZ2_PlayerProperties",checkpoint);else Players.savePP();}catch(_){}
      log.warn?.(`Покупка не выполнена: ${String(error?.message??error)}`);return false;
    } finally {busy=false;}
  }
  function forceOff() {
    if(!SettingWindow)return;
    SettingWindow.allowCheat=false;
    try{const s=cc.sys?.localStorage,raw=s?.getItem("PvZ2_Settings"),v=raw&&JSON.parse(raw);if(v&&v.AllowCheats!==false)s.setItem("PvZ2_Settings",JSON.stringify({...v,AllowCheats:false}));}catch(e){log.warn?.(`Читы выключены на этот запуск: ${String(e?.message??e)}`);}
  }
  function bindHooks(){

  if(SettingWindow&&!patched.get(SettingWindow)?.has("allowCheat")) {
    let keys=patched.get(SettingWindow);if(!keys){keys=new Set();patched.set(SettingWindow,keys);}keys.add("allowCheat");
    const desc=Object.getOwnPropertyDescriptor(SettingWindow,"allowCheat");let value=SettingWindow.allowCheat;
    if(!desc||desc.configurable!==false) {
      Object.defineProperty(SettingWindow,"allowCheat",{configurable:true,enumerable:true,get:()=>locked()?false:value,set:v=>{value=locked()?false:!!v;}});
      undo.push(()=>{const v=SettingWindow.allowCheat;Object.defineProperty(SettingWindow,"allowCheat",{...(desc??{writable:true,configurable:true,enumerable:true}),value:v});});
    }
    patch(SettingWindow.prototype,"setAllowCheat",original=>function(...args){if(locked()){forceOff();return;}return original.apply(this,args);});
  }
  patch(SunCount?.prototype,"onAddDown",original=>function(...args){if(locked())return;return original.apply(this,args);});
  patch(PowerupFingers?.prototype,"powerUpStart",original=>function(...args) {
    if(this.countDown>0||busy)return;
    if(locked()&&preferences.mode!=="coins"&&!required(this)){cancel(this);return;}
    if(preferences.mode!=="coins")return original.apply(this,args);
    if(!allowedPower(this)){cancel(this);return;}
    if(required(this))return original.apply(this,args);
    const key=INDEX[this.index];if(!key||leases.has(this))return;
    if(!debit(preferences.prices[key])){cancel(this);return;}
    leases.set(this,{player:current(),index:this.index});
    return original.apply(this,args);
  });
  patch(PowerupFingers?.prototype,"tryChangingIndex",original=>function(index,...args) {
    if(index===-1&&this.countDown<=0)leases.delete(this);
    if(preferences.mode==="coins"&&index>=0&&index<=4){if(!allowedPower(this))return;if(!required(this)&&balance()<preferences.prices[INDEX[index]]){rejected();return;}}
    return original.call(this,index,...args);
  });
  patch(LnC?.prototype,"onMouseDown",original=>function(event,...args) {
    const power=PowerupFingers?.component;



    if(power?.index===4&&UIInGame?.index===-5&&event?.getButton?.()===0&&this.isInLawn?.()&&level()?.gameStarted) {
      if(locked()&&preferences.mode!=="coins"&&!required(power))return;
      if(preferences.mode==="coins"&&!required(power)) {
        if(!allowedPower(power))return;
        if(!leases.has(power)&&power.countDown<=0)power.powerUpStart();
        const lease=leases.get(power);
        if(!lease||lease.player!==current()||lease.index!==4||power.countDown<=0)return;
      }
    }
    return original.call(this,event,...args);
  });
  patch(PowerupFingers?.prototype,"show",original=>function(...args) {
    const l=level();
    if(preferences.mode!=="coins"||!l||l.PowerUpsForceHide||required(this))return original.apply(this,args);
    if(!l.showPowerUps||current()?.features?.feature_powerup!==true)return;
    if(!this.shown){this.shown=true;if(cc.tween)cc.tween(this.node).to(.3,{position:this.oldPos},{easing:"cubicOut"}).start();else this.node.setPosition?.(this.oldPos);}
  });
  patch(PlantFoodCount?.prototype,"onAddMouseDown",original=>function(event) {
    if(preferences.mode!=="coins"){if(locked())return;return original.call(this,event);}
    if(event?.getButton?.()!==0||!this.shown||!level()?.showPlantfood||current()?.features?.feature_plantfood!==true||this.plantFoodNum>=this.maxCount)return;
    const time=globalThis.performance?.now?.()??Date.now();
    if(busy||time-lastFood<250||(event&&events.has(event)))return;
    if(event&&typeof event==="object")events.add(event);
    if(!debit(preferences.prices.food))return;
    lastFood=time;

    this.plantFoodAdd();
  });


  patch(PlantFoodCount?.prototype,"_show",original=>function(...args) {
    const pos=foodPositions.get(this)??this.addButton?.position?.clone?.();const result=original.apply(this,args);
    if(preferences.mode==="coins"&&pos&&this.addButton){placeFoodPurchase(this.addButton,pos);this.addButton.active=true;}
    return result;
  });
  patch(PlantFoodCount?.prototype,"onLoad",original=>function(...args){const result=original.apply(this,args);if(this.addButton?.position?.clone)foodPositions.set(this,this.addButton.position.clone());return result;});
  }
  bindHooks();
  const shiftedFoodButtons=new Set();
  function placeFoodPurchase(button,pos) {
    const parentScale=Math.max(.001,Math.abs(Number(button.parent?.worldScale?.x)||1));
    button.setPosition(pos.x-8/parentScale,pos.y,pos.z);shiftedFoodButtons.add(button);
  }
  function bindExistingCallback(instance,key,button) {
    const original=instance&&originals.get(Object.getPrototypeOf(instance))?.get(key),event=cc.Node?.EventType?.MOUSE_DOWN;
    if(!original||!button?.on||!event||boundCallbacks.has(instance))return;


    const wrapped=instance[key];button.off(event,original,instance);button.off(event,wrapped,instance);button.on(event,wrapped,instance);boundCallbacks.add(instance);
    undo.push(()=>{if(button.isValid!==false){button.off(event,wrapped,instance);button.on(event,original,instance);}});
  }
  function remember(node) {if(!node||nodes.has(node))return;const p=node.position?.clone?.();nodes.set(node,{active:node.active,position:p});}
  function badge(parent,name) {
    if(!parent||!cc.Node||!cc.Label||!cc.Graphics)return null;
    let item=badges.get(parent);if(item)return item;
    const node=new cc.Node("PaidPowerCost"),ui=node.addComponent(cc.UITransform);node.parent=parent;node.layer=parent.layer;node.__rffOwnedFont=true;
    const width=110,height=36;ui.setContentSize(width,height);
    const g=node.addComponent(cc.Graphics);g.lineWidth=4;g.strokeColor=new cc.Color(49,67,55,255);g.fillColor=new cc.Color(247,239,199,255);g.roundRect(-width/2,-height/2,width,height,9);g.fill();g.stroke();
    const caption=new cc.Node("Cost"),label=caption.addComponent(cc.Label);caption.parent=node;caption.layer=node.layer;caption.__rffOwnedFont=true;
    caption.addComponent(cc.UITransform).setContentSize(100,height);
    label.useSystemFont=true;label.fontFamily="GardendlessRussianBalsamiqBold";label.fontSize=30;label.lineHeight=34;label.overflow=1;label.enableWrapText=false;label.horizontalAlign=1;label.verticalAlign=1;label.color=new cc.Color(0,0,0,255);
    const nativeFont=CoinCount?.component?.showerLabel?.font;
    if(nativeFont){label.font=nativeFont;label.useSystemFont=false;}
    item={node,label,name,icon:null,graphics:g,opacity:node.addComponent(cc.UIOpacity)};badges.set(parent,item);return item;
  }
  function priceBadge(parent,key,available) {
    const b=badge(parent,key);if(!b)return;
    b.node.active=preferences.mode==="coins";
    const ui=parent.getComponent?.(cc.UITransform),height=ui?.height??146;


    b.node.setScale(1,1,1);b.node.setPosition(0,-height*.43,0);
    b.label.string=String(preferences.prices[key]);b.opacity.opacity=available?255:120;
    if(preferences.mode==="coins"&&cc.UIOpacity){let s=visuals.get(parent);if(!s){let opacity=parent.getComponent(cc.UIOpacity),owned=!opacity;if(!opacity)opacity=parent.addComponent(cc.UIOpacity);s={opacity,owned,before:opacity.opacity};visuals.set(parent,s);}s.opacity.opacity=available?s.before:155;}
  }
  function bindFeedback(button,key,owner) {
    const node=button.node;if(feedback.has(node))return;
    const s={base:node.scale.clone(),button,key,owner,hover:false,tween:null,handlers:[]};feedback.set(node,s);
    const enabled=()=>!disposed&&node.activeInHierarchy!==false&&button.interactable&&owner.shown&&owner.countDown<=0;
    const animate=value=>{s.tween?.stop?.();if(node.isValid===false)return;const target=new cc.Vec3(s.base.x*value,s.base.y*value,s.base.z);if(cc.tween)s.tween=cc.tween(node).to(.09,{scale:target},{easing:"quadOut"}).start();else node.setScale(target);};
    const bind=(event,fn)=>{if(!event)return;node.on(event,fn);s.handlers.push([event,fn]);};
    const events=cc.Node.EventType;
    bind(events.MOUSE_ENTER,()=>{s.hover=true;if(enabled())animate(1.045);});
    bind(events.MOUSE_LEAVE,()=>{s.hover=false;animate(1);});
    bind(events.MOUSE_DOWN,event=>{if(event?.getButton?.()!==0)return;if(enabled())animate(.96);else if(preferences.mode==="coins"&&allowedPower(owner)&&owner.countDown<=0&&balance()<preferences.prices[key])rejected();});
    bind(events.MOUSE_UP,()=>animate(enabled()&&s.hover?1.045:1));
    s.reset=()=>{s.hover=false;animate(1);};
    s.dispose=()=>{s.tween?.stop?.();if(node.isValid!==false){for(const [event,fn]of s.handlers)node.off(event,fn);node.setScale(s.base);}};
  }
  function scan() {
    if(disposed)return;refresh();
    if(current()!==profile){cancel();profile=current();lastFood=-Infinity;}
    if(lastMode!==preferences.mode){cancel();lastMode=preferences.mode;lastFood=-Infinity;}
    if(locked())forceOff();else if(lastLock)forceOff();lastLock=locked();
    const scene=cc.director?.getScene?.();
    const sw=SettingWindow&&scene?.getComponentsInChildren?.(SettingWindow)?.[0];const option=sw?.allowCheatSprite?.node;
    if(option){remember(option);option.active=locked()?false:nodes.get(option).active;if(!SettingWindow.allowCheat&&cc.Color)sw.allowCheatSprite.color=new cc.Color(255,0,0,255);}
    const sun=SunCount?.component?.addButton;if(sun){bindExistingCallback(SunCount.component,"onAddDown",sun);remember(sun);sun.active=locked()?false:nodes.get(sun).active;}
    const p=PowerupFingers?.component,food=PlantFoodCount?.component,paid=preferences.mode==="coins";
    if(p&&p.isValid!==false){
      if(locked()&&!paid&&!required(p))p.hide?.();
      if(paid&&!level()?.PowerUpsForceHide&&!required(p))p.show?.();
      if(paid&&required(p))for(const prop of ["fireButton","snowButton","tossButton","zapButton","cherryButton"]){const b=badges.get(p[prop]?.node);if(b)b.node.active=false;}
      if(!paid||!required(p))for(const [key,prop] of [["flame","fireButton"],["snow","snowButton"],["toss","tossButton"],["zap","zapButton"],["cherry","cherryButton"]]) {
        const button=p[prop];if(!button?.node)continue;
        bindFeedback(button,key,p);
        const available=allowedPower(p)&&balance()>=preferences.prices[key];
        priceBadge(button.node,key,available);if(paid)button.interactable=p.countDown>0?false:available;
      }


    }
    if(food?.addButton){bindExistingCallback(food,"onAddMouseDown",food.addButton);remember(food.addButton);if(!foodPositions.has(food)&&food.addButton.position?.clone){const pos=food.addButton.position.clone();if(food.shown&&pos.x<-800&&pos.y>800){pos.x+=1000;pos.y-=1000;}foodPositions.set(food,pos);}if(paid){const pos=foodPositions.get(food);if(pos)placeFoodPurchase(food.addButton,pos);food.addButton.active=!!food.shown&&!!level()?.showPlantfood&&current()?.features?.feature_plantfood===true;priceBadge(food.addButton,"food",balance()>=preferences.prices.food&&food.plantFoodNum<food.maxCount);}else {if(shiftedFoodButtons.delete(food.addButton)){const pos=foodPositions.get(food);if(pos)food.addButton.setPosition(pos);}const b=badges.get(food.addButton);if(b)b.node.active=false;food.addButton.active=locked()?false:nodes.get(food.addButton).active;}}
    for(const [parent,b] of badges)if(parent.isValid===false){b.node.destroy?.();badges.delete(parent);}else if(!paid)b.node.active=false;
    for(const [node,s]of feedback)if(node.isValid===false){s.tween?.stop?.();feedback.delete(node);}else if(!s.button.interactable&&s.hover)s.reset();
    for(const [node,s] of visuals)if(node.isValid!==false&&(!paid||required(p)&&node!==food?.addButton))s.opacity.opacity=s.before;
  }
  function persist(){try{globalThis.localStorage?.setItem(KEY,JSON.stringify(preferences));}catch(e){log.warn?.(`Настройки усилений не сохранены: ${String(e)}`);}}
  return {preferences,scan,debit,cancel,balance,setMode(v){preferences.mode=v==="coins"?"coins":v==="off"?"off":"native";preferences.block=preferences.mode==="off";cancel();forceOff();persist();scan();},setBlock(v){this.setMode(v?"off":"native");},resetPrices(){Object.assign(preferences.prices,DEFAULT_PRICES);persist();scan();},setPrice(k,v){if(k in DEFAULT_PRICES&&validPrice(v)){preferences.prices[k]=Number(v);persist();scan();return true;}return false;},dispose(){if(disposed)return;cancel();disposed=true;for(const s of feedback.values())s.dispose();feedback.clear();for(const b of badges.values())b.node.destroy?.();for(const [node,s] of visuals)if(node.isValid!==false){s.opacity.opacity=s.before;if(s.owned)s.opacity.destroy?.();}for(const [node,s] of nodes)if(node.isValid!==false){node.active=s.active;if(s.position)node.setPosition(s.position);}for(const restore of undo.reverse())restore();}};
}

const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const comp=(node,cc,type)=>{try{return node?.getComponent?.(cc[type]??`cc.${type}`);}catch(_){return null;}};
const walk=root=>{const result=[];const visit=x=>{if(!x)return;result.push(x);for(const c of x.children??[])visit(c);};visit(root);return result;};
export function createUiController(cc,native={},log={}) {
  const saved=new Map(),undo=[],shopGeometry=new WeakMap(),commodityGeometry=new WeakMap(),boundZen=new WeakSet(),gardenViews=new WeakMap();let disposed=false;
  function own(node) {
    if(!node)return null;if(saved.has(node))return saved.get(node);
    const ui=comp(node,cc,"UITransform"),w=comp(node,cc,"Widget"),l=comp(node,cc,"Layout");
    const s={position:node.position?.clone?.()??{...node.position},scale:node.scale?.clone?.()??{...node.scale},size:ui?[ui.width,ui.height]:null,widget:w,widgetEnabled:w?.enabled,layout:l,layoutEnabled:l?.enabled,layoutAffectedByScale:l?.affectedByScale,sibling:node.getSiblingIndex?.()};saved.set(node,s);return s;
  }
  function free(node) {const s=own(node);if(s?.widget)s.widget.enabled=false;return s;}
  function world(node,x,y) {free(node);node.setWorldPosition?.(x,y,n(node.worldPosition?.z));}
  function rect(node) {const ui=comp(node,cc,"UITransform");if(!ui)return null;const p=node.worldPosition??node.position,s=node.worldScale??node.scale,a=ui.anchorPoint??{x:.5,y:.5},w=ui.width*s.x,h=ui.height*s.y;return{left:p.x-w*a.x,right:p.x+w*(1-a.x),bottom:p.y-h*a.y,top:p.y+h*(1-a.y),width:w,height:h};}
  function overview(zen) {
    const garden=zen.currentZen,scalar=zen.zenParent?.parent,canvas=walk(zen.node).find(x=>x.name==="Canvas")??zen.node;
    const screen=rect(canvas),gUi=comp(garden?.node,cc,"UITransform");
    if(!garden?.node||!scalar||!screen||!gUi)return;


    const points=(garden.slots??[]).map(slot=>slot.node??slot).filter(x=>x?.worldPosition).map(x=>{const p=gUi.convertToNodeSpaceAR(x.worldPosition);return{x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100};});
    let left,right,bottom,top;
    const lowerMargin=/Beach/i.test(garden.node.name)?120:130;
    if(points.length){left=Math.min(...points.map(p=>p.x))-155;right=Math.max(...points.map(p=>p.x))+155;bottom=Math.min(...points.map(p=>p.y))-lowerMargin;top=Math.max(...points.map(p=>p.y))+230;}
    else {left=garden.SW?.x;right=garden.NE?.x;bottom=garden.SW?.y;top=garden.NE?.y;}
    if(![left,right,bottom,top].every(Number.isFinite)||right<=left||top<=bottom)return;
    const nodes=walk(canvas),hud=nodes.filter(x=>x.activeInHierarchy!==false&&/^(CoinCount|GemCount|SproutCount|PlantCount|ShovelButton|GloveButton|CartButton|returnButton|NextZenButton|QuickShovel|MedalsButton)$/.test(x.name)).map(rect).filter(Boolean);


    const safe={left:screen.left+12,right:screen.right-12,bottom:screen.bottom+8,top:screen.top-8};
    const gs=garden.node.scale,ss=scalar.parent?.worldScale??{x:1,y:1};
    const sx=Math.abs(gs.x*ss.x),sy=Math.abs(gs.y*ss.y);
    const key=JSON.stringify([screen,hud,sx,sy,points]);const cached=gardenViews.get(garden.node);
    if(cached?.key===key){scalar.setScale(cached.zoomX,cached.zoomY,1);zen._scale=cached.zoomX;zen.zenParent.setWorldPosition(cached.x,cached.y,cached.z);zen._pos=new cc.Vec2(cached.x-scalar.worldPosition.x,cached.y-scalar.worldPosition.y);return;}
    const maxX=Math.min(1.8,(safe.right-safe.left)/((right-left)*sx)),maxY=Math.min(1.8,(safe.top-safe.bottom)/((top-bottom)*sy));
    let zoom=Math.min(maxX,maxY);
    if(!Number.isFinite(zoom)||zoom<=0)return;
    const origin=scalar.worldPosition,centerX=(left+right)/2*gs.x+n(garden.node.position?.x),centerY=(bottom+top)/2*gs.y+n(garden.node.position?.y);
    const middleX=(screen.left+screen.right)/2,middleY=(safe.bottom+safe.top)/2;
    const bg=garden.node.getChildByName?.("BG"),bu=comp(bg,cc,"UITransform");
    let placement=null,bestScore=Infinity;
    if(bg&&bu){


      const beach=/Beach/i.test(garden.node.name),bw=beach?2048:bu.width,bh=beach?1024:bu.height;
      const bx=n(bg.position?.x),by=n(bg.position?.y),bs=bg.scale;
      const back={left:bx-bw*Math.abs(bs.x)/2,right:bx+bw*Math.abs(bs.x)/2,bottom:by-bh*Math.abs(bs.y)/2,top:by+bh*Math.abs(bs.y)/2};



      const coverX=screen.width/((back.right-back.left)*sx),coverY=screen.height/((back.top-back.bottom)*sy),cover=Math.max(coverX,coverY);
      const solve=(zx,zy)=>{
        const xl=Math.max(safe.left-left*sx*zx,screen.right-back.right*sx*zx),xr=Math.min(safe.right-right*sx*zx,screen.left-back.left*sx*zx);
        const yl=Math.max(safe.bottom-bottom*sy*zy,screen.top-back.top*sy*zy),yr=Math.min(safe.top-top*sy*zy,screen.bottom-back.bottom*sy*zy);
        if(xl>xr||yl>yr)return;
        const tx=Math.max(xl,Math.min(xr,middleX-(left+right)/2*sx*zx)),ty=Math.max(yl,Math.min(yr,middleY-(bottom+top)/2*sy*zy));
        const clear=(x,y)=>!points.some(p=>hud.some(h=>x+(p.x+155)*sx*zx>h.left-12&&x+(p.x-155)*sx*zx<h.right+12&&y+(p.y+230)*sy*zy>h.bottom-12&&y+(p.y-lowerMargin)*sy*zy<h.top+12));
        const candidates=[tx,...Array.from({length:21},(_,j)=>xl+(xr-xl)*j/20)].sort((a,b)=>Math.abs(a-tx)-Math.abs(b-tx));
        for(const x of candidates)for(const y of [ty,yl,yr]){
          const offset=x+(left+right)/2*sx*zx-middleX,score=Math.abs(offset)*5+Math.abs(y+(bottom+top)/2*sy*zy-middleY)*.1-Math.min(zx,zy)*20+Math.abs(Math.log(zx/zy))*100;
          if(score<bestScore&&clear(x,y)){placement={zx,zy,x,y};bestScore=score;}
        }
      };
      for(let i=0;i<=120&&zoom>=cover;i++){
        const z=zoom-(zoom-cover)*i/120;solve(z,z);
      }




      if(!placement&&coverX<=maxX&&coverY<=maxY)for(let ix=0;ix<=16;ix++)for(let iy=0;iy<=16;iy++)solve(maxX-(maxX-coverX)*ix/16,maxY-(maxY-coverY)*iy/16);
    }
    const collides=z=>points.some(p=>{const x=middleX+(p.x-(left+right)/2)*sx*z,y=middleY+(p.y-(bottom+top)/2)*sy*z;return hud.some(h=>x+155*sx*z>h.left-12&&x-155*sx*z<h.right+12&&y+230*sy*z>h.bottom-12&&y-lowerMargin*sy*z<h.top+12);});


    if(!placement&&collides(zoom)){const largest=zoom;for(let i=1;i<=150;i++){zoom=largest*(1-i/200);if(!collides(zoom))break;}}
    const zoomX=placement?.zx??zoom,zoomY=placement?.zy??zoom;
    own(scalar);free(zen.zenParent);
    scalar.setScale(zoomX,zoomY,1);zen._scale=zoomX;
    const x=placement?placement.x-n(garden.node.position?.x)*ss.x*zoomX:middleX-centerX*ss.x*zoomX,y=placement?placement.y-n(garden.node.position?.y)*ss.y*zoomY:middleY-centerY*ss.y*zoomY;
    zen.zenParent.setWorldPosition?.(x,y,n(origin.z)+10);
    zen._pos=new cc.Vec2(x-origin.x,y-origin.y);
    gardenViews.set(garden.node,{key,zoomX,zoomY,x,y,z:n(origin.z)+10});
  }
  function bindZen(){
  const zen=native.Zen?.prototype;if(!zen||boundZen.has(zen))return;boundZen.add(zen);
  for(const key of ["scale","pos"]) {
    const descriptor=zen&&Object.getOwnPropertyDescriptor(zen,key);
    if(!descriptor?.set||descriptor.configurable===false)continue;
    Object.defineProperty(zen,key,{...descriptor,set(value){overview(this);}});
    undo.push(()=>Object.defineProperty(zen,key,descriptor));
  }
  if(typeof zen?.switchZen==="function") {
    const original=zen.switchZen;zen.switchZen=function(...args){const result=original.apply(this,args);overview(this);if(result?.then)return result.then(value=>{overview(this);return value;});return result;};
    undo.push(()=>{zen.switchZen=original;});
  }
  }
  bindZen();
  function shop(nodes,canvas) {
    const store=nodes.find(x=>x.name==="Store"),pages=store&&walk(store).find(x=>x.name==="Pages"),close=store&&walk(store).find(x=>x.name==="almanacButton");
    const bounds=canvas&&rect(canvas);if(!store||!pages||!close||!bounds)return;
    const widgets=own(pages);if(widgets.layout)widgets.layout.enabled=false;
    const tabs=pages.children.filter(x=>/^Page/.test(x.name));
    const width=Math.min(1024,bounds.width),left=(bounds.left+bounds.right-width)/2;
    const top=bounds.top-12,frame=walk(store).find(x=>x.name==="windowCommon"),frameTop=rect(frame)?.top??top-66;

    world(pages,left+35,frameTop);
    tabs.forEach((tab,i)=>{const s=free(tab);tab.setPosition?.((i*70+32)/Math.abs(pages.worldScale.x),s.position.y,s.position.z);});
    const right=left+width-36,closeHeight=rect(close)?.height??70;
    world(close,right-38,frameTop+closeHeight/2-5);
    const currency=nodes.filter(x=>/^(CoinCount|GemCount|TicketCount)$/.test(x.name)&&x.parent===store.parent);
    for(const [i,name] of ["CoinCount","GemCount","TicketCount"].entries()) {
      const c=currency.find(x=>x.name===name);if(!c)continue;
      const s=own(c);c.setScale?.(s.scale.x*.88,s.scale.y*.88,s.scale.z);world(c,right-76-24-(2-i)*118-52,top-17);
      const index=store.getSiblingIndex?.()+1+i;if(Number.isInteger(index))c.setSiblingIndex?.(index);
    }


    const scroll=walk(store).find(x=>x.name==="ScrollView"),view=scroll&&walk(scroll).find(x=>x.name==="view"),cards=view&&walk(view).find(x=>x.name==="cards");
    if(!scroll||!view||!cards)return;
    const sr=rect(scroll);if(!sr)return;
    const previous=shopGeometry.get(scroll),desiredTop=top-110;
    const bottom=previous?.bottom??sr.bottom,height=Math.max(150,desiredTop-bottom);
    const key=[width,height,left,bounds.top,scroll.worldScale.x,scroll.worldScale.y].join(":");
    let factor=previous?.factor??1;
    if(previous?.key!==key){
      const c=own(cards),oldViewWidth=comp(view,cc,"UITransform")?.width??0;
      const offset=previous?n(cards.position.x)+oldViewWidth/2:0;
      free(scroll);const scrollUi=comp(scroll,cc,"UITransform");scrollUi?.setContentSize?.(sr.width/Math.abs(scroll.worldScale.x),height/Math.abs(scroll.worldScale.y));world(scroll,(sr.left+sr.right)/2,(desiredTop+bottom)/2);
      free(view);const viewUi=comp(view,cc,"UITransform");viewUi?.setContentSize?.(scrollUi.width,scrollUi.height);view.setPosition?.(0,0,n(view.position?.z));
      free(cards);const contentUi=comp(cards,cc,"UITransform");contentUi?.setContentSize?.(contentUi.width,viewUi.height);
      factor=Math.min(1,viewUi.height/(c.size?.[1]??1326.34));


      cards.setScale?.(c.scale);if(c.layout){c.layout.affectedByScale=true;c.layout.enabled=true;}
      cards.setPosition?.(-viewUi.width/2+offset*factor/(previous?.factor??factor),viewUi.height/2,n(c.position.z));
      shopGeometry.set(scroll,{key,factor,bottom});
    }
    for(const card of cards.children??[]){const c=own(card);card.setScale?.(c.scale.x*factor,c.scale.y*factor,c.scale.z);}
    comp(cards,cc,"Layout")?.updateLayout?.();

  }
  function arcade(nodes) {
    for(const row of nodes.filter(x=>x.name==="gem"&&walk(x.parent?.parent?.parent).some(x=>x.name==="ArcadeWindow"))) {
      const left=row.getChildByName?.("LabelL"),middle=row.getChildByName?.("LabelM"),icon=row.getChildByName?.("icon_gem"),right=row.getChildByName?.("LabelR");
      if(!left||!middle||!icon||!right)continue;
      const state=own(row);if(state.layout)state.layout.enabled=false;
      const go=row.parent?.getChildByName?.("Go"),goRect=go&&rect(go),rowScale=Math.abs(row.worldScale.x);
      const width=Math.min(1020,goRect?(goRect.left-row.worldPosition.x-24)/rowScale:1020);
      const numberWidth=Math.max(150,n(comp(middle,cc,"UITransform")?.width)*1.1),iconWidth=n(comp(icon,cc,"UITransform")?.width,88.3)*1.1;
      const tail=45,gap=12,caption=Math.max(220,width-numberWidth-iconWidth-tail-gap*3);
      for(const [node,w] of [[left,caption],[right,tail]]){const label=comp(node,cc,"Label");own(node);if(label)label.__rffArcadeReward={width:w,height:node===left?150:110,maxLines:node===left?2:1};}
      comp(row,cc,"UITransform")?.setContentSize?.(width,140);


      let x=0;for(const [node,w] of [[left,caption],[middle,numberWidth],[icon,iconWidth],[right,tail]]){own(node);node.setPosition?.(x+w/2,0,n(node.position?.z));x+=w+gap;}
    }
  }
  function insetWidget(node,edges,sign=1,amount=8) {
    const widget=comp(node,cc,'Widget');if(!widget?.enabled)return;
    const state=own(node),target=widget.target??node.parent,targetUi=comp(target,cc,'UITransform'),targetScale=target?.worldScale??{x:1,y:1};
    for(const edge of edges) {
      const suffix=edge[0].toUpperCase()+edge.slice(1);if(!widget['isAlign'+suffix])continue;
      const horizontal=edge==='left'||edge==='right';
      const unit=Math.abs(targetScale[horizontal?'x':'y'])*(widget['isAbsolute'+suffix]?1:n(targetUi?.[horizontal?'width':'height']));
      if(!(unit>0))continue;
      state.widgetInsets??={};if(state.widgetInsets[edge]===undefined)state.widgetInsets[edge]=widget[edge];
      widget[edge]=state.widgetInsets[edge]+amount*sign/unit;
    }
    widget.updateAlignment?.();
  }
  function gameButtonInsets(nodes) {
    const current=native.UIInGame?.component;
    const pause=current?.pauseButton?.node??nodes.find(node=>node.name==='pause'&&node.parent?.name==='Canvas');
    const speed=current?.s2xButton?.node??nodes.find(node=>node.name==='2x'&&node.parent?.name==='UIInGameUpper');
    for(const node of new Set([pause,speed])) {
      if(!node||!nodes.includes(node))continue;
      insetWidget(node,['right','top']);
    }
    const shovelControl=native.ShovelUIController?.shovelUI;
    const shovel=shovelControl?.node??nodes.find(node=>node.name==='Shovel'&&node.parent?.name==='UIInGame');
    if(shovel&&nodes.includes(shovel)&&shovel.activeInHierarchy!==false&&shovelControl?.gameStarted!==false&&Math.abs(shovel.worldPosition?.x??0)<2000) {
      insetWidget(shovel,['right'],1,12);
      const key=shovelControl?.KeyTip?.node,offset=shovelControl?.keyOffset;
      if(key&&nodes.includes(key)&&offset){own(key).preserveNativeScale=true;key.setWorldPosition?.(shovel.worldPosition.x+offset.x,shovel.worldPosition.y+offset.y,shovel.worldPosition.z+offset.z);}
    }
  }
  function levelCaption(nodes,canvas) {
    const labelNode=nodes.find(node=>node.name==='levelName'&&node.parent?.name==='UIInGameUpper'),label=comp(labelNode,cc,'Label'),screen=canvas&&rect(canvas);
    if(!label)return;
    const reset=()=>{delete label.__rffLevelCaption;const state=saved.get(labelNode);if(state?.levelCaptionMoved){labelNode.setPosition(state.position);if(state.widget)state.widget.enabled=state.widgetEnabled;state.levelCaptionMoved=false;}};
    if(!screen||!/[А-Яа-яЁё]/.test(label.string)){reset();return;}
    const state=own(labelNode),centerY=labelNode.worldPosition.y;
    const sameRow=r=>r&&centerY>=r.bottom-25&&centerY<=r.top+25;
    const power=native.PowerupFingers?.component;
    const buttons=power&&power.node?.activeInHierarchy!==false?['fireButton','snowButton','tossButton','zapButton','cherryButton'].map(key=>power[key]?.node).filter(Boolean):nodes.filter(node=>/^Powerup_(Snow|Toss|Zap|Flame|Cherry)$/.test(node.name));
    const leftItems=buttons.filter(node=>node.activeInHierarchy!==false).map(node=>{const r=rect(node);if(!r)return null;const s=own(node),xs=Math.abs(node.parent?.worldScale?.x??1),ui=comp(node,cc,'UITransform');s.captionScaleX=Math.max(s.captionScaleX??Math.abs(s.scale.x),Math.abs(node.scale.x));const width=n(ui?.width)*s.captionScaleX*xs;return {...r,left:node.worldPosition.x-width/2,right:node.worldPosition.x+width/2};}).filter(sameRow);
    const rightItems=nodes.filter(node=>node.activeInHierarchy!==false&&node.parent===labelNode.parent&&/^(levelProgress|zombossProgress|beghouledProgress|fightaloneProgress|CountDownProgress)$/.test(node.name)).map(rect).filter(sameRow);
    if(!leftItems.length||!rightItems.length){reset();return;}
    const left=Math.max(screen.left,...leftItems.map(r=>r.right))+16,right=Math.min(screen.right,...rightItems.map(r=>r.left))-16;
    if(right-left<80){reset();return;}
    const anchor=comp(labelNode,cc,'UITransform')?.anchorPoint?.x??.5,scaleX=Math.abs(labelNode.worldScale.x),width=(right-left)/scaleX;
    world(labelNode,left+(right-left)*anchor,centerY);state.levelCaptionMoved=true;
    label.__rffLevelCaption={width,height:state.size?.[1]??106.69};
  }
  function scan() {
    if(disposed)return;
    try {
      const latest=native.resolve?.();if(latest)Object.assign(native,latest);bindZen();
      const scene=cc.director?.getScene?.(),nodes=walk(scene),canvas=nodes.find(x=>x.name==="Canvas");
      gameButtonInsets(nodes);
      levelCaption(nodes,canvas);
      if(/store/i.test(scene?.name??"")||nodes.some(x=>x.name==="Store"))shop(nodes,canvas);
      arcade(nodes);
      const z=native.Zen&&scene?.getComponentsInChildren?.(native.Zen)?.[0];
      if(z||/zenGardenScene/i.test(scene?.name??'')) {
        for(const node of nodes.filter(x=>/^(CoinCount|GemCount|SproutCount|PlantCount|returnButton)$/.test(x.name)||x.name==='Buttons'&&x.parent?.name==='UI'))insetWidget(node,['left','right','top']);
        const medal=nodes.find(x=>x.name==='MedalsButton');if(medal){insetWidget(medal,['left'],-1);insetWidget(medal,['right','top']);}
      }
      for(const caption of nodes.filter(x=>x.name==="LevelInGameName")) {
        const label=comp(caption,cc,"Label");if(!label||!/[А-Яа-яЁё]/.test(label.string))continue;
        const card=caption.parent;if(card?.name!=="Level")continue;
        const state=own(card),size=comp(card,cc,"UITransform");if(size&&state.size)size.setContentSize(state.size[0],Math.max(state.size[1],174));
        for(const [name,offset] of [["LevelName",18],["WrittenBy",-17]]){const node=card.getChildByName?.(name);if(node){const s=free(node);node.setPosition(s.position.x,s.position.y+offset,s.position.z);}}
        const s=free(caption);caption.setPosition(s.position.x,-18,s.position.z);
        label.__rffFanmadeTitle={width:Math.min(660,state.size?.[0]*.68??660),height:100};
      }
      for(const root of nodes.filter(x=>x.name==="LODEntrance")) {
        const s=own(root);root.setPosition?.(s.position.x,s.position.y+8,s.position.z);
        const animal=walk(root).find(x=>x.name==="icon_L");if(animal){const a=own(animal);animal.setScale?.(a.scale.x*.85,a.scale.y*.85,a.scale.z);animal.setPosition?.(a.position.x,a.position.y-2,a.position.z);}
      }


      const almanac=nodes.find(x=>x.name==="Almanac"),exit=almanac&&walk(almanac).find(x=>x.name==="almanacButton"),medals=nodes.find(x=>x.name==="MedalsButton");
      if(exit&&medals){const e=rect(exit),m=own(medals),art=walk(medals).find(x=>x.name==="medal"),a=art&&rect(art),r=rect(medals);if(e&&r){const artworkWidth=Math.max(r.width,a?.width??0);world(medals,e.left-16-artworkWidth/2,(e.bottom+e.top)/2);}}
      const shovel=nodes.find(x=>x.name==="ShovelButton"),toggle=nodes.find(x=>x.name==="QuickShovel");
      if(shovel&&toggle) {
        own(toggle);const p=shovel.worldPosition,s=shovel.parent.worldScale;
        world(toggle,p.x+50.87*s.x,p.y-32.0725*s.y);
        const tip=walk(toggle).find(x=>x.name==="ToolTip"),label=comp(tip,cc,"Label");
        const russian=!native.MultiLanguage||(Number.isInteger(native.LanguageEnum?.RU)&&native.MultiLanguage.currentLanguage===native.LanguageEnum.RU);
        if(label&&label.string==="Fast Shovel"&&russian)label.string="Быстрая лопата";
      }
      if(z||/zenGardenScene/i.test(scene?.name??""))for(const count of nodes.filter(x=>/^(CoinCount|GemCount|SproutCount|PlantCount)$/.test(x.name))){
        const s=own(count);


        if(s.widget?.isAlignBottom){if(s.widgetBottom===undefined)s.widgetBottom=s.widget.bottom;s.widget.bottom=s.widgetBottom+12/Math.abs(count.parent.worldScale.y);s.widget.updateAlignment?.();}
        else count.setPosition(count.position.x,s.position.y+12/Math.abs(count.parent.worldScale.y),count.position.z);
      }
      if(z?.currentZen?.node)overview(z);
      for(const c of native.Commodity?scene?.getComponentsInChildren?.(native.Commodity)??[]:[]) {
        const label=c.buyButtonLabel,black=c.buyButtonSprite?.node;
        if(!label?.node||!black)continue;
        const layout=comp(black,cc,"Layout"),card=rect(c.node),buttonUi=comp(black,cc,"UITransform");
        let geometry=commodityGeometry.get(black);
        const soldout=c.soldout===true;
        if(card&&buttonUi&&layout&&(layout.resizeMode===1||geometry)) {
          if(!geometry){const state=own(black);geometry={state,fixed:false};commodityGeometry.set(black,geometry);}
          const icon=label.node.getChildByName?.("Icon");
          if(soldout) {
            if(!geometry.fixed){geometry.size=[buttonUi.width,buttonUi.height];geometry.position=black.position.clone();}
            geometry.fixed=true;layout.enabled=false;
            buttonUi.setContentSize(card.width*.65/Math.abs(black.worldScale.x),geometry.size[1]);
            world(black,(card.left+card.right)/2,black.worldPosition.y);
            if(icon){const state=own(icon);if(state.restoreActive===undefined){state.active=icon.active;state.restoreActive=true;}icon.active=false;}
          } else if(geometry.fixed) {
            geometry.fixed=false;buttonUi.setContentSize(...geometry.size);black.setPosition(geometry.position);layout.enabled=geometry.state.layoutEnabled;
            const caption=own(label.node);if(caption.size)comp(label.node,cc,"UITransform")?.setContentSize(...caption.size);label.node.setPosition(caption.position);
            if(icon){const state=saved.get(icon);if(state?.restoreActive)icon.active=state.active;}
          }
        }
        const r=rect(black),s=label.node.worldScale;if(!r||!s)continue;

        free(label.node);world(label.node,(r.left+r.right)/2,(r.bottom+r.top)/2);
        label.horizontalAlign=1;
        label.__rffStorePrice={width:r.width*.82/Math.abs(s.x),height:r.height*.74/Math.abs(s.y)};
      }
    } catch(error) {log.warn?.(`Расположение интерфейса: ${String(error?.message??error)}`);}
  }
  return {scan,dispose(){if(disposed)return;disposed=true;for(const restore of undo.reverse())restore();for(const [node,s] of saved)if(node.isValid!==false){const l=comp(node,cc,"Label");if(l){delete l.__rffStorePrice;delete l.__rffArcadeReward;delete l.__rffFanmadeTitle;delete l.__rffLevelCaption;}if(s.size)comp(node,cc,"UITransform")?.setContentSize?.(...s.size);if(!s.preserveNativeScale)node.setScale?.(s.scale);node.setPosition?.(s.position);if(s.restoreActive)node.active=s.active;if(s.widget){if(s.widgetBottom!==undefined)s.widget.bottom=s.widgetBottom;if(s.widgetInsets)Object.assign(s.widget,s.widgetInsets);s.widget.enabled=s.widgetEnabled;if(s.widgetBottom!==undefined||s.widgetInsets)s.widget.updateAlignment?.();}if(s.layout){s.layout.enabled=s.layoutEnabled;s.layout.affectedByScale=s.layoutAffectedByScale;}if(s.sibling!==undefined)node.setSiblingIndex?.(s.sibling);}saved.clear();}};
}

export function createFontPreview(cc,resources={},log={},config={}) {
  const doc=globalThis.document;
  if(!doc?.createElement)return {start(){},dispose(){}};
  let root,canvas,renderRoot,camera,texture,labels=[],signature='',pending=false,disposed=false,warned=false,observer,started=false;
  const slots=config.slots??[],options=config.options??[];
  const width=860,height=slots.length*196,layer=1<<24;
  const buttonSpacing=new Map();
  function attach(){
    if(disposed)return;
    for(const button of doc.querySelectorAll('button'))if(['Вернуть рекомендуемое оформление','Вернуть стандартный размер','Вернуть цены по умолчанию'].includes(button.getAttribute('aria-label')??button.textContent.trim())){if(!buttonSpacing.has(button))buttonSpacing.set(button,[button.style.marginTop,button.style.marginBottom]);button.style.marginTop='16px';button.style.marginBottom='6px';}
    const select=[...doc.querySelectorAll('select')].find(node=>node.getAttribute('aria-label')===slots[0]?.label);if(!select?.isConnected||root?.isConnected||!slots.length)return;
    root=doc.createElement('div');root.setAttribute('data-rff-font-preview','');root.style.cssText='margin-top:14px;width:100%;border-radius:12px;overflow:hidden;background:#102b25;border:1px solid #476158';
    const title=doc.createElement('p');title.textContent='Образцы выбранных шрифтов';title.style.cssText='margin:10px 14px;color:#fff;font:600 14px system-ui';
    canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;canvas.style.cssText='display:block;width:100%;height:auto;background:#102b25';
    const note=doc.createElement('p');note.textContent='Пять образцов соответствуют пяти исходным шрифтам игры. Их рисует игровой движок. Выбор применяется сразу.';note.style.cssText='margin:10px 14px;color:#c9d6d2;font:12px system-ui';root.append(title,canvas,note);
    const row=select.closest('.gp-setting-row,.gp-form-row,.gp-field-row')??select.parentElement;row?.parentElement?.appendChild(root);signature='';
  }
  function destroyRender(){renderRoot?.destroy?.();texture?.destroy?.();renderRoot=null;camera=null;texture=null;labels=[];signature='';pending=false;}
  function makeRenderer(scene){
    destroyRender();renderRoot=new cc.Node('RussianFontSamples');renderRoot.parent=scene;renderRoot.layer=layer;renderRoot.__rffOwnedFont=true;renderRoot.setPosition(100000,100000,0);renderRoot.addComponent(cc.UITransform).setContentSize(width,height);
    const cameraNode=new cc.Node('FontSampleCamera');cameraNode.parent=renderRoot;cameraNode.setPosition(0,0,1000);camera=cameraNode.addComponent(cc.Camera);camera.projection=0;camera.orthoHeight=height/2;camera.near=0;camera.far=2000;camera.visibility=layer;camera.clearFlags=cc.Camera.ClearFlag.SOLID_COLOR;camera.clearColor=new cc.Color(16,43,37,255);
    texture=new cc.RenderTexture();texture.initialize({width,height});camera.targetTexture=texture;
    const renderer=renderRoot.addComponent(cc.Canvas);renderer.alignCanvasWithScreen=false;renderer.cameraComponent=camera;
    function label(text,y,size,rows,role,color=new cc.Color(255,255,255,255)){
      const node=new cc.Node('FontSample');node.parent=renderRoot;node.layer=layer;node.__rffOwnedFont=true;node.setPosition(0,y,0);node.addComponent(cc.UITransform).setContentSize(width-64,rows);
      const l=node.addComponent(cc.Label);l.string=text;l.useSystemFont=true;l.fontSize=size;l.lineHeight=size*1.28;l.overflow=1;l.enableWrapText=false;l.horizontalAlign=0;l.verticalAlign=1;l.enableOutline=true;l.outlineWidth=3;l.outlineColor=new cc.Color(0,0,0,255);l.color=color;labels.push({label:l,role,base:size,height:rows});
    }
    slots.forEach((slot,index)=>{const top=height/2-index*196;label(slot.label,top-35,28,64,'caption');label(slot.sample,top-122,42,130,slot.key,index===0||slot.key==='terror'?new cc.Color(255,221,92,255):undefined);});
  }
  function prepare(){
    if(disposed)return;attach();const visible=canvas?.isConnected&&canvas.getClientRects().length,scene=cc.director?.getScene?.();if(!visible||!scene){if(camera)camera.enabled=false;return;}
    try{
      if(!renderRoot||renderRoot.isValid===false||renderRoot.parent!==scene)makeRenderer(scene);
      const key=JSON.stringify([resources.custom,resources.fontSlots,resources.percent]);if(key===signature)return;signature=key;
      const measure=doc.createElement('canvas').getContext('2d');
      for(const sample of labels){const slot=slots.find(item=>item.key===sample.role),choice=resources.fontSlots?.[slot?.key]??slot?.fallback,l=sample.label;l.fontFamily=sample.role==='caption'||!resources.custom?'Arial':options.find(option=>option.value===choice)?.family??'Arial';measure.font=`100px "${l.fontFamily}"`;const lines=l.string.split('\n'),units=Math.max(...lines.map(text=>measure.measureText(text).width/100)),smallScript=resources.custom&&sample.role==='ashley'&&choice==='caveat',ratio=smallScript?1.17:1.28,factor=smallScript?1.20:1;l.fontSize=Math.floor(Math.min(sample.base*(sample.role==='caption'?1:(resources.percent??68)/68)*factor,(width-76)/(units*1.04),(sample.height-10)/((smallScript?1.35:1.75)+(lines.length-1)*ratio)));l.lineHeight=l.fontSize*ratio;l.updateRenderData?.(true);}
      camera.enabled=true;pending=true;
    }catch(error){if(!warned){warned=true;log.warn?.('Образцы шрифтов: '+String(error?.message??error));}}
  }
  function capture(){
    if(!pending||!canvas?.isConnected||!texture)return;
    try{const data=texture.readPixels();if(!data)return;const pixels=new Uint8ClampedArray(data.length),stride=width*4;for(let row=0;row<height;row++)pixels.set(data.subarray(row*stride,(row+1)*stride),(height-row-1)*stride);canvas.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);pending=false;camera.enabled=false;}catch(error){pending=false;if(camera)camera.enabled=false;if(!warned){warned=true;log.warn?.('Образцы шрифтов: '+String(error?.message??error));}}
  }
  const before=cc.Director?.EVENT_BEFORE_DRAW??'director_before_draw',after=cc.Director?.EVENT_AFTER_DRAW??'director_after_draw';
  return {start(){if(started||disposed)return;started=true;cc.director?.on?.(before,prepare);cc.director?.on?.(after,capture);if(globalThis.MutationObserver){observer=new MutationObserver(attach);observer.observe(doc.body,{childList:true,subtree:true});}attach();},dispose(){disposed=true;cc.director?.off?.(before,prepare);cc.director?.off?.(after,capture);observer?.disconnect();for(const [button,s] of buttonSpacing){button.style.marginTop=s[0];button.style.marginBottom=s[1];}buttonSpacing.clear();root?.remove();root=null;canvas=null;destroyRender();}};
}

const PLANNING_KEY="local.gardendless.russian-font-fix.planning-boost.v1";
export function createPlanningController(native,log={}) {
  let enabled=false,disposed=false;
  try{enabled=globalThis.localStorage?.getItem(PLANNING_KEY)==="true";}catch(_){}
  const pending=new WeakMap(),suppressed=new WeakMap(),imitated=new WeakMap(),placements=new WeakMap(),transfers=new WeakMap(),wrapped=new Map(),undo=[],bound=new WeakSet();
  const level=()=>native.LevelPlay?.component;
  let phaseOwner=null,phaseActive=false,phaseToken=null;
  function phase(){
    const owner=level(),active=enabled&&!!owner?.lastStand&&owner.lastStandPrepareStarted===true;
    if(owner!==phaseOwner||active!==phaseActive){phaseOwner=owner;phaseActive=active;phaseToken=active?{owner}:null;}
    return phaseToken;
  }


  const preparing=token=>!!token&&token===phase();
  function patch(proto,key,make){
    const original=proto?.[key];if(typeof original!=="function")return;
    const replacement=make(original);proto[key]=replacement;
    undo.push(()=>{if(proto[key]===replacement)proto[key]=original;});
  }
  function copies(plant){
    if(wrapped.has(plant)||typeof plant.throwChildren!=="function")return;
    const own=Object.getOwnPropertyDescriptor(plant,"throwChildren"),original=plant.throwChildren;
    const replacement=function(...args){
      if(preparing(suppressed.get(this)))return Promise.resolve();
      return original.apply(this,args);
    };
    plant.throwChildren=replacement;wrapped.set(plant,{own,replacement});
  }
  function bind(){
    Object.assign(native,native.resolve?.()??{});
    const cell=native.LnC?.prototype,plant=native.Plant?.prototype;
    if(cell&&!bound.has(cell)){
      bound.add(cell);
      patch(cell,"PlaceUIPlant",original=>function(...args){
        const owner=phase(),card=this.UIInGame?.currentCF??native.UIInGame?.component?.currentCF;
        if(!preparing(owner)||!card?.BOOSTED||!(card.PF?.BOOST>0)||typeof this.scheduleOnce!=="function")return original.apply(this,args);


        const own=Object.getOwnPropertyDescriptor(this,"scheduleOnce"),schedule=this.scheduleOnce,ticket={owner,card},cell=this;
        this.scheduleOnce=function(callback,...rest){return schedule.call(this,function(...a){const previous=placements.get(cell);placements.set(cell,ticket);try{return callback.apply(this,a);}finally{if(previous)placements.set(cell,previous);else placements.delete(cell);}},...rest);};
        try{return original.apply(this,args);}finally{if(own)Object.defineProperty(this,"scheduleOnce",own);else delete this.scheduleOnce;}
      });
      patch(cell,"SpawnPlantByType",original=>function(...args){



        const owner=phase(),ticket=placements.get(this),card=ticket?.card;
        const placement=preparing(owner)&&ticket?.owner===owner&&!!card?.BOOSTED&&card.PF?.BOOST>0&&args[1]===false&&args[2]===true&&args[3]===true&&args[4]===true&&args[6]===true;
        const transfer=preparing(owner)&&args[1]===true&&args[2]===true&&args[3]===false&&args[4]===true&&args[5]===undefined?(transfers.get(this)??[]).find(t=>!t.used&&t.owner===owner&&t.type===args[0]):null;
        if(transfer)transfer.used=true;
        const initial=placement||!!transfer;
        const result=original.apply(this,args);
        if(!initial||!result?.then)return result;
        return result.then(value=>{if(value&&preparing(owner))pending.set(value,owner);return value;});
      });
    }
    if(plant&&!bound.has(plant)){
      bound.add(plant);
      patch(plant,"food",original=>function(...args){
        const owner=pending.get(this),previous=suppressed.get(this);pending.delete(this);
        suppressed.delete(this);
        if(preparing(owner)){copies(this);suppressed.set(this,owner);}
        try{const result=original.apply(this,args);if(!result){if(preparing(previous))suppressed.set(this,previous);else suppressed.delete(this);}return result;}
        catch(error){suppressed.delete(this);throw error;}
      });
      patch(plant,"foodEnd",original=>function(...args){try{return original.apply(this,args);}finally{suppressed.delete(this);pending.delete(this);}});
    }
    const imitater=native.ImitaterPlant?.prototype;
    if(imitater&&!bound.has(imitater)){
      bound.add(imitater);


      patch(imitater,"food",original=>function(...args){
        const owner=pending.get(this),previous=imitated.get(this);pending.delete(this);imitated.delete(this);
        const result=original.apply(this,args);
        if(result&&preparing(owner))imitated.set(this,owner);
        else if(result&&preparing(previous)&&this.boosted)imitated.set(this,previous);
        return result;
      });
      patch(imitater,"transToPlant",original=>function(...args){
        const owner=imitated.get(this),cell=this.plantInLnC;imitated.delete(this);
        if(!cell||!this.boosted||!preparing(owner))return original.apply(this,args);
        const token={owner,type:this.willImitateType,used:false},list=transfers.get(cell)??[];list.push(token);transfers.set(cell,list);
        const clear=()=>{const i=list.indexOf(token);if(i>=0)list.splice(i,1);if(!list.length)transfers.delete(cell);};
        try{const result=original.apply(this,args);if(result?.then)return result.finally(clear);clear();return result;}catch(error){clear();throw error;}
      });
    }
  }
  bind();
  return {scan(){if(disposed)return;phase();bind();for(const [plant,s] of wrapped)if(plant.isValid===false||plant.node?.isValid===false||!plant.node){wrapped.delete(plant);}},get enabled(){return enabled;},setEnabled(value){enabled=!!value;phase();try{globalThis.localStorage?.setItem(PLANNING_KEY,String(enabled));}catch(error){log.warn?.(`Настройка планирования не сохранена: ${String(error)}`);}},dispose(){if(disposed)return;disposed=true;for(const [plant,s]of wrapped)if(plant.throwChildren===s.replacement){if(s.own)Object.defineProperty(plant,"throwChildren",s.own);else delete plant.throwChildren;}wrapped.clear();for(const restore of undo.reverse())restore();}};
}

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

const AUTO_COLLECT_KEY = "local.gardendless.russian-font-fix.auto-collect.v1";
function readAutoCollectState(storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage)?.getItem(AUTO_COLLECT_KEY) ?? "null");
    const preferences = { other: value?.other === true, sun: value?.sun === true, plantfood: value?.plantfood === true };
    const enabled = value?.enabled === true || (value?.enabled !== false && Object.values(preferences).some(Boolean));
    if (!enabled) for (const key of Object.keys(preferences)) preferences[key] = false;
    return { enabled, preferences };
  } catch (_) { return { enabled: false, preferences: { other: false, sun: false, plantfood: false } }; }
}
export function readAutoCollectPreferences(storage) {
  return readAutoCollectState(storage).preferences;
}
export function createAutoCollectController(cc, native, log = {}, storage) {
  const state = readAutoCollectState(storage), preferences = state.preferences, bound = new WeakSet(), undo = [];
  let enabled = state.enabled, disposed = false, warned = false;
  function save() {
    try { (storage ?? globalThis.localStorage)?.setItem(AUTO_COLLECT_KEY, JSON.stringify({ enabled, ...preferences })); }
    catch (_) { log.warn?.("Автоподбор изменён на текущий запуск; сохранить настройку не удалось."); }
  }
  function collect(drop, dt, garden) {
    if (disposed || !enabled || !(dt > 0) || drop.collected || drop.disabled || drop.fadingAway || drop.node?.isValid === false ||
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
    get enabled() { return enabled; },
    get preferences() { return { ...preferences }; },
    setActive(value) {
      if (disposed || typeof value !== "boolean") return false;
      enabled = value;
      if (!enabled) for (const key of Object.keys(preferences)) preferences[key] = false;
      save();
      scan();
      return true;
    },
    setEnabled(key, value) {
      if (disposed || !Object.hasOwn(preferences, key) || typeof value !== "boolean") return false;
      preferences[key] = value;
      if (value) enabled = true;
      save();
      scan();
      return true;
    },
    dispose() { if (disposed) return; disposed = true; for (const restore of undo.reverse()) restore(); undo.length = 0; }
  };
}

export function authoredLines(text) {
  return String(text).trim().split(/\r?\n/).map(line=>line.trim().replace(/\s+/g," "));
}

export function balancedLines(text,width,size,measure,style) {
  const result=[];
  for(const paragraph of authoredLines(text)) {
    const words=paragraph.split(" "),count=words.length,greedy=[];
    let current="";
    for(const word of words){const next=current?`${current} ${word}`:word;if(current&&measure(next,style)*size>width){greedy.push(current);current=word;}else current=next;}
    greedy.push(current);
    const rows=greedy.length;
    if(rows===1||count>160){result.push(...greedy);continue;}
    const widths=new Map(),line=(i,j)=>words.slice(i,j).join(" ");
    const span=(i,j)=>{const key=i*count+j;if(!widths.has(key))widths.set(key,measure(line(i,j),style)*size);return widths.get(key);};
    const dp=Array.from({length:rows+1},()=>Array(count+1).fill(Infinity)),previous=dp.map(row=>row.map(()=>-1));dp[0][0]=0;
    for(let row=1;row<=rows;row++)for(let end=row;end<=count;end++)for(let begin=end-1;begin>=row-1;begin--) {
      const w=span(begin,end);if(w>width&&end>begin+1)break;
      if(w>width||!Number.isFinite(dp[row-1][begin]))continue;
      const slack=(width-w)/Math.max(1,width),cost=dp[row-1][begin]+slack*slack;
      if(cost<dp[row][end]){dp[row][end]=cost;previous[row][end]=begin;}
    }
    if(previous[rows][count]<0){result.push(...greedy);continue;}
    let end=count;const lines=[];
    for(let row=rows;row>0;row--){const begin=previous[row][end];lines.unshift(line(begin,end));end=begin;}
    result.push(...lines);
  }
  return result;
}

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
