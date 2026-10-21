/* Apply locally saved appearance before the first paint. No network or account. */
(() => {
  const themes={evergreen:['#141910','#1c2418','#0e130c','#f4f6ef','#d5dccb','#5d6a52'],midnight:['#0e1218','#171c27','#10141c','#f7f8fb','#d5dbe6','#5c6780'],steel:['#12181e','#1c252e','#0c1218','#f3f7f8','#d2dee4','#5a6d78'],mono:['#121212','#1c1c1c','#0c0c0c','#f6f6f3','#d4d4ce','#5e5e5a']};
  const defaults={theme:'midnight',accent:'#e6b325',motion:'cinematic',grain:false,sound:false,background:'',text:''};
  let config={...defaults};try{Object.assign(config,JSON.parse(localStorage.getItem('tom-appearance-v3')||'{}'))}catch{}
  try{if(!localStorage.getItem('tom-plain-v1')){config.grain=false;if(['#7dd3fc','#d8f66e','#ba9bff'].includes(String(config.accent).toLowerCase()))config.accent=defaults.accent;localStorage.setItem('tom-appearance-v3',JSON.stringify(config));localStorage.setItem('tom-plain-v1','1');}}catch{}
  if(!themes[config.theme])config.theme='midnight';
  if(!/^#[\da-f]{6}$/i.test(config.accent))config.accent=defaults.accent;
  if(!['off','subtle','cinematic','full'].includes(config.motion))config.motion=defaults.motion;
  if(!/^#[\da-f]{6}$/i.test(config.background))config.background='';
  if(!/^#[\da-f]{6}$/i.test(config.text))config.text='';
  const root=document.documentElement;
  const luminance=c=>{const v=c.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
  function apply(){
    const t=themes[config.theme];['--bg','--surface','--surface-deep','--ink','--muted','--line'].forEach((v,i)=>root.style.setProperty(v,t[i]));
    if(config.background)root.style.setProperty('--bg',config.background);
    if(config.text)root.style.setProperty('--ink',config.text);
    root.style.setProperty('--acid',config.accent);
    root.style.setProperty('--on-accent',luminance(config.accent)>.4?'#101827':'#ffffff');
    const a=luminance(config.accent),b=luminance(config.background||t[0]);
    root.style.setProperty('--accent-text',(Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3?config.accent:(b<.4?'#f7f3e6':'#1a1408'));
    root.dataset.theme=config.theme;root.dataset.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'off':config.motion;
  }
  apply();window.TomTheme={config,defaults,themes,apply};
})();
