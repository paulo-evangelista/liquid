import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waitForLenses} from '../src/startup.js';

test('startup waits for every lens and two paint frames, ignoring duplicate callbacks', async () => {
 const panes = [{}, {}, {}], frames = [];
 const gate = waitForLenses(panes, callback => frames.push(callback));
 let ready = false;
 gate.ready.then(() => { ready = true; });
 gate.onInit({el:panes[0]});
 gate.onInit({el:panes[0]});
 gate.onInit({el:panes[1]});
 assert.equal(frames.length, 0);
 gate.onInit({el:panes[2]});
 gate.onInit({el:panes[2]});
 assert.equal(frames.length, 1);
 frames.shift()();
 await Promise.resolve();
 assert.equal(ready, false);
 frames.shift()();
 await gate.ready;
 assert.equal(ready, true);
 assert.equal(frames.length, 0);
});

test('startup also waits for foreground text to be composited over the video', async () => {
 const pane = {}, frames = [];
 let textCaptured = false, ready = false;
 const gate = waitForLenses([pane], callback => frames.push(callback), () => textCaptured);
 gate.ready.then(() => { ready = true; });
 gate.onInit({el:pane});
 frames.shift()();
 await Promise.resolve();
 assert.equal(ready, false);
 assert.equal(frames.length, 1);
 textCaptured = true;
 frames.shift()();
 await Promise.resolve();
 assert.equal(ready, false);
 frames.shift()();
 await gate.ready;
 assert.equal(ready, true);
});
