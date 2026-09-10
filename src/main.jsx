import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import {waitForLenses} from './startup.js';
import {defaults as base, ranges, presets, validateSettings} from './settings.js';

const requestedPage = new URLSearchParams(location.search).get('view');
const page = ['showcase','dashboard','playground'].includes(requestedPage) ? requestedPage : 'showcase';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenses = [];
function tune(settings, all=false){
 validateSettings(settings);
 lenses.filter(l=>l?.options&&(all||l.el.hasAttribute('data-tunable'))).forEach(l=>{Object.assign(l.options,settings);if('shadow'in settings)l.setShadow(settings.shadow);if('tilt'in settings)l.setTilt(settings.tilt);l.updateMetrics()});
}

function Glass({children, className='', ...props}) { return <section className={`glass ${className}`} {...props}><div className="glass-content">{children}</div></section>; }
function Mark(){return <span className="mark" aria-hidden="true">◒</span>}
function Background(){
 const ref=useRef();
 useEffect(()=>{
  const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d'); let frame, time=0, paused=reduced, palette=0;
  const control=e=>{if('paused'in e.detail)paused=e.detail.paused;if('palette'in e.detail)palette=e.detail.palette};window.addEventListener('light-field',control);
  canvas.width=1440; canvas.height=1000;
  const draw=()=>{
   const w=canvas.width,h=canvas.height; const t=time/160;if(!paused)time++;
   ctx.fillStyle='#101712';ctx.fillRect(0,0,w,h);
   const glow=ctx.createRadialGradient(w*.7,h*.4,10,w*.7,h*.4,w*.7);glow.addColorStop(0,'#596a30');glow.addColorStop(.5,'#263629');glow.addColorStop(1,'#101712');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
   ctx.strokeStyle='#ffffff09';ctx.lineWidth=1;for(let x=0;x<w;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
   for(let i=0;i<65;i++){let p=i/65;ctx.beginPath();for(let x=-100;x<w+100;x+=12){const y=h*.49+Math.sin(x/w*4.6+t+p*.55)*150+Math.cos(x/w*7-t*.5)*50+(p-.5)*300;if(x===-100)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=`hsla(${58+p*50},${45+p*30}%,${28+p*38}%,${.13+Math.sin(p*Math.PI)*.48})`;ctx.lineWidth=1.4+Math.sin(p*Math.PI)*3;ctx.stroke()}
   if(page==='showcase'){
    ctx.fillStyle='#0c100df0';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*.58,h*.43);ctx.rotate(-.35+Math.sin(t*.3)*.12);
    for(let i=100;i>0;i--){const p=i/100;ctx.beginPath();for(let a=0;a<=Math.PI*2+.05;a+=.025){const ripple=1+.12*Math.sin(a*3+t+p*6);const x=Math.cos(a)*p*580*ripple,y=Math.sin(a)*p*330*ripple;if(a===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}const hue=[75,195,25][palette]+Math.sin(p*4+t*.4)*28;ctx.strokeStyle=`hsla(${hue},${60+p*25}%,${30+p*40}%,${.2+p*.6})`;ctx.lineWidth=1.8;ctx.stroke()}ctx.restore();
   }
   frame=requestAnimationFrame(draw);
  };draw();
  const video=ref.current;const stream=canvas.captureStream(30);video.srcObject=stream;video.play().catch(()=>{});
  return()=>{cancelAnimationFrame(frame);stream.getTracks().forEach(t=>t.stop());window.removeEventListener('light-field',control)};
 },[]);
 return <div id="scene" className={page==='showcase'?'showcase-scene':''} aria-hidden="true"><video ref={ref} muted playsInline autoPlay/><div className="scene-grain"/>{page==='playground'&&<div className="test-type">Aa<br/><span>0123456789<br/>THE QUICK BROWN FOX</span></div>}{page==='showcase'&&<div className="liquid-word">liquid.</div>}</div>;
}
function App(){
 const [status,setStatus]=useState('Preparing optics');
 useEffect(()=>{
  let finished=false, cancelled=false, exitTimer;
  const controller=new AbortController();
  const screen=document.getElementById('startup-screen');
  const finish=(label)=>{
   if(finished||cancelled)return;
   finished=true;
   clearTimeout(timeout);
   controller.abort();
   setStatus(label);
   exitTimer=setTimeout(()=>{
    screen?.setAttribute('data-ready','true');
    exitTimer=setTimeout(()=>{
     screen?.remove();
     document.body.classList.remove('is-loading');
     document.getElementById('root').inert=false;
     document.getElementById('root').removeAttribute('aria-busy');
    },reduced?0:450);
   },1000);
  };
  const fallback=()=>{
   if(finished||cancelled)return;
   const renderer=window.__liquidGLRenderer__;
   if(renderer){
    cancelAnimationFrame(renderer._rafId);
    renderer.canvas.style.display='none';
    renderer.lenses.forEach(l=>{l.setTilt(false);l.setShadow(false)});
   }
   document.body.classList.add('soft-glass');
   finish('Soft glass mode');
  };
  const timeout=setTimeout(fallback,12000);
  const init=async()=>{
   try{
    const video=document.querySelector('#scene video');
    const videoReady=video.readyState>=2?Promise.resolve():new Promise((resolve,reject)=>{
     video.addEventListener('loadeddata',resolve,{once:true,signal:controller.signal});
     video.addEventListener('error',reject,{once:true,signal:controller.signal});
    });
    await Promise.all([document.fonts.ready,videoReady]);
    if(finished||cancelled)return;
    screen?.querySelector('[role="status"]')?.replaceChildren('Bending the light');
    const overlays=[...document.querySelectorAll('#scene .liquid-word, #scene .test-type')];
    // The renderer has no public event for its asynchronous text capture.
    const gate=waitForLenses(document.querySelectorAll('.glass'),requestAnimationFrame,()=>
     finished||cancelled||overlays.every(el=>window.__liquidGLRenderer__?._dynMeta.get(el)?.lastCapture)
    );
    const result=window.liquidGL({...base,reveal:'none',target:'.glass',snapshot:'#scene',on:{init:gate.onInit}});
    lenses=Array.isArray(result)?result:[result];
    lenses.forEach(l=>{if(l?.options)l.options={...l.options}});
    // Recompose foreground lettering after every video frame, so lenses retain it.
    if(overlays.length)window.liquidGL.registerDynamic(overlays);
    if(page==='showcase')tune({...base,refraction:.0535,aberration:.7,bevelDepth:.206,bevelWidth:.24,magnify:1.15});
    window.dispatchEvent(new Event('glass-ready'));
    if(window.__liquidGLNoWebGL__){finish('Soft glass mode');return}
    await gate.ready;
    finish('WebGL active');
   }catch(error){console.error(error);fallback()}
  };
  init();
  return()=>{cancelled=true;clearTimeout(timeout);clearTimeout(exitTimer);controller.abort()};
 },[]);
 return <><Background/><header className="topbar"><a className="brand" href="/"><Mark/><span>paulolo.com</span><b>liquid.</b></a><nav aria-label="Experiments">{['showcase','dashboard','playground'].map((p,i)=><a key={p} href={`?view=${p}`} aria-current={page===p?'page':undefined}><span>0{i+1}</span>{p}</a>)}</nav><a className="github-link" href="https://github.com/paulo-evangelista/liquid" target="_blank" rel="noreferrer" aria-label="View paulolo.com liquid on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .297a12 12 0 0 0-3.793 23.385c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.52 11.52 0 0 1 6.006 0c2.291-1.553 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.216.694.825.576A12 12 0 0 0 12 .297Z"/></svg><span>GitHub</span></a></header><main>{page==='playground'?<Playground/>:page==='showcase'?<Showcase/>:<Dashboard/>}</main><footer><span><i className={status==='WebGL active'?'live':''}/> {status}</span><span>REFRACTION, NOT AN IMITATION.</span><a href="https://github.com/naughtyduk/liquidGL" target="_blank" rel="noreferrer">LiquidGL ↗</a></footer></>;
}
function Dashboard(){
 const [period,setPeriod]=useState('Week'); const [playing,setPlaying]=useState(true);const [tab,setTab]=useState('All projects');
 const stats=period==='Week'?['128,430','4,862','98.6%']:['492,816','18,204','99.2%'];
 return <div className="dashboard page-wrap"><div className="page-heading"><div><div className="eyebrow">EXPERIMENT 02 / A CLEARER PERSPECTIVE</div><h1>Your world.<br/><span>In a different light.</span></h1></div><div className="heading-aside"><span className="sample-tag">FICTIONAL STUDIO DATA</span><p>Thursday, September 10</p><div className="segmented">{['Week','Month'].map(x=><button className={period===x?'selected':''} onClick={()=>setPeriod(x)} key={x}>{x}</button>)}</div></div></div><div className="dashboard-grid"><Glass className="welcome"><div className="card-top"><span>STUDIO OVERVIEW</span><span>↗</span></div><h2>Good things<br/>are taking shape.</h2><p>A little focus. A little flow.<br/>A whole new point of view.</p><div className="avatars"><span>JL</span><span>AM</span><span>SK</span><small>+ 4 in the studio</small></div></Glass><Glass className="metric"><div className="card-top"><span>IMPRESSIONS</span><span>◉</span></div><strong>{stats[0]}</strong><span className="gain">↗ 18.4% <small>vs. previous {period.toLowerCase()}</small></span><Spark/></Glass><Glass className="metric"><div className="card-top"><span>ENGAGEMENTS</span><span>⌁</span></div><strong>{stats[1]}</strong><span className="gain">↗ 12.8% <small>vs. previous {period.toLowerCase()}</small></span><div className="bars">{[28,48,39,64,46,78,63,91,74,95,82,100].map((h,i)=><i key={i} style={{height:h+'%'}}/>)}</div></Glass><Glass className="activity"><div className="card-top"><span>THE BIG PICTURE</span><span>↗</span></div><div className="chart-heading"><h2>A {period.toLowerCase()} in motion</h2><span><i/> Reach <i/> Engagement</span></div><div className="chart"><div className="chart-labels"><span>150k</span><span>100k</span><span>50k</span><span>0</span></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" role="img" aria-label={`${period} reach chart, trending upward`}><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d9fc80" stopOpacity=".35"/><stop offset="1" stopColor="#d9fc80" stopOpacity="0"/></linearGradient></defs>{[20,70,120,170].map(y=><path key={y} d={`M0 ${y}H700`} stroke="#ffffff18" strokeDasharray="3 6"/>)}<path d={period==='Week'?'M0 143 C40 150 50 80 105 100S180 150 220 85S300 30 350 55S440 110 480 58S550 83 590 30S650 65 700 13V190H0Z':'M0 155 Q80 170 150 100T300 110T440 60T580 50T700 5V190H0Z'} fill="url(#fill)"/><path d={period==='Week'?'M0 143 C40 150 50 80 105 100S180 150 220 85S300 30 350 55S440 110 480 58S550 83 590 30S650 65 700 13':'M0 155 Q80 170 150 100T300 110T440 60T580 50T700 5'} fill="none" stroke="#e3ff9b" strokeWidth="3"/><path d="M0 170 Q60 115 120 153T230 128T340 135T450 103T560 120T700 68" fill="none" stroke="#bec7b3" strokeWidth="2" strokeDasharray="4 6"/></svg></div><div className="chart-days">{(period==='Week'?['MON','TUE','WED','THU','FRI','SAT','SUN']:['SEP 1','SEP 5','SEP 10','SEP 15','SEP 20','SEP 25','SEP 30']).map(d=><span key={d}>{d}</span>)}</div></Glass><Glass className="focus"><div className="card-top"><span>IN YOUR ELEMENT</span><span>✳</span></div><div className="focus-ring"><div><strong>{stats[2]}</strong><span>IN THE FLOW</span></div></div><div className="focus-bottom"><div><b>Deep focus</b><small>{playing?'Session in progress':'Session paused'}</small></div><button aria-label={playing?'Pause focus session':'Resume focus session'} onClick={()=>setPlaying(!playing)}>{playing?'Ⅱ':'▶'}</button></div></Glass><Glass className="projects"><div className="card-top"><span>ON THE HORIZON</span><div className="text-tabs">{['All projects','In progress'].map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?'active':''}>{t}</button>)}</div></div>{[['↗','Forma identity','Brand direction','In progress','72'],['◈','Orbital website','Digital experience','In progress','48'],['✳','Field notes','Editorial design','In review','94']].filter(p=>tab==='All projects'||p[3]===tab).map(([icon,name,desc,state,progress])=><div className="project-row" key={name}><span className="project-icon">{icon}</span><div><b>{name}</b><small>{desc}</small></div><span className="project-status">{state}</span><div className="project-progress"><i style={{width:progress+'%'}}/></div><span>{progress}%</span></div>)}</Glass><Glass className="note"><span className="eyebrow">A NOTE ON THE MATERIAL</span><p>Everything looks<br/>better through<br/><em>a new lens.</em></p><a href="?view=playground">Make it your own <span>↗</span></a></Glass></div></div>
}
function Spark(){return <svg className="spark" viewBox="0 0 280 70" aria-hidden="true"><path d="M0 60L25 50L44 55L66 30L88 38L110 34L132 45L155 24L178 28L198 8L220 18L245 8L280 2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}
function Playground(){
 const [settings,setSettings]=useState({...base}),[preset,setPreset]=useState('Crystal'),[shape,setShape]=useState('Card'),[message,setMessage]=useState(''),[running,setRunning]=useState(!reduced);
 const change=(key,value)=>{setPreset('Custom');setSettings(s=>({...s,[key]:value}))};
 useEffect(()=>{tune(settings);const ready=()=>tune(settings);window.addEventListener('glass-ready',ready);return()=>window.removeEventListener('glass-ready',ready)},[settings]);
 useEffect(()=>{const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();Promise.resolve(context.registerTool({name:'configure_glass',description:'Set optical settings on the playground preview lens.',inputSchema:{type:'object',properties:Object.fromEntries(Object.entries(ranges).map(([key,[minimum,maximum]])=>[key,{type:'number',minimum,maximum}])),additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{validateSettings(input);tune(input);setSettings(s=>({...s,...input}));setPreset('Custom');await new Promise(requestAnimationFrame);return {applied:input}}},{signal:lifecycle.signal})).catch(console.warn);return()=>lifecycle.abort()},[]);
 const code=JSON.stringify(settings,null,2);
 const recapture=()=>{const renderer=window.__liquidGLRenderer__;if(renderer){renderer._snapshotResolution=settings.resolution;renderer.captureSnapshot();lenses.filter(l=>l?.el?.hasAttribute('data-tunable')).forEach(l=>{l.revealTypeIndex=settings.reveal==='fade'?1:0;l._reveal()});setMessage('Snapshot refreshed · reveal replayed')}};
 return <div className="page-wrap playground"><div className="page-heading"><div><div className="eyebrow">EXPERIMENT 03 / THE MATERIAL LAB</div><h1>The optical bench.</h1><p className="intro">Bend light. Find your material. Take the settings with you.</p></div><button className="outline-button" onClick={()=>{setSettings({...base});setPreset('Crystal');setShape('Card');setMessage('Settings reset')}}>↺ Reset all</button></div><div className="lab-layout"><Glass className="controls"><div className="card-top"><span>01 / MATERIAL</span><span>⌘</span></div><label className="select-label">Start with a preset<select value={preset} onChange={e=>{setPreset(e.target.value);setSettings({...presets[e.target.value]})}}>{!presets[preset]&&<option>Custom</option>}{Object.keys(presets).map(p=><option key={p}>{p}</option>)}</select></label>{[['Refraction','refraction','How far light bends'],['Chromatic aberration','aberration','Separate the color channels'],['Bevel depth','bevelDepth','The thickness of the edge'],['Bevel width','bevelWidth','Where the edge becomes flat'],['Frost','frost','Soften the world behind the lens'],['Magnification','magnify','Bring the background closer']].map(([label,key,hint])=><Range key={key} label={label} setting={key} value={settings[key]} onChange={v=>change(key,v)} hint={hint}/>)}<div className="toggle-group">{[['Specular highlights','specular'],['Drop shadow','shadow'],['Pointer tilt','tilt']].map(([label,key])=><label className="toggle" key={key}>{label}<input type="checkbox" checked={settings[key]} onChange={e=>change(key,e.target.checked)}/></label>)}</div><Range label="Tilt strength" setting="tiltFactor" value={settings.tiltFactor} onChange={v=>change('tiltFactor',v)}/><Range label="Tilt easing · ms" setting="tiltEase" value={settings.tiltEase} onChange={v=>change('tiltEase',v)}/></Glass><div className="lab-preview"><div className="preview-top"><span className="eyebrow">LIVE SPECIMEN / {preset.toUpperCase()}</span><button className="outline-button" onClick={()=>{setRunning(!running);window.dispatchEvent(new CustomEvent('light-field',{detail:{paused:running}}))}}>{running?'Ⅱ Freeze background':'▶ Animate background'}</button></div><div className="specimen-stage"><Glass data-tunable="" className={`specimen shape-${shape.toLowerCase()}`}><div className="specimen-label">PAULOLO.COM / OPTICAL GRADE</div><span className="specimen-symbol">✳</span><h2>Less surface.<br/>More substance.</h2><p>Move your pointer over the glass.<br/>Try tilt, frost, and dispersion.</p><span className="specimen-number">n° 001</span></Glass></div><div className="shape-switch"><span>GEOMETRY</span><div className="segmented">{['Card','Circle','Pill'].map(s=><button key={s} onClick={()=>setShape(s)} className={shape===s?'selected':''}>{s}</button>)}</div></div><Glass className="capture-panel"><div className="card-top"><span>02 / CAPTURE & REVEAL</span><span>↻</span></div><p className="small-copy">Choose the clarity and entrance of your glass, then apply your changes.</p><Range label="Snapshot resolution" setting="resolution" value={settings.resolution} onChange={v=>change('resolution',v)}/><div className="capture-bottom"><label>Reveal <select value={settings.reveal} onChange={e=>change('reveal',e.target.value)}><option value="fade">Fade</option><option value="none">None</option></select></label><button className="acid-button" onClick={recapture}>Apply & replay ↗</button></div></Glass><Glass className="code-panel"><div className="card-top"><span>03 / YOUR RECIPE</span><button onClick={async()=>{try{await navigator.clipboard.writeText(code);setMessage('Configuration copied')}catch{setMessage('Clipboard unavailable. Select and copy the code below.')}}}>Copy settings ↗</button></div><pre tabIndex="0">{code}</pre><p className="feedback" role="status">{message||'Your material, captured in a recipe.'}</p></Glass></div></div></div>
}
function Range({label,setting,value,onChange,hint}){const [min,max,step]=ranges[setting];return <label className="range-label"><span>{label}<output>{Number(value).toFixed(step<.01?3:step<1?2:0)}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>{hint&&<small>{hint}</small>}</label>}
function Showcase(){
 const [palette,setPalette]=useState(0),[paused,setPaused]=useState(reduced),[power,setPower]=useState(.7),[pos,setPos]=useState({x:0,y:0}),[fullscreen,setFullscreen]=useState(false),[notice,setNotice]=useState('');const drag=useRef(null);
 useEffect(()=>{window.dispatchEvent(new CustomEvent('light-field',{detail:{palette,paused}}))},[palette,paused]);
 useEffect(()=>{tune({aberration:power,bevelDepth:.08+power*.18,refraction:.015+power*.055});},[power]);
 useEffect(()=>{lenses.filter(l=>l?.el?.hasAttribute('data-tunable')).forEach(l=>l.updateMetrics())},[pos]);
 useEffect(()=>{const change=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change)},[]);
 const move=e=>{if(!drag.current)return;setPos({x:Math.max(-innerWidth*.3,Math.min(innerWidth*.2,drag.current.px+e.clientX-drag.current.x)),y:Math.max(-130,Math.min(180,drag.current.py+e.clientY-drag.current.y))})};
 return <div className="showcase"><div className="showcase-heading"><span className="eyebrow">EXPERIMENT 01 / STEP INTO THE LIGHT FIELD</span><div className="showcase-meta">NO TEXTURE IS EVER STILL.<br/>NO VIEW IS EVER THE SAME.</div></div><div className="showcase-stage"><div className="hero-copy"><h1>Reality,<br/>beautifully<br/><em>distorted.</em></h1><p>A living field of light.<br/>An impossible piece of glass.<br/>Your very own point of view.</p></div><Glass data-tunable="" className="hero-lens" style={{translate:`${pos.x}px ${pos.y}px`}}><div className="lens-handle" role="slider" tabIndex="0" aria-label="Move glass lens horizontally" aria-valuemin={-30} aria-valuemax={20} aria-valuenow={Math.round(pos.x/innerWidth*100)} onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,px:pos.x,py:pos.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={move} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();setPos(p=>({x:Math.max(-innerWidth*.3,Math.min(innerWidth*.2,p.x+(e.key==='ArrowLeft'?-15:e.key==='ArrowRight'?15:0))),y:Math.max(-130,Math.min(180,p.y+(e.key==='ArrowUp'?-15:e.key==='ArrowDown'?15:0)))}))}}}><span className="crosshair">+</span><span className="lens-caption">MOVE ME. CHANGE EVERYTHING.</span><span className="lens-bottom">OPTICAL SPECIMEN / 001</span></div></Glass><Glass className="floating-tag"><span className="tag-glyph">✳</span><div>Pure light.<small>Refracted in real time.</small></div></Glass><Glass className="coordinate-tag"><span>REFRACTION</span><strong>{(.015+power*.055).toFixed(3)}</strong><div className="mini-spectrum"/></Glass><span className="stage-coordinate">X {pos.x.toFixed(0)} / Y {pos.y.toFixed(0)}<br/>DRAG THE LENS · ARROW KEYS WORK TOO</span></div><Glass className="showcase-console"><div className="console-title"><Mark/><span>Make light<br/><b>your playground.</b></span></div><div className="palette-control"><span>01 / FREQUENCY</span><div>{['Chlorophyll','Glacier','Ember'].map((p,i)=><button key={p} aria-pressed={palette===i} className={`swatch swatch-${i} ${palette===i?'chosen':''}`} onClick={()=>setPalette(i)}><i/>{p}</button>)}</div></div><label className="intensity-control"><span>02 / DISTORTION <output>{Math.round(power*100)}%</output></span><input type="range" aria-label="Distortion" min="0" max="1" step=".01" value={power} onChange={e=>setPower(Number(e.target.value))}/></label><div className="console-actions"><button aria-label={paused?'Play light field':'Pause light field'} onClick={()=>setPaused(!paused)}>{paused?'▶':'Ⅱ'}</button><button aria-label="Reset lens position" onClick={()=>setPos({x:0,y:0})}>↺</button><button aria-label={fullscreen?'Exit fullscreen':'Enter fullscreen'} onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{setNotice('Fullscreen is unavailable in this browser.')}}}>⛶</button></div></Glass><p className="showcase-credit">A STUDY IN LIGHT BY PAULOLO.COM<span role="status">{notice}</span></p></div>
}
createRoot(document.getElementById('root')).render(<App/>);
