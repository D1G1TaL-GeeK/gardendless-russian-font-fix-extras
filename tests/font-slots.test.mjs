import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FONT_SLOTS,readFontSlots,setFontSlot,resetFontSlots,fontSlotFamily,originalFontSlot} from '../src/font-slots.mjs';
import {FONT_OPTIONS} from '../src/main.mjs';
const key='local.gardendless.russian-font-fix.font-slots.v1';
const defaults={fbu:'shantell',brianne:'comfortaa',ashley:'caveat',pico:'comfortaa',terror:'ruslan'};
const storage=entries=>{const values=new Map(entries);return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
test('recommended slot defaults match the requested five font families',()=>{
 assert.deepEqual(Object.fromEntries(FONT_SLOTS.map(slot=>[slot.key,slot.fallback])),defaults);
 assert.deepEqual(Object.fromEntries(FONT_SLOTS.map(slot=>[slot.key,FONT_OPTIONS.find(option=>option.value===slot.fallback)?.label])),{fbu:'Shantell Sans Bold',brianne:'Comfortaa Bold',ashley:'Caveat Bold',pico:'Comfortaa Bold',terror:'Ruslan Display'});
});
test('missing legacy categories use their own recommendations',()=>{
 const mainOnly=storage([['local.gardendless.russian-font-fix.font-style.v1','neucha']]);
 assert.deepEqual(readFontSlots(FONT_OPTIONS,mainOnly),{...defaults,fbu:'neucha',terror:'neucha'});
 const dialogueOnly=storage([['local.gardendless.russian-font-fix.dialog-style.v1','rubik']]);
 assert.deepEqual(readFontSlots(FONT_OPTIONS,dialogueOnly),{...defaults,brianne:'rubik',ashley:'rubik',pico:'rubik'});
 const invalid=storage([['local.gardendless.russian-font-fix.font-style.v1','missing'],['local.gardendless.russian-font-fix.dialog-style.v1','heading']]);
 assert.deepEqual(readFontSlots(FONT_OPTIONS,invalid),defaults);
});
test('partial slot preferences retain manual choices and fill missing categories',()=>{
 const saved={fbu:'nunito',brianne:false,ashley:'missing',pico:'neucha'};
 assert.deepEqual(readFontSlots(FONT_OPTIONS,storage([[key,JSON.stringify(saved)]])),{...defaults,fbu:'nunito',pico:'neucha'});
 const previous={fbu:'ruslan',brianne:'nunito',ashley:'nunito',pico:'nunito',terror:'ruslan'};
 assert.deepEqual(readFontSlots(FONT_OPTIONS,storage([[key,JSON.stringify(previous)]])),previous);
});
test('style reset persists the new recommendations over older migrated choices',()=>{
 const s=storage([['local.gardendless.russian-font-fix.font-style.v1','ruslan'],['local.gardendless.russian-font-fix.dialog-style.v1','nunito']]);
 const r={custom:true,fontSlots:readFontSlots(FONT_OPTIONS,s),percent:72,startupLanguage:'en'};
 resetFontSlots(r,s);assert.deepEqual(r.fontSlots,defaults);assert.deepEqual(JSON.parse(s.getItem(key)),defaults);assert.deepEqual(readFontSlots(FONT_OPTIONS,s),defaults);assert.equal(r.percent,72);assert.equal(r.startupLanguage,'en');
});
test('five native fonts match compressed/full UUIDs, subassets and file URLs',()=>{
 for(const slot of FONT_SLOTS)for(const font of [{_uuid:slot.uuid},{uuid:slot.fullUuid},{_uuid:slot.fullUuid+'@abc'},{nativeUrl:'fonts/'+slot.file.toLowerCase()}])assert.equal(originalFontSlot(font,{name:'label'}),slot.key);
 assert.equal(originalFontSlot(null,{name:'label',parent:{name:'ZombossBubble'}}),'ashley');assert.equal(originalFontSlot(null,{name:'GameLoseTip'}),'terror');assert.equal(originalFontSlot(null,{name:'label',parent:{name:'WinnieBubble'}}),'pico');
});
test('fresh, malformed and inaccessible settings use five safe defaults',()=>{
 for(const text of [null,'{','null','false','[]','{"fbu":"unknown","ashley":false}'])assert.deepEqual(readFontSlots(FONT_OPTIONS,storage([[key,text]])),defaults);
 assert.deepEqual(readFontSlots(FONT_OPTIONS,{getItem(){throw Error('denied');}}),defaults);
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('denied');}});try{assert.deepEqual(readFontSlots(FONT_OPTIONS),defaults);}finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage;}
});
test('old main and dialogue choices migrate; obsolete body choice never overrides FBU',()=>{
 const s=storage([['local.gardendless.russian-font-fix.font-style.v1','shantell'],['local.gardendless.russian-font-fix.body-style.v1','caveat'],['local.gardendless.russian-font-fix.dialog-style.v1','rubik']]);assert.deepEqual(readFontSlots(FONT_OPTIONS,s),{fbu:'shantell',terror:'shantell',brianne:'rubik',ashley:'rubik',pico:'rubik'});
 s.setItem('local.gardendless.russian-font-fix.dialog-style.v1','heading');assert.equal(readFontSlots(FONT_OPTIONS,s).ashley,'shantell');s.setItem(key,JSON.stringify({fbu:'nunito',pico:'neucha'}));assert.equal(readFontSlots(FONT_OPTIONS,s).fbu,'nunito');assert.equal(readFontSlots(FONT_OPTIONS,s).pico,'neucha');
});
test('each independent selector accepts every bundled font and persists exactly five slots',()=>{
 const s=storage(),r={custom:true,fontSlots:{...defaults}};
 for(const slot of FONT_SLOTS)for(const option of FONT_OPTIONS){const before={...r.fontSlots};assert(setFontSlot(r,slot.key,option.value,FONT_OPTIONS,s));assert.equal(fontSlotFamily(r,slot.key,FONT_OPTIONS),option.family);for(const other of FONT_SLOTS)if(other!==slot)assert.equal(r.fontSlots[other.key],before[other.key]);assert.deepEqual(readFontSlots(FONT_OPTIONS,s),r.fontSlots);}
 const before=JSON.stringify(r.fontSlots);assert.equal(setFontSlot(r,'__proto__','ruslan',FONT_OPTIONS,s),false);assert.equal(setFontSlot(r,'fbu','missing',FONT_OPTIONS,s),false);assert.equal(JSON.stringify(r.fontSlots),before);resetFontSlots(r,s);assert.deepEqual(r.fontSlots,defaults);
});
test('failed persistence still applies a live selection and Arial fallback stays usable',()=>{
 const r={custom:true,fontSlots:{...defaults}},s={setItem(){throw Error('denied');}};assert.throws(()=>setFontSlot(r,'ashley','neucha',FONT_OPTIONS,s));assert.equal(r.fontSlots.ashley,'neucha');r.custom=false;assert.equal(fontSlotFamily(r,'ashley',FONT_OPTIONS),'Arial');assert.throws(()=>resetFontSlots(r,s));assert.deepEqual(r.fontSlots,defaults);
});
