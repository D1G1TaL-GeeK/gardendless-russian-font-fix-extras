import test from 'node:test';
import assert from 'node:assert/strict';
import {fontOpticalFactor} from '../src/font-slots.mjs';

test('small script correction is confined to the selected Zomboss font', () => {
  const resources={custom:true,fontSlots:{ashley:'caveat',brianne:'caveat',pico:'caveat',fbu:'caveat'}};
  assert.equal(fontOpticalFactor(resources,'ashley'),1.20);
  for(const slot of ['brianne','pico','fbu'])assert.equal(fontOpticalFactor(resources,slot),1);
  resources.fontSlots.ashley='nunito';assert.equal(fontOpticalFactor(resources,'ashley'),1);
  resources.fontSlots.ashley='ruslan';assert.equal(fontOpticalFactor(resources,'ashley'),1.18);
  resources.custom=false;assert.equal(fontOpticalFactor(resources,'ashley'),1);
});
