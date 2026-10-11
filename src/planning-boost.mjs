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
