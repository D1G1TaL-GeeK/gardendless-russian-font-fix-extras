import test from 'node:test';
import assert from 'node:assert/strict';
import {createPaidController,DEFAULT_PRICES} from '../src/paid-powerups.mjs';

class Vec3 {
  constructor(x=1,y=1,z=1){Object.assign(this,{x,y,z});}
  clone(){return new Vec3(this.x,this.y,this.z);}
}
class MouseNode {
  static EventType={MOUSE_ENTER:'enter',MOUSE_LEAVE:'leave',MOUSE_DOWN:'down',MOUSE_UP:'up'};
  scale=new Vec3();activeInHierarchy=true;isValid=true;handlers=new Map();
  on(event,callback){const items=this.handlers.get(event)??[];items.push(callback);this.handlers.set(event,items);}
  off(event,callback){this.handlers.set(event,(this.handlers.get(event)??[]).filter(fn=>fn!==callback));}
  emit(event){for(const callback of this.handlers.get(event)??[])callback();}
  setScale(value){this.scale=value.clone();}
}
function fixture(){
  const props=['fireButton','snowButton','tossButton','zapButton','cherryButton'];
  const player={coin:5000,gem:79,features:{feature_powerup:true}},level={showPowerUps:true},owner={node:new MouseNode(),shown:true,countDown:0};
  for(const prop of props)owner[prop]={node:new MouseNode(),interactable:true};
  const wallet={node:new MouseNode(),isValid:true,showCD:0,_hidden:true,calls:0,
    get hidden(){return this._hidden;},set hidden(value){this._hidden=value;this.showCD=5;this.calls++;}};
  let saves=0,sounds=0;
  const preferences={mode:'coins',prices:{...DEFAULT_PRICES}},native={
    Players:{currentPlayer:player,savePP(){saves++;}},LevelPlay:{component:level},PowerupFingers:{component:owner},CoinCollecterInGame:{component:wallet},
    sounds:{playOneShot(){sounds++;},playCardChooseFailed(){sounds++;}}
  };
  const controller=createPaidController({Node:MouseNode,Vec3,director:{getScene:()=>null}},native,preferences);
  controller.scan();return{props,player,level,owner,wallet,preferences,controller,counters:()=>({saves,sounds})};
}
test('hovering every paid booster reveals the native wallet once, without spending, saving or sound',()=>{
  const f=fixture();
  for(const prop of f.props){
    const node=f.owner[prop].node;f.wallet.hidden=true;const before=f.wallet.calls;node.emit('enter');
    assert.equal(f.wallet.hidden,false);assert.equal(f.wallet.showCD,5);assert.equal(f.wallet.calls,before+1);
    assert.equal(node.scale.x,1.045);node.emit('leave');assert.equal(node.scale.x,1);assert.equal(f.wallet.hidden,false);
  }
  assert.deepEqual(f.counters(),{saves:0,sounds:0});assert.equal(f.player.coin,5000);assert.equal(f.player.gem,79);f.controller.dispose();
});
test('frame scans never renew the native hide countdown and a fresh hover renews it',()=>{
  const f=fixture(),node=f.owner.fireButton.node;node.emit('enter');f.wallet.showCD=.1;
  for(let i=0;i<40;i++)f.controller.scan();assert.equal(f.wallet.showCD,.1);
  node.emit('leave');node.emit('enter');assert.equal(f.wallet.showCD,5);f.controller.dispose();
});
test('unaffordable boosters reveal balance; hidden, prohibited, tutorial and non-paid controls do not',()=>{
  const f=fixture(),node=f.owner.fireButton.node;f.player.coin=0;f.controller.scan();assert.equal(f.owner.fireButton.interactable,false);
  node.emit('enter');assert.equal(f.wallet.hidden,false);assert.deepEqual(f.counters(),{saves:0,sounds:0});
  const check=(change,undo)=>{f.wallet.hidden=true;change();node.emit('enter');assert.equal(f.wallet.hidden,true);undo();};
  check(()=>node.activeInHierarchy=false,()=>node.activeInHierarchy=true);
  check(()=>f.wallet.node.activeInHierarchy=false,()=>f.wallet.node.activeInHierarchy=true);
  check(()=>f.level.PowerUpsForceHide=true,()=>f.level.PowerUpsForceHide=false);
  check(()=>f.owner.countDown=1,()=>f.owner.countDown=0);
  check(()=>f.owner.mode=1,()=>f.owner.mode=0);
  check(()=>f.owner.shown=false,()=>f.owner.shown=true);
  for(const mode of ['native','off'])check(()=>f.preferences.mode=mode,()=>f.preferences.mode='coins');
  f.controller.dispose();
});
test('disposal removes hover callbacks and restores the original button scale',()=>{
  const f=fixture(),node=f.owner.fireButton.node;node.emit('enter');f.controller.dispose();f.wallet.hidden=true;node.emit('enter');
  assert.equal(f.wallet.hidden,true);assert.equal(node.scale.x,1);assert.equal(node.handlers.get('enter').length,0);
});
