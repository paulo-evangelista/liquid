// Wait for every pane, then give the browser two frames to paint the finished scene.
export function waitForLenses(elements, nextFrame = requestAnimationFrame, sceneReady = () => true) {
 const pending = new Set(elements);
 let resolve, queued = false;
 const ready = new Promise(done => { resolve = done; });
 const paint = () => sceneReady() ? nextFrame(resolve) : nextFrame(paint);
 const onInit = ({el}) => {
  pending.delete(el);
  if (pending.size || queued) return;
  queued = true;
  nextFrame(paint);
 };
 return {ready, onInit};
}
