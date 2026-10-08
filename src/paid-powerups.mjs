 
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
    if(preferences.mode==="coins"&&pos&&this.addButton){this.addButton.setPosition(pos);this.addButton.active=true;}
    return result;
  });
  patch(PlantFoodCount?.prototype,"onLoad",original=>function(...args){const result=original.apply(this,args);if(this.addButton?.position?.clone)foodPositions.set(this,this.addButton.position.clone());return result;});
  }
  bindHooks();
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
    if(food?.addButton){bindExistingCallback(food,"onAddMouseDown",food.addButton);remember(food.addButton);if(!foodPositions.has(food)&&food.addButton.position?.clone){const pos=food.addButton.position.clone();if(food.shown&&pos.x<-800&&pos.y>800){pos.x+=1000;pos.y-=1000;}foodPositions.set(food,pos);}if(paid){const pos=foodPositions.get(food);if(pos)food.addButton.setPosition(pos);food.addButton.active=!!food.shown&&!!level()?.showPlantfood&&current()?.features?.feature_plantfood===true;priceBadge(food.addButton,"food",balance()>=preferences.prices.food&&food.plantFoodNum<food.maxCount);}else {const b=badges.get(food.addButton);if(b)b.node.active=false;food.addButton.active=locked()?false:nodes.get(food.addButton).active;}}
    for(const [parent,b] of badges)if(parent.isValid===false){b.node.destroy?.();badges.delete(parent);}else if(!paid)b.node.active=false;
    for(const [node,s]of feedback)if(node.isValid===false){s.tween?.stop?.();feedback.delete(node);}else if(!s.button.interactable&&s.hover)s.reset();
    for(const [node,s] of visuals)if(node.isValid!==false&&(!paid||required(p)&&node!==food?.addButton))s.opacity.opacity=s.before;
  }
  function persist(){try{globalThis.localStorage?.setItem(KEY,JSON.stringify(preferences));}catch(e){log.warn?.(`Настройки усилений не сохранены: ${String(e)}`);}}
  return {preferences,scan,debit,cancel,balance,setMode(v){preferences.mode=v==="coins"?"coins":v==="off"?"off":"native";preferences.block=preferences.mode==="off";cancel();forceOff();persist();scan();},setBlock(v){this.setMode(v?"off":"native");},resetPrices(){Object.assign(preferences.prices,DEFAULT_PRICES);persist();scan();},setPrice(k,v){if(k in DEFAULT_PRICES&&validPrice(v)){preferences.prices[k]=Number(v);persist();scan();return true;}return false;},dispose(){if(disposed)return;cancel();disposed=true;for(const s of feedback.values())s.dispose();feedback.clear();for(const b of badges.values())b.node.destroy?.();for(const [node,s] of visuals)if(node.isValid!==false){s.opacity.opacity=s.before;if(s.owned)s.opacity.destroy?.();}for(const [node,s] of nodes)if(node.isValid!==false){node.active=s.active;if(s.position)node.setPosition(s.position);}for(const restore of undo.reverse())restore();}};
}
