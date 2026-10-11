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
