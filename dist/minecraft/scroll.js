'use strict';
(() => {
 const sequence=document.querySelector('.minecraft-sequence');if(!sequence)return;
 const pin=document.querySelector('.minecraft-pin'),library=document.querySelector('.mc-library'),intro=document.querySelector('.minecraft-intro'),stage=document.querySelector('.block-stage');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=n=>Math.min(1,Math.max(0,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n)},mix=(a,b,t)=>a+(b-a)*t;
 let queued=false,rendered=null,previous=performance.now();
 function update(now=performance.now()){
  queued=false;const target=clamp(scrollY/Math.max(1,sequence.offsetHeight-innerHeight)),elapsed=Math.min(64,Math.max(1,now-previous));previous=now;
  if(rendered===null||motion.matches)rendered=target;else rendered+=(target-rendered)*(1-Math.exp(-elapsed/105));
  if(Math.abs(target-rendered)<.0001)rendered=target;
  const p=rendered,turn=ease(p/.55),expand=motion.matches?1:ease((p-.55)/.4),heading=1-ease((p-.07)/.22),size=stage.offsetWidth*1.45;
  // Keep all six cube faces opaque. Reveal the collection as a separate surface.
  pin.style.setProperty('--heading-opacity',heading);pin.style.setProperty('--heading-y',(-45*(1-heading))+'px');
  pin.style.setProperty('--block-rotation',(-35+35*turn)+'deg');pin.style.setProperty('--block-x',(-24+24*turn)+'deg');pin.style.setProperty('--block-scale',1+.45*turn);pin.style.setProperty('--block-y','0px');pin.style.setProperty('--screen-open',ease((p-.52)/.03));
  const width=mix(size,innerWidth,expand),height=mix(size,innerHeight,expand);
  library.style.setProperty('--surface-left',mix((innerWidth-size)/2,0,expand)+'px');library.style.setProperty('--surface-top',mix(innerHeight*.58-size/2,0,expand)+'px');
  library.style.setProperty('--surface-width',width+'px');library.style.setProperty('--surface-height',height+'px');library.style.setProperty('--surface-scale',width/innerWidth);library.style.setProperty('--surface-radius',(12*(1-expand))+'px');library.style.setProperty('--content-reveal',1);
  library.style.visibility=motion.matches||p>=.55?'visible':'hidden';library.inert=!motion.matches&&expand<.995;library.classList.toggle('is-expanded',motion.matches||expand>.995);
  intro.inert=!motion.matches&&heading<.1;intro.style.visibility=!motion.matches&&expand===1?'hidden':'visible';
  document.querySelector('.mc-header').style.opacity=String(1-expand);document.querySelector('.mc-header').inert=expand>.9;
  if(rendered!==target&&!motion.matches)request();
 }
 function request(){if(!queued){queued=true;requestAnimationFrame(update)}}
 addEventListener('scroll',request,{passive:true});addEventListener('resize',()=>{rendered=null;request()});motion.addEventListener('change',()=>{rendered=null;request()});
 function openCollection(behavior='smooth'){if(motion.matches)library.scrollIntoView({behavior:'instant'});else scrollTo({top:sequence.offsetHeight-innerHeight,behavior})}
 document.querySelectorAll('a[href="#collection"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'','#collection');openCollection()}));
 library.addEventListener('wheel',event=>{
  if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||motion.matches)return;
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if((delta<0&&library.scrollTop<=0)||(delta>0&&library.scrollTop+library.clientHeight>=library.scrollHeight-1)){event.preventDefault();scrollBy({top:delta,behavior:'instant'})}
 },{passive:false});
 document.querySelectorAll('.mod-tile').forEach(link=>link.addEventListener('click',()=>history.replaceState({libraryScroll:library.scrollTop},'','#collection')));
 if(location.hash==='#collection')requestAnimationFrame(()=>{openCollection('instant');rendered=null;library.scrollTop=history.state?.libraryScroll||0;update()});
 update();
})();
