export const defaults = {refraction:0.018, aberration:0.15, bevelDepth:0.09, bevelWidth:0.12, frost:0.4, shadow:true, specular:true, tilt:false, tiltFactor:5, tiltEase:400, magnify:1, resolution:1, reveal:'fade'};
export const ranges = {refraction:[0,1,.001],aberration:[0,1,.01],bevelDepth:[0,1,.001],bevelWidth:[0,1,.001],frost:[0,10,.1],magnify:[.1,3,.01],tiltFactor:[0,25,.5],tiltEase:[0,1000,10],resolution:[.1,3,.1]};
export const presets = {Crystal:{...defaults},Default:{...defaults,refraction:0,bevelDepth:.052,bevelWidth:.211,frost:2},Alien:{...defaults,refraction:.073,bevelDepth:.2,bevelWidth:.156,frost:2,specular:false},Pulse:{...defaults,refraction:.03,bevelDepth:0,bevelWidth:.273,frost:0,shadow:false,specular:false},Frost:{...defaults,refraction:0,bevelDepth:.035,bevelWidth:.119,frost:.9},Edge:{...defaults,refraction:.047,bevelDepth:.136,bevelWidth:.076,frost:2,specular:false}};
export function validateSettings(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected a settings object');
 for(const [key,value] of Object.entries(input)){
  if(key in ranges){const [min,max]=ranges[key];if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error(`Invalid ${key}`)}
  else if(['shadow','specular','tilt'].includes(key)){if(typeof value!=='boolean')throw new Error(`Invalid ${key}`)}
  else if(key==='reveal'){if(!['fade','none'].includes(value))throw new Error('Invalid reveal')}
  else throw new Error(`Unknown setting: ${key}`);
 }return input;
}
