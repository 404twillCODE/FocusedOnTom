(() => {
 'use strict';
 if(!document.body.hasAttribute('data-scroll-site'))return;
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],T=window.Tom;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const routeIds={'/':'home','/behind-the-lens/':'behind-the-lens','/inside-the-code/':'inside-the-code','/off-the-grid/':'off-the-grid','/explore-new-york/':'explore-new-york','/workshop/':'workshop'};
 const chapters=[['introduction','00','The beginning'],['explore-new-york','01','Explore New York'],['behind-the-lens','02','Behind the Lens'],['inside-the-code','03','Inside the Code'],['off-the-grid','04','Off the Grid'],['workshop','05','The Workshop']];
 // One document, one ending. The optional tools retain their original state and handlers.
 $('#introduction').after($('#explore-new-york'));
 const closing=$('.closing');$('main').append(closing);closing.id='the-ending';
 $('.journey-ribbon').remove();$('.journey-tools').remove();$('.discovery-pocket').remove();
 $$('.next-world,.chapter-end').forEach(e=>e.remove());
 $$('.learning-grid details').forEach(d=>d.open=true);
 $('#worlds .section-heading h1').innerHTML='One story.<br><span class="muted">Keep following it.</span>';
 $$('.world-card .card-link').forEach(e=>e.innerHTML='COMING UP AS YOU SCROLL <b>↓</b>');
 const meter=document.createElement('div');meter.className='scroll-position';meter.innerHTML='<span id="scroll-chapter-label">00 / THE BEGINNING</span><div class="scroll-position-track"><i></i></div><span id="scroll-percent">0%</span>';$('header').after(meter);
 const path=document.createElement('nav');path.className='scroll-chapters';path.setAttribute('aria-label','Jump to a chapter');path.innerHTML=chapters.map(([id,n,name])=>`<a href="#${id}" aria-label="${name}"><span>${n}</span><b>${name}</b></a>`).join('');document.body.append(path);
 const scenes=[];
 const copy={
  'behind-the-lens':['02 / A DIFFERENT WAY OF SEEING','BEHIND<br>THE LENS.','The world is full of things worth a closer look.','FOCUS / FRAME / MAKE SOMETHING'],
  'inside-the-code':['03 / CURIOSITY, COMPILED','INSIDE<br>THE CODE.','A question becomes an idea. An idea becomes a build.','NODEXITY / GALLERYX / THE NEXT IDEA'],
  'explore-new-york':['01 / TAKE THE LONG WAY','EXPLORE<br>NEW YORK.','A few places. A lot of reasons to head outside.','WATER / TRAILS / FIELD NOTES'],
  'off-the-grid':['04 / ROOM TO BREATHE','OFF<br>THE GRID.','The boat. The woods. Enough time to actually be there.','CAMP / CAST / STAY A LITTLE LONGER'],
  'workshop':['05 / ALWAYS IN PROGRESS','THE<br>WORKSHOP.','There is always one more thing to figure out.','OPEN QUESTIONS / UNFINISHED IDEAS']
 };
 for(const [id,values] of Object.entries(copy)){
  const root=$('#'+id),old=$('.chapter-hero',root),scene=document.createElement('section');scene.className='scroll-scene scene-'+id;scene.setAttribute('aria-label',values[1].replace('<br>',' '));
  const image=['behind-the-lens','explore-new-york','off-the-grid'].includes(id);
  scene.innerHTML=`<div class="scroll-stage">${image?'<img class="scene-photo" src="/landscape.jpg" alt="" width="1920" height="1280" loading="lazy">':'<div class="scene-grid" aria-hidden="true"></div>'}<div class="scene-shade"></div><div class="scene-frame" aria-hidden="true"></div><div class="scene-content"><span class="eyebrow">${values[0]}</span><h2>${values[1]}</h2><p>${values[2]}</p></div>${id==='inside-the-code'?'<pre class="scroll-code" aria-hidden="true"><span>const curiosity = Infinity;</span><span>const ideas = [</span><span>  "Nodexity",</span><span>  "GalleryX"</span><span>];</span><span>keepBuilding();</span></pre>':''}<div class="scene-bottom"><span>${values[3]}</span><span>KEEP SCROLLING ↓</span></div><div class="scene-line"><i></i></div></div>`;
  old.replaceWith(scene);scenes.push(scene);
 }
 // Make the two project backstories part of the reading flow.
 const storyRoot=$('#story-layout');let projectNotes=[];
 $$('[data-story]').forEach(b=>{b.click();projectNotes.push('<article class="scroll-project-note">'+storyRoot.innerHTML+'</article>')});
 if(projectNotes.length){storyRoot.innerHTML=projectNotes.join('');storyRoot.className='scroll-project-notes';$('.story-selector').hidden=true;}
 const lensStory=document.createElement('div');lensStory.className='scroll-invitation';lensStory.innerHTML='<span class="eyebrow">THE STORY KEEPS MOVING</span><h3>Stay for the view.<br>Stop and make something.</h3><p>The darkroom, camera studies, and creative challenges are all here along the way. Try one, or keep scrolling into the next part of the story.</p>';$('#darkroom').before(lensStory);
 const workshopText=$('#workshop-bench .section-heading p');if(workshopText)workshopText.innerHTML='The final chapter.<br>A few experiments to come back to.';
 // Convert old route links—including links generated inside dialogs—to in-page destinations.
 function destination(a){const url=new URL(a.href,location.href);if(url.origin!==location.origin)return null;const key=url.pathname.endsWith('/')?url.pathname:url.pathname+'/';if(!(key in routeIds))return null;let id=url.hash.slice(1)||routeIds[key];try{id=decodeURIComponent(id)}catch{}return document.getElementById(id)?id:null}
 function linkify(root=document){$$('a[href]',root).forEach(a=>{const id=destination(a);if(id)a.setAttribute('href','#'+id)})}linkify();
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.hasAttribute('download')||a.target||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button>0)return;const id=destination(a);if(!id)return;e.preventDefault();e.stopImmediatePropagation();$$('dialog[open]').forEach(d=>d.close());history.pushState(null,'','#'+id);document.getElementById(id).scrollIntoView({behavior:T.motion()?'smooth':'auto',block:'start'});},true);
 // A small reveal on real content, with all content readable if animation is disabled.
 const items=$$('.expedition-section .section-heading,.lab-panel,.now-card,.gear-detail,.project-tile,.story-step,.number-grid>a,.archive-card');
 items.forEach((e,i)=>{e.classList.add('scroll-reveal');e.style.setProperty('--reveal-delay',(i%3)*55+'ms')});
 const reveal=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('is-revealed');reveal.unobserve(target)}}),{threshold:.08});items.forEach(e=>reveal.observe(e));
 const chaptersEls=chapters.map(([id])=>$('#'+id));
 // Long visual beats: their state is a function of scroll, so reversing scroll reverses them.
 const desk=null,life=$('#life-map'),boat=$('#boat-lab'),camp=null,focal=$('#focal-journey');
 if(life){const pin=document.createElement('div');pin.className='life-pin';while(life.firstChild)pin.append(life.firstChild);life.append(pin);life.classList.add('life-scroll-track');}
 for(const el of [desk,life,boat])if(el)el.classList.add('scroll-feature');
 const features=[desk,life,boat].filter(Boolean);let pending=false,lastLife=-1,lastDesk=-1,lastChapter=-1;
 function progress(el){const r=el.getBoundingClientRect();return clamp((innerHeight*.72-r.top)/(r.height+innerHeight*.25))}
 function render(){pending=false;const motion=T.motion(),max=document.documentElement.scrollHeight-innerHeight,overall=clamp(scrollY/Math.max(1,max));meter.style.setProperty('--position',overall);$('#scroll-percent').textContent=Math.round(overall*100)+'%';let current=0;
  chaptersEls.forEach((el,i)=>{if(el.getBoundingClientRect().top<innerHeight*.45)current=i});
  if(current!==lastChapter){lastChapter=current;$('#scroll-chapter-label').textContent=chapters[current][1]+' / '+chapters[current][2].toUpperCase();$$('a',path).forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});document.body.dataset.currentChapter=chapters[current][0];}
  for(const scene of scenes){const r=scene.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;const p=clamp(-r.top/Math.max(1,r.height-innerHeight));scene.style.setProperty('--scene-p',motion?p:1);scene.style.setProperty('--scene-scale',motion?1.2-p*.2:1);scene.style.setProperty('--scene-y',motion?(1-p)*65+'px':'0px');scene.style.setProperty('--scene-inset',motion?(1-p)*24+'%':'0%');scene.style.setProperty('--scene-turn',motion?(1-p)*-7+'deg':'0deg');scene.style.setProperty('--scene-title',motion?clamp(p*3+.15):1);}
  for(const el of features){const r=el.getBoundingClientRect();if(r.top>innerHeight||r.bottom<0)continue;el.style.setProperty('--feature-progress',progress(el));}
  if(motion&&life){const r=life.getBoundingClientRect();if(r.top<innerHeight*.7&&r.bottom>innerHeight*.3){const index=Math.min(5,Math.floor(clamp(-r.top/Math.max(1,r.height-innerHeight))*6));if(index!==lastLife){lastLife=index;$(`[data-life="${index}"]`)?.click()}}}
  if(motion&&desk){const r=desk.getBoundingClientRect();if(r.top<innerHeight*.6&&r.bottom>innerHeight*.4){const index=Math.min(5,Math.floor(progress(desk)*6));if(index!==lastDesk){lastDesk=index;$(`[data-desk="${index}"]`)?.click()}}}
  if(motion&&boat){const r=boat.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){const p=progress(boat);$$('.boat-drawing svg>g>path').forEach(e=>{e.style.strokeDasharray='1800';e.style.strokeDashoffset=String(1800*(1-clamp(p*2)))});}}
  if(motion&&camp&&!camp.dataset.userControlled){const r=camp.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0){const input=$('#camp-time'),n=Math.round(progress(camp)*100);if(+input.value!==n){input.value=n;input.dispatchEvent(new Event('input'))}}}
  const currentRoot=chaptersEls[current];if(currentRoot.getBoundingClientRect().bottom<innerHeight*1.3){const ids={'behind-the-lens':'world-lens','inside-the-code':'world-code','off-the-grid':'world-grid','workshop':'workshop'};if(ids[currentRoot.id])T.unlock(ids[currentRoot.id])}
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(render)}}
 $('#camp-time')?.addEventListener('pointerdown',()=>camp.dataset.userControlled='true');$('#camp-time')?.addEventListener('keydown',()=>camp.dataset.userControlled='true');
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});new ResizeObserver(schedule).observe($('main'));new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
 const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');systemMotion.addEventListener('change',schedule);
 // Replace the original focal handler's short sweep with the longer scroll feature.
 if(focal)focal.classList.add('scroll-focal');
 if(location.hash){requestAnimationFrame(()=>{const el=document.getElementById(location.hash.slice(1));el?.scrollIntoView({behavior:'instant'})})}
 render();T.reveal();
})();
