 
export function createLivePreview(cc,log={}) {
  const doc=globalThis.document;
  if(!doc?.createElement)return {start(){},dispose(){}};
  let root=null,canvas=null,disposed=false,warned=false;
  const marker='data-rff-live-preview';
  function attach(){
    if(disposed)return;
    const select=doc.querySelector('select[aria-label="Основной шрифт"]')??doc.querySelector('select[aria-label="Кадр игры"]');
    if(!select?.isConnected)return;
    if(root?.isConnected)return;
    root=doc.createElement('div');root.setAttribute(marker,'');
    root.style.cssText='margin-top:14px;width:100%;border-radius:12px;overflow:hidden;background:#102b25;border:1px solid #476158';
    const title=doc.createElement('p');title.textContent='Живой предпросмотр игры';title.style.cssText='margin:10px 14px;color:#fff;font:600 14px system-ui';
    canvas=doc.createElement('canvas');canvas.style.cssText='display:block;width:100%;height:auto;max-height:360px;object-fit:contain;background:#000';
    const note=doc.createElement('p');note.textContent='Текущий кадр движка. Изменения шрифта и фона видны сразу.';note.style.cssText='margin:10px 14px;color:#c9d6d2;font:12px system-ui';
    root.append(title,canvas,note);
     
     
    const row=select.closest('.gp-setting-row,.gp-form-row,.gp-field-row')??select.parentElement;
    row?.parentElement?.appendChild(root);
  }
  function draw(){
    if(disposed)return;attach();
    if(!canvas?.isConnected||!canvas.getClientRects().length)return;
    const game=cc.game?.canvas??doc.getElementById('GameCanvas');
    if(!game||game===canvas||!game.width||!game.height)return;
    const width=Math.min(960,game.width),height=Math.round(width*game.height/game.width);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    try{const context=canvas.getContext('2d');context.clearRect(0,0,width,height);context.drawImage(game,0,0,width,height);}catch(error){if(!warned){warned=true;log.warn?.('Предпросмотр игры: '+String(error?.message??error));}}
  }
  const event=cc.Director?.EVENT_AFTER_DRAW??'director_after_draw';
  let observer=null,started=false;
  return {start(){if(started||disposed)return;started=true;cc.director?.on?.(event,draw);if(globalThis.MutationObserver){observer=new MutationObserver(attach);observer.observe(doc.body,{childList:true,subtree:true});}attach();},dispose(){disposed=true;cc.director?.off?.(event,draw);observer?.disconnect();root?.remove();root=null;canvas=null;}};
}
