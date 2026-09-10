import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,presets,validateSettings} from '../src/settings.js';
test('all presets are valid; unsafe and out-of-range input is rejected',()=>{
 for(const settings of [defaults,...Object.values(presets)])assert.equal(validateSettings(settings),settings);
 for(const settings of [null,[],{frost:-1},{refraction:Infinity},{magnify:4},{shadow:'true'},{unknown:1},{reveal:'explode'}])assert.throws(()=>validateSettings(settings));
 assert.deepEqual(validateSettings({refraction:0,aberration:1,tilt:true}),{refraction:0,aberration:1,tilt:true});
});
