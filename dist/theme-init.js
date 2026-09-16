/* Apply locally saved appearance before the first paint. No network or account. */
(() => {
  const themes={evergreen:['#171c16','#20271c','#101711','#eef0dc','#a3aa97','#3c4434'],midnight:['#11141d','#1c2030','#0d1018','#f0f3fc','#a7afc2','#363e55'],steel:['#182027','#252f38','#10181e','#e9f2f5','#a2b6c0','#405360'],mono:['#171717','#262626','#101010','#f0f0ed','#adada8','#41413e']};
  const defaults={theme:'evergreen',accent:'#d8f66e',motion:'cinematic',grain:false,sound:false,background:'',text:''};
  let config={...defaults};try{Object.assign(config,JSON.parse(localStorage.getItem('tom-appearance-v3')||'{}'))}catch{}
  if(!themes[config.theme])config.theme='evergreen';
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
    root.style.setProperty('--on-accent',luminance(config.accent)>.4?'#10150c':'#ffffff');
    const a=luminance(config.accent),b=luminance(config.background||t[0]);
    root.style.setProperty('--accent-text',(Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3?config.accent:(b<.4?'#e7f4d5':'#13200b'));
    root.dataset.theme=config.theme;root.dataset.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'off':config.motion;
  }
  apply();window.TomTheme={config,defaults,themes,apply};
})();
