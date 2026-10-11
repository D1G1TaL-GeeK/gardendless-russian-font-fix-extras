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
