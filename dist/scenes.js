'use strict';
history.scrollRestoration='manual';
let routeReady=false,restoringRoute=false,routeRestoreToken=0;
let navigationController;
const $ = (s) => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Scroll position drives the complete device choreography; no timed entrance trigger.
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const photoScene = $('#photography'), projectScene = $('#projects');
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n=clamp(n); return n*n*(3-2*n); };
let framePending=false, renderedProgress=null, previousFrame=0;
const sequence=$('.device-sequence');
// Keep one live application per scene; move it out of the 3D frame while zoomed.
const surfaces=[['photo','.photo-app'],['project','.editor']].map(([name,selector])=>{
 const app=$(selector),home=document.createElement('div'),layer=document.createElement('div');
 home.className=name+'-surface-home';app.before(home);home.append(app);
 layer.className='immersive-surface immersive-'+name;layer.dataset.loading=name==='photo'?'Opening the photo library':'Starting the workspace';layer.hidden=true;const loader=document.createElement('div');loader.className='surface-loader';loader.setAttribute('aria-hidden','true');loader.innerHTML=document.querySelector(name==='photo'?'.photo-boot':'.desktop-boot').innerHTML;layer.append(loader);document.body.append(layer);
 layer.addEventListener('wheel',continuePageScroll,{passive:false});
 return {name,app,home,layer};
});
function expandSurface(surface,amount,ready){
 const {app,home,layer,name}=surface,project=name==='project';
 if(amount<.001){
  if(app.parentElement===layer)home.append(app);layer.hidden=true;
  if(!project){home.style.height='';app.classList.remove('expanded-app')}
  else{app.classList.add('expanded-app');sizeProjectSurface(app,home.clientWidth,home.clientHeight)}
  return;
 }
 if(app.parentElement!==layer){if(!project)home.style.height=app.offsetHeight+'px';layer.append(app)}
 const rect=home.getBoundingClientRect(),mix=(a,b)=>a+(b-a)*amount;
 const width=mix(rect.width,document.documentElement.clientWidth),height=mix(rect.height,innerHeight);
 layer.hidden=false;layer.style.left=mix(rect.left,0)+'px';layer.style.top=mix(rect.top,0)+'px';layer.style.width=width+'px';layer.style.height=height+'px';
 layer.style.borderRadius=(8*(1-amount))+'px';layer.style.setProperty('--app-reveal',String(ready));layer.style.setProperty('--screen-opacity','1');layer.style.setProperty('--expansion',String(amount));layer.inert=ready<.9;
 app.classList.toggle('expanded-app',project||amount>.65);layer.classList.toggle('is-ready',ready>.98);
 if(project)sizeProjectSurface(app,width,height);
}
function sizeProjectSurface(app,width,height){const scale=width/document.documentElement.clientWidth;app.style.width=document.documentElement.clientWidth+'px';app.style.height=(height/Math.max(.01,scale))+'px';app.style.transform=`scale(${scale})`}
// Inner lists can scroll, but reaching their edge always continues the page.
// Handle only vertical wheel gestures; preserve pinch zoom and horizontal browsing.
function continuePageScroll(event){
 if(event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
 const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
 for(let el=event.target;el instanceof HTMLElement&&el!==event.currentTarget;el=el.parentElement){
  if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+1){
   const canScroll=delta>0?el.scrollTop+el.clientHeight<el.scrollHeight-1:el.scrollTop>1;
   if(canScroll)return;
  }
 }
 event.preventDefault();scrollBy({top:delta,behavior:'instant'});
}
const startup={photo:{start:null,value:0},desktop:{start:null,value:0}};
function bootProgress(key,ready,reset,still,timestamp){
 const boot=startup[key];
 if(still){boot.value=1;return 1}
 if(reset){boot.start=null;boot.value=0}
 else if(ready&&boot.start===null)boot.start=timestamp;
 if(boot.start!==null)boot.value=clamp((timestamp-boot.start)/(key==='photo'?1000:1600));
 return boot.value;
}
function headerHeight(){return 0}
function sequenceTravel(){return Math.max(1,sequence.offsetHeight-(innerHeight-headerHeight()))}
function sceneProgress(){return clamp((headerHeight()-sequence.getBoundingClientRect().top)/sequenceTravel())}
function updateScenes(timestamp=performance.now()){
 framePending=false;
 const still=motionQuery.matches;
 document.body.classList.toggle('scroll-scenes',!still);
 const target=sceneProgress();
 const elapsed=Math.min(64,Math.max(1,timestamp-previousFrame));previousFrame=timestamp;
 if(still||renderedProgress===null)renderedProgress=target;
 else renderedProgress+=(target-renderedProgress)*(1-Math.exp(-elapsed/110));
 if(Math.abs(target-renderedProgress)<.0001)renderedProgress=target;
 const p=renderedProgress;
 const introFade=still?1:1-ease((p-.01)/.065);
 $('#about').style.setProperty('--intro-opacity',String(introFade));
 $('#about').style.setProperty('--intro-y',`${-75*(1-introFade)}px`);
 $('#about').inert=!still&&introFade<.3;
 $('#about').style.pointerEvents=$('#about').inert?'none':'';
 const opening=still?1:ease((p-.17)/.075)*(1-ease((p-.47)/.06));
 const photographyTitle=ease((p-.055)/.025)*(1-ease((p-.14)/.04));
 $('.photography-intro').style.setProperty('--title-reveal',String(still?0:photographyTitle));
 $('.photography-intro').style.setProperty('--title-y',`${20*(1-photographyTitle)}px`);
 const entering=still?1:ease((p-.57)/.12);
 const photoZoom=still?0:ease((p-.26)/.07)*(1-ease((p-.405)/.055));
 const projectZoom=still?0:ease((p-.70)/.07)*(1-ease((p-.865)/.055));
 const photoBoot=bootProgress('photo',opening>.9,opening<.2,still,timestamp);
 const desktopBoot=bootProgress('desktop',entering>.98,entering<.05,still,timestamp);
 const leaving=still?0:ease((p-.93)/.045);
 const laptop=$('.laptop'),desktop=$('.desktop');
 laptop.style.setProperty('--lid-angle',`${-90+100*opening}deg`);
 laptop.style.setProperty('--closed-opacity',String(1-ease(opening/.3)));
 laptop.style.setProperty('--laptop-lift',`${-Math.min(160,innerHeight*.18)*(1-opening)+100*ease((p-.54)/.06)}px`);
 laptop.style.setProperty('--lid-height',`${$('.lid-front').offsetHeight}px`);
 laptop.style.setProperty('--screen-opacity',String(ease((opening-.45)/.45)));
 photoScene.style.setProperty('--device-opacity',String(still?1:ease((p-.045)/.045)*(1-ease((p-.54)/.06))*(1-ease(photoZoom/.85))));
 desktop.style.setProperty('--monitor-y',`${-Math.min(480,innerHeight*.6)*(1-entering)+70*leaving}px`);
 desktop.style.setProperty('--monitor-scale',String((.96+.04*entering)*(1-.06*leaving)));
 desktop.style.setProperty('--monitor-angle',`${-7*(1-entering)}deg`);
 desktop.style.setProperty('--monitor-roll',`${1.2*(1-entering)}deg`);
 desktop.style.setProperty('--stand-scale',String(.8+.2*entering));
 for(const [el,value] of [[laptop,photoBoot],[desktop,desktopBoot]]){
  el.classList.toggle('is-booting',value>0&&value<1);
  el.style.setProperty('--boot-progress',String(ease(value)));
  el.style.setProperty('--boot-opacity',String(1-ease((value-.72)/.28)));
  el.style.setProperty('--app-reveal',String(ease((value-.65)/.35)));
 }
 desktop.style.setProperty('--monitor-opacity',String(entering*(1-leaving)*(1-ease(projectZoom/.85))));
 photoScene.inert=!still&&(opening<.7||photoBoot<.85||p>.53);
 projectScene.inert=!still&&(entering<.1||desktopBoot<.85||leaving>.1);
 photoScene.style.pointerEvents=photoScene.inert?'none':'';
 projectScene.style.pointerEvents=projectScene.inert?'none':'';
 let active='about';
 if(p>.08)active=p<.57?'photography':'projects';
 if(still){active='about';if(photoScene.getBoundingClientRect().top<innerHeight*.55)active='photography';if(projectScene.getBoundingClientRect().top<innerHeight*.55)active='projects'}
 if($('#contact').getBoundingClientRect().top<innerHeight*.65)active='contact';
 document.querySelectorAll('.site-header nav a').forEach(a=>{if((a.dataset.section||a.hash.slice(1))===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 const immersion=Math.max(photoZoom,projectZoom);
 const header=$('.site-header');const collectionOpen=active==='photography'&&!$('.album-detail').hidden;header.style.opacity=collectionOpen?'0':'1';header.inert=collectionOpen;
 header.style.setProperty('--project-immersion',String(projectZoom));
 const collapse=still?(active==='about'?0:1):ease((p-.008)/.075);
 header.style.setProperty('--nav-reveal',String(1-collapse));
 header.classList.toggle('is-compact',collapse>.99);
 header.classList.toggle('over-app',immersion>.95);
 $('.site-header nav').inert=collectionOpen;
 navigationController?.update(collapse,active);
 syncSectionRoute(active);
 const contact=$('#contact');
 const contactVisible=still?1:ease((p-.96)/.04);
 contact.style.setProperty('--contact-reveal',String(contactVisible));
 contact.inert=!still&&p<.96;
 if(still||p>.965)contact.classList.add('is-in-view');
 else if(p<.92)contact.classList.remove('is-in-view');
 $('.photo-app').style.setProperty('--collections-reveal',String(still?1:ease((p-.245)/.10)));
 $('.editor').style.setProperty('--projects-reveal',String(still?1:ease((p-.70)/.075)));

 expandSurface(surfaces[0],photoZoom,ease((photoBoot-.65)/.35));
 surfaces[1].layer.style.setProperty('--boot-progress',String(ease(desktopBoot)));
 // The monitor is a preview until its screen fills the viewport.
 surfaces[1].app.classList.toggle('is-scroll-ready',still||projectZoom===1);
 expandSurface(surfaces[1],projectZoom,ease((desktopBoot-.65)/.35));
 if(!still&&(renderedProgress!==target||Object.values(startup).some(boot=>boot.start!==null&&boot.value<1)))requestFrame();
}
function requestFrame(){if(!framePending){framePending=true;requestAnimationFrame(updateScenes)}}
addEventListener('scroll',requestFrame,{passive:true});addEventListener('resize',resizeScene);motionQuery.addEventListener('change',resizeScene);
function resizeScene(){
 if(!routeReady){requestFrame();return}
 const path=location.pathname,section=path.startsWith('/photography')?'photography':path.startsWith('/projects')?'projects':path==='/connect'?'contact':'about';
 // A resize only needs the route guard during this synchronous reposition.
 // Deferred restoration can capture another resize's temporary true value and
 // permanently disable scroll-to-URL updates when resize events arrive together.
 const wasRestoring=restoringRoute;restoringRoute=true;
 try{instantScene(section)}finally{restoringRoute=wasRestoring}
 requestFrame();
}
function destination(hash){
 const el=document.querySelector(hash);if(!el)return null;
 if(!motionQuery.matches&&(hash==='#about'||hash==='#photography'||hash==='#projects'))return sequence.getBoundingClientRect().top+scrollY-headerHeight()+sequenceTravel()*(hash==='#about'?0:hash==='#photography'?.36:.81);
 return el.getBoundingClientRect().top+scrollY-headerHeight();
}
let navigationFrame=0,navigating=false;
function stopNavigation(){cancelAnimationFrame(navigationFrame);navigationFrame=0;navigating=false}
function navigateTo(top){
 stopNavigation();if(motionQuery.matches){scrollTo({top,behavior:'instant'});return}
 const start=scrollY,distance=top-start,duration=Math.min(2200,1250+Math.abs(distance)*.24),began=performance.now();navigating=true;
 function tick(now){const t=clamp((now-began)/duration);const progress=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;scrollTo({top:start+distance*progress,behavior:'instant'});if(t<1)navigationFrame=requestAnimationFrame(tick);else stopNavigation()}
 navigationFrame=requestAnimationFrame(tick);
}
addEventListener('wheel',stopNavigation,{passive:true});addEventListener('touchstart',stopNavigation,{passive:true});
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))stopNavigation()});
addEventListener('popstate',()=>restoreRoute());
updateScenes();
const projects = [
 {image:'/project-previews/delta-water-explorer.webp',website:'https://delta-water-explorer.vercel.app/',imageCaption:'Delta Water Explorer · live website',name:'Delta Water Explorer',slug:'delta-water-explorer',tag:'DATA VISUALIZATION · WEB APPLICATION',headline:'Know the water. Find your window.',description:'An interactive explorer for Delta Reservoir near Rome, New York. It brings observed water levels, seasonal drawdown, and the historical record into one place, with clear sources and context.',stack:['NOAA / NWPS','USGS','Interactive charts'],notes:['Explore recent NOAA pool observations and the historical USGS record.','Compare seasonal drawdown, refill signals, and measured water-level trends.','Inspect the data sources, coverage gaps, and analysis methods behind each view.'],links:[]},
 {image:'/project-previews/nodexity-site.png',website:'https://nodexity.com/',imageCaption:'Nodexity · live website',name:'Nodexity',tag:'SERVER MANAGEMENT',headline:'Minecraft servers, in one place.',description:'A Minecraft server manager that brings starting, stopping, monitoring, and configuring servers into one place. Built around making self-hosting easier to manage.',stack:['Node.js','Minecraft','Server tools'],notes:['Start and stop servers from a central workspace.','Monitor server activity and manage configuration.','Explore the project’s website for current details and availability.'],links:[['Visit Nodexity','https://nodexity.com/']]},
 {image:'/minecraft/assets/grass-block.svg',route:'/minecraft',imageCaption:'Minecraft Mods · custom creations and wikis',name:'Minecraft Mods',tag:'MINECRAFT JAVA · MODS & WIKIS',headline:'A few changes. A whole new world.'},
 {image:'/project-previews/galleryx-site.jpg',website:'https://galleryx-sigma.vercel.app/',imageCaption:'GalleryX · live website',name:'GalleryX',tag:'DESKTOP APPLICATION · IN DEVELOPMENT',headline:'A better view of your media.',description:'An offline-first photo and video browser for large libraries on internal and external drives. GalleryX indexes media where it lives, so your original files stay in place.',stack:['Electron','SQLite','Local media'],notes:['Indexes folders in place and builds a thumbnail cache for fast browsing.','Includes photo and video galleries, favorites, timeline views, and duplicate review.','Keeps cached previews available when an external drive is disconnected.','Deletion goes to the operating system’s Trash or Recycle Bin.'],links:[['Browse my GitHub','https://github.com/404twillCODE']]},
];
// The projects are a visual portfolio, with genuine previews and direct links.
let projectIndex=0,projectBusy=false,projectReturnCard=null;
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el}
function renderProject(){
 const p=projects[projectIndex],panel=$('#project-content');panel.replaceChildren();
 const visual=node('figure','work-visual'),preview=node(p.website?'a':'button','work-preview'),img=node('img');
 img.src=p.image;img.alt=p.imageCaption;preview.append(img);
 if(p.website){preview.href=p.website;preview.target='_blank';preview.rel='noopener noreferrer';preview.setAttribute('aria-label','Go to '+p.name+' website (opens in a new tab)');preview.append(node('span','preview-action','Go to Website'));}
 else{preview.setAttribute('aria-label','Enlarge '+p.name+' website preview');preview.append(node('span','preview-action','View preview'));preview.addEventListener('click',()=>{$('#project-preview-image').src=p.image;$('#project-preview-image').alt=p.imageCaption;$('#project-preview-title').textContent=p.imageCaption;$('#project-preview').showModal()});}
 visual.append(preview,node('figcaption','',p.website?new URL(p.website).hostname+' · Click the preview to open the website':p.imageCaption));
 const copy=node('div','work-copy');copy.append(node('span','section-kicker',p.tag),node('h3','',p.name),node('p','work-description',p.description));
 const tags=node('div','work-stack');p.stack.forEach(t=>tags.append(node('span','',t)));copy.append(tags);
 const details=node('div','project-notes');details.append(node('h4','','Inside the project'));const list=node('ul');p.notes.forEach(n=>list.append(node('li','',n)));details.append(list);copy.append(details);
 const links=node('div','work-links');(p.website?[]:p.links).forEach(([label,url])=>{const a=node('a','',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener';links.append(a)});copy.append(links);
 panel.append(visual,copy);$('#project-detail-number').textContent='0'+(projectIndex+1)+' / '+String(projects.length).padStart(2,'0');
}
async function openProject(index,card){
 if(projectBusy)return;
 if(!restoringRoute)setRoute('/projects/'+(projects[index].slug||projects[index].name.toLowerCase()));
 const routeToken=routeRestoreToken;projectBusy=true;projectIndex=index;projectReturnCard=card;renderProject();
 const indexView=$('.projects-index'),detail=$('.project-detail-view'),start=card.querySelector('img').getBoundingClientRect();indexView.inert=true;
 await Promise.all([...document.querySelectorAll('.project-card')].filter(c=>c!==card).map((c,i)=>animate(c,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(24px)'}],300,i*45)));
 if(routeToken!==routeRestoreToken)return;
 indexView.hidden=true;detail.hidden=false;$('.editor').scrollTop=0;
 const visual=$('.work-visual'),end=visual.getBoundingClientRect();visual.style.transformOrigin='top left';
 await Promise.all([animate(visual,[{opacity:.6,transform:`translate(${start.left-end.left}px,${start.top-end.top}px) scale(${start.width/end.width})`},{opacity:1,transform:'none'}],700),animate($('.work-copy'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],650,150)]);
 if(routeToken!==routeRestoreToken)return;projectBusy=false;$('#back-projects').focus({preventScroll:true});
}
async function closeProject(){
 if(!restoringRoute){return leaveDetail('/projects')}

 if(projectBusy)return;projectBusy=true;const detail=$('.project-detail-view');await animate(detail,[{opacity:1},{opacity:0}],250);detail.hidden=true;detail.getAnimations().forEach(a=>a.cancel());$('.projects-index').hidden=false;$('.projects-index').inert=false;
 document.querySelectorAll('.project-card').forEach((card,i)=>{card.getAnimations().forEach(a=>a.cancel());animate(card,[{opacity:0,transform:'translateY(25px)'},{opacity:1,transform:'none'}],600,i*65)});projectBusy=false;projectReturnCard?.focus({preventScroll:true});
}
projects.forEach((p,i)=>{const card=node(p.route?'a':'button','project-card');if(p.route)card.href=p.route;card.setAttribute('aria-label',p.route?'Explore Minecraft Mods':'Read about '+p.name);const image=node('img');image.src=p.image;image.alt=p.imageCaption;const cover=node('span','project-card-cover');cover.append(image);const caption=node('span','project-card-caption');caption.append(node('small','',p.tag),node('strong','',p.name),node('span','',p.headline));card.append(cover,caption);if(!p.route)card.addEventListener('click',()=>openProject(i,card));$('#project-cards').append(card)});
$('#back-projects').addEventListener('click',closeProject);$('.editor').addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('.project-detail-view').hidden)closeProject()});
$('#close-project-preview').addEventListener('click',()=>$('#project-preview').close());
// Collection transitions preserve the selected cover's position as it grows.
let collections=[],collectionIndex=0,photoIndex=0,query='',albumBusy=false,returnCard=null;
const box=$('#lightbox');
function currentPhotos(){return (collections[collectionIndex]?.photos||[]).filter(p=>(p.name+' '+p.camera+' '+p.date+' '+(p.techCaption||'')).toLowerCase().includes(query))}
function animate(el,frames,duration=650,delay=0){if(motionQuery.matches)return Promise.resolve();return el.animate(frames,{duration,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}).finished.catch(()=>{})}
function renderAlbum(){
 const c=collections[collectionIndex],photos=currentPhotos();$('#album-grid').replaceChildren();
 $('#album-name').textContent=c.title;$('#album-event').textContent=c.event;$('#album-count').textContent=c.photos.length+' photographs';
 $('#album-description').textContent=[c.photos[0].date,c.photos[0].camera].filter(Boolean).join(' / ');
 $('#album-cover').src=c.cover.url;$('#album-cover').alt=c.title;
 $('#library-empty').hidden=photos.length>0;
 const fragment=document.createDocumentFragment();photos.forEach((p,i)=>{
  const button=node('button','album-photo');button.setAttribute('aria-label','Open '+p.name);button.style.setProperty('--photo-order',i%12);
  const img=node('img');img.src=p.thumbnailUrl||p.url;img.alt=p.name;img.draggable=false;img.loading=i<8?'eager':'lazy';img.decoding='async';
  if(p.width&&p.height){img.width=p.width;img.height=p.height;if(p.height>p.width*1.12)button.classList.add('is-portrait')}
  img.addEventListener('error',()=>{button.classList.add('photo-unavailable');button.replaceChildren(node('span','','Photograph temporarily unavailable'));button.disabled=true},{once:true});
  button.append(img);button.addEventListener('click',()=>openLightbox(i,button));fragment.append(button);
 });$('#album-grid').append(fragment);
}
async function openCollection(index,card){
 if(albumBusy)return;
 if(!restoringRoute)setRoute(collectionRoute(collections[index]));
 const routeToken=routeRestoreToken;albumBusy=true;returnCard=card;collectionIndex=index;query='';$('#photo-search').value='';
 const start=card.getBoundingClientRect();renderAlbum();
 const grid=$('.collection-index'),detail=$('.album-detail');detail.hidden=false;detail.style.visibility='hidden';$('.album-scroll').scrollTop=0;
 requestFrame();const end=$('.album-hero').getBoundingClientRect();
 const cover=$('.album-hero');const dx=start.left-end.left,dy=start.top-end.top,sx=start.width/end.width,sy=start.height/end.height;
 cover.style.transformOrigin='top left';
 const others=[...document.querySelectorAll('.collection-tile')].filter(b=>b!==card);
 grid.inert=true;
 const flights=others.map((b,i)=>animate(b,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(25px) scale(.97)'}],350,Math.min(i*25,100)));
 await Promise.all(flights);
 if(routeToken!==routeRestoreToken)return;
 detail.style.visibility='';card.style.visibility='hidden';flights.length=0;
 flights.push(animate(cover,[{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},{transform:'none'}],850));
 flights.push(animate($('.album-title'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],600,200));
 flights.push(animate($('.album-header'),[{opacity:0},{opacity:1}],450,200));
 flights.push(animate($('#album-grid'),[{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'none'}],650,250));
 await Promise.all(flights);if(routeToken!==routeRestoreToken)return;grid.hidden=true;grid.inert=false;albumBusy=false;$('#back-collections').focus({preventScroll:true});
}
async function closeCollection(){
 if(!restoringRoute){return leaveDetail('/photography')}

 if(albumBusy)return;albumBusy=true;const detail=$('.album-detail'),grid=$('.collection-index');
 await animate(detail,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(18px)'}],300);
 detail.hidden=true;detail.getAnimations().forEach(a=>a.cancel());grid.hidden=false;
 document.querySelectorAll('.collection-tile').forEach((b,i)=>{b.style.visibility='';b.getAnimations().forEach(a=>a.cancel());animate(b,[{opacity:0,transform:'translateY(25px)'},{opacity:1,transform:'none'}],600,i*45)});
 albumBusy=false;if(pendingLibrary){const previousId=collections[collectionIndex]?.id;applyLibrary(pendingLibrary);pendingLibrary=null;const nextIndex=collections.findIndex(c=>c.id===previousId);$('#collection-grid').children[Math.max(0,nextIndex)]?.focus({preventScroll:true})}else{returnCard?.focus({preventScroll:true})}
}
$('#back-collections').addEventListener('click',closeCollection);
$('#photo-search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();renderAlbum()});
let viewerOrigin=null,viewerClosing=false,viewerZoomed=false,photoSwap=0;
function resetViewerZoom(){viewerZoomed=false;box.classList.remove('is-zoomed');$('#lightbox-zoom').setAttribute('aria-pressed','false');$('#lightbox-zoom').setAttribute('aria-label','Zoom into photograph');$('#lightbox-image').style.transformOrigin='50% 50%'}
const previewCache=new Map();
function preloadPhoto(url){
 if(previewCache.has(url))return previewCache.get(url);
 const image=new Image();image.decoding='async';image.src=url;
 const job={image,promise:image.decode().catch(()=>{})};previewCache.set(url,job);
 if(previewCache.size>8)previewCache.delete(previewCache.keys().next().value);
 return job;
}
function warmNeighbors(){
 const photos=currentPhotos();if(photos.length<2)return;
 const connection=navigator.connection;if(connection?.saveData||/2g/.test(connection?.effectiveType||''))return;
 for(const delta of [-1,1])preloadPhoto(photos[(photoIndex+delta+photos.length)%photos.length].url);
}
function renderLightbox(){
 const photos=currentPhotos(),p=photos[photoIndex];if(!p)return;
 resetViewerZoom();const image=$('#lightbox-image'),swap=++photoSwap;
 image.getAnimations().forEach(a=>a.cancel());
 // Show the existing thumbnail immediately while the larger protected image decodes.
 const thumb=[...document.querySelectorAll('.album-photo img')].find(img=>img.getAttribute('src')===p.thumbnailUrl);
 const ready=previewCache.get(p.url);
 image.src=ready?.image.complete&&ready.image.naturalWidth?p.url:(thumb?.complete&&thumb.naturalWidth?thumb.src:p.thumbnailUrl||p.url);
 image.alt=p.name;
 $('#lightbox-title').textContent=collections[collectionIndex].title;$('#lightbox-counter').textContent=(photoIndex+1)+' / '+photos.length;
 renderPhotoInformation(p);box.classList.add('photo-loading');$('#viewer-load-status').textContent='Loading preview…';
 preloadPhoto(p.url).promise.then(()=>{
  if(swap!==photoSwap||viewerClosing)return;
  const loaded=previewCache.get(p.url)?.image;
  if(loaded?.naturalWidth){image.src=p.url;$('#viewer-load-status').textContent=''}
  else $('#viewer-load-status').textContent='Full preview unavailable. Showing the smaller preview.';
  box.classList.remove('photo-loading');warmNeighbors();
 });
}
function openLightbox(index,source){
 photoIndex=index;viewerOrigin=source;viewerClosing=false;
 if(!restoringRoute){const url=new URL(collectionRoute(collections[collectionIndex]),location.origin);url.searchParams.set('photo',currentPhotos()[index].id);setRoute(url.pathname+url.search)}
 renderLightbox();if(!box.open)box.showModal();document.body.classList.add('photo-viewing');$('#close-lightbox').focus({preventScroll:true});
}
async function closeLightbox(){
 if(!restoringRoute)return leaveDetail(collectionRoute(collections[collectionIndex]));
 photoSwap++;resetViewerZoom();if(box.open)box.close();box.getAnimations().forEach(a=>a.cancel());document.body.classList.remove('photo-viewing');viewerClosing=false;
}
function movePhoto(delta){
 const photos=currentPhotos();if(!photos.length||viewerClosing)return;
 photoIndex=(photoIndex+delta+photos.length)%photos.length;
 const url=new URL(collectionRoute(collections[collectionIndex]),location.origin);url.searchParams.set('photo',photos[photoIndex].id);
 setRoute(url.pathname+url.search,'replace');renderLightbox();
}
// object-fit letterboxing is outside the photograph, even though it is inside the image element.
function photoContainsPoint(x,y){
 const image=$('#lightbox-image'),r=image.getBoundingClientRect();if(!image.naturalWidth||!image.naturalHeight)return false;
 const scale=Math.min(r.width/image.naturalWidth,r.height/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
 const left=r.left+(r.width-width)/2,top=r.top+(r.height-height)/2;
 return x>=left&&x<=left+width&&y>=top&&y<=top+height;
}
$('#lightbox-zoom').addEventListener('click',event=>{
 if(event.detail!==0&&!photoContainsPoint(event.clientX,event.clientY)){closeLightbox();return}
 viewerZoomed=!viewerZoomed;const image=$('#lightbox-image'),rect=image.getBoundingClientRect();image.style.transformOrigin=event.detail===0?'50% 50%':`${clamp((event.clientX-rect.left)/rect.width)*100}% ${clamp((event.clientY-rect.top)/rect.height)*100}%`;
 box.classList.toggle('is-zoomed',viewerZoomed);$('#lightbox-zoom').setAttribute('aria-pressed',String(viewerZoomed));$('#lightbox-zoom').setAttribute('aria-label',viewerZoomed?'Zoom out of photograph':'Zoom into photograph');
});
$('#lightbox-zoom').addEventListener('pointermove',event=>{
 const onPhoto=photoContainsPoint(event.clientX,event.clientY);event.currentTarget.style.cursor=onPhoto?(viewerZoomed?'zoom-out':'zoom-in'):'default';
 if(!viewerZoomed||event.pointerType==='touch')return;const rect=event.currentTarget.getBoundingClientRect();$('#lightbox-image').style.transformOrigin=`${clamp((event.clientX-rect.left)/rect.width)*100}% ${clamp((event.clientY-rect.top)/rect.height)*100}%`;
});
$('#close-lightbox').addEventListener('click',closeLightbox);$('#lightbox-prev').addEventListener('click',()=>movePhoto(-1));$('#lightbox-next').addEventListener('click',()=>movePhoto(1));
box.addEventListener('cancel',event=>{event.preventDefault();closeLightbox()});
box.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();movePhoto(e.key==='ArrowLeft'?-1:1)}});
$('.photo-app').addEventListener('keydown',e=>{if(e.key==='Escape'&&!box.open&&!$('.album-detail').hidden)closeCollection()});
function renderPhotoInformation(photo){
 $('#photo-caption').textContent=photo.techCaption||[photo.camera,photo.lens,photo.settings].filter(Boolean).join(' • ');$('#photo-caption').hidden=!$('#photo-caption').textContent;
 $('#photo-buy').href=photo.buyUrl;$('#photo-license').href=photo.commercialUrl;
 $('#photo-buy').hidden=!photo.buyUrl;$('#photo-license').hidden=!photo.commercialUrl;
}
// A convenience deterrent; actual preview protection is applied by the server.
for(const element of [$('.photo-app'),box]){
 element.addEventListener('contextmenu',event=>{if(event.target.closest('img,#lightbox-zoom,.album-photo,.collection-tile'))event.preventDefault()});
 element.addEventListener('dragstart',event=>{if(event.target.tagName==='IMG')event.preventDefault()});
}
let libraryVersion='',pendingLibrary=null,libraryLoading=false,lastLibraryCheck=0;
function applyLibrary(data){
 collections=data.collections.filter(c=>c.photos.length);libraryVersion=data.version;$('#collection-grid').replaceChildren();
 collections.forEach((c,i)=>{
  c.title=c.title||c.name;c.cover=c.photos.find(p=>p.id===c.coverId)||c.photos.find(p=>p.url===c.coverUrl)||c.photos[0];
  const card=node('button','collection-tile');card.style.setProperty('--collection-order',i);card.setAttribute('aria-label','Open '+c.title+' collection');
  const img=node('img');img.src=c.cover.thumbnailUrl||c.cover.url;img.alt='';img.draggable=false;img.decoding='async';
  const text=node('span','collection-caption'),title=node('strong','',c.title),meta=node('span','collection-meta',[c.category,c.photos.length+' photographs'].filter(Boolean).join(' / '));text.append(meta,title);
  card.append(img,text,node('span','collection-arrow','↗'));card.addEventListener('click',()=>openCollection(i,card));$('#collection-grid').append(card);
 });$('#library-total').textContent=collections.length+' collections / '+collections.reduce((n,c)=>n+c.photos.length,0)+' photographs';
 $('#gallery-message').textContent=collections.length?'':'New photographs will appear here when they’re published.';
}
async function loadLibrary(){
 if(libraryLoading)return;libraryLoading=true;lastLibraryCheck=Date.now();
 try{
  const response=await fetch('/api/photos',{cache:'no-store'});if(!response.ok)throw Error('Library unavailable');const data=await response.json();
  if(!Array.isArray(data.collections))throw Error('Invalid library');
  if(data.version!==libraryVersion){
   if(albumBusy||!$('.album-detail').hidden||box.open)pendingLibrary=data;
   else applyLibrary(data);
  }
 }catch{
  if(!collections.length){$('#gallery-message').textContent='The library is temporarily unavailable. Please try again shortly.';$('#library-total').textContent='Connecting to the photo library…'}
 }finally{libraryLoading=false;if(routeReady&&location.pathname.startsWith('/photography/'))restoreRoute();}
}
loadLibrary();
setInterval(()=>{if(!document.hidden)loadLibrary()},60_000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastLibraryCheck>60_000)loadLibrary()});

// Stable URLs for scroll scenes, collections, photos, and individual projects.
const sectionPaths={about:'/',photography:'/photography',projects:'/projects',contact:'/connect'};
function collectionRoute(collection){
 try{return '/photography'+new URL(collection.sourceUrl).pathname.replace(/^\/portfolio/,'')}
 catch{return '/photography/collections/'+encodeURIComponent(collection.id)}
}
function setRoute(url,mode='push'){
 if(location.pathname+location.search===url)return;
 const state={fot:true,parent:mode==='replace'&&history.state?.fot?history.state.parent:location.pathname+location.search};
 history[mode==='replace'?'replaceState':'pushState'](state,'',url);
}
function leaveDetail(parent){
 if(history.state?.fot&&history.state.parent===parent){history.back();return}
 setRoute(parent,'replace');restoreRoute();
}
function syncSectionRoute(active){
 if(!routeReady||restoringRoute||navigating)return;
 const current=location.pathname,section=current.startsWith('/photography')?'photography':current.startsWith('/projects')?'projects':current==='/connect'?'contact':'about';
 if(active!==section)setRoute(sectionPaths[active]);
}
function instantScene(section){
 stopNavigation();const top=destination('#'+section);if(top===null)return;
 scrollTo({top,behavior:'instant'});renderedProgress=null;
 const boot=section==='photography'?startup.photo:section==='projects'?startup.desktop:null;
 if(boot){boot.start=performance.now()-2000;boot.value=1}
 updateScenes();
}
async function restoreRoute(){
 if(!routeReady)return;const token=++routeRestoreToken;restoringRoute=true;
 const path=location.pathname.replace(/\/$/,'')||'/';
 const section=path.startsWith('/photography')?'photography':path.startsWith('/projects')?'projects':path==='/connect'?'contact':({'#photography':'photography','#projects':'projects','#contact':'contact'})[location.hash]||'about';
 if(box.open){box.close();document.body.classList.remove('photo-viewing');photoSwap++}
 $('.album-detail').hidden=true;$('.album-detail').style.visibility='';$('.collection-index').hidden=false;$('.collection-index').inert=false;
 document.querySelectorAll('.album-hero,.album-title,.album-header,#album-grid,.work-visual,.work-copy').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
 document.querySelectorAll('.collection-tile').forEach(card=>{card.style.visibility='';card.getAnimations().forEach(a=>a.cancel())});
 $('.project-detail-view').hidden=true;$('.projects-index').hidden=false;$('.projects-index').inert=false;
 document.querySelectorAll('.project-card').forEach(card=>card.getAnimations().forEach(a=>a.cancel()));
 query='';$('#photo-search').value='';albumBusy=false;projectBusy=false;instantScene(section);
 if(section==='photography'&&path!=='/photography'){
  const index=collections.findIndex(c=>collectionRoute(c)===path);
  if(index>=0){
   collectionIndex=index;returnCard=$('#collection-grid').children[index];renderAlbum();
   $('.collection-index').hidden=true;$('.album-detail').hidden=false;$('.album-scroll').scrollTop=0;
   const photoId=new URLSearchParams(location.search).get('photo');
   if(photoId){const photo=collections[index].photos.findIndex(p=>p.id===photoId);if(photo>=0)openLightbox(photo,returnCard)}
  }else if(!libraryLoading&&collections.length){$('#gallery-message').textContent='That collection is no longer available. Choose another collection.'}
 }
 if(section==='projects'&&path!=='/projects'){
  const index=projects.findIndex(p=>!p.route&&'/projects/'+(p.slug||p.name.toLowerCase())===path);
  if(index>=0){projectIndex=index;projectReturnCard=$('#project-cards').children[index];renderProject();$('.projects-index').hidden=true;$('.project-detail-view').hidden=false}
 }
 document.title=section==='photography'&&!$('.album-detail').hidden?collections[collectionIndex].title+' — Focused on Tom':({about:'Focused on Tom — Code & Cameras',photography:'Photography — Focused on Tom',projects:'Projects — Focused on Tom',contact:'Get in touch — Focused on Tom'})[section];
 requestFrame();await new Promise(resolve=>requestAnimationFrame(resolve));if(token===routeRestoreToken){restoringRoute=false;requestFrame()}
}
// Both navigation views share one surface; only its width and content opacity change.
function createNavigationController(){
 const nav=$('.site-header nav'),links=$('.nav-links');
 nav.id='section-navigation';
 let collapse=0,hovered=false,focused=false,pinned=false,suppressed=false,focusRequested=false,returnFocus=false;
 let progress=0,width=0,fullWidth=0,compactWidth=0,frame=0,lastTime=0,initialized=false,section='about';
 const labels={about:'Home',photography:'Photography',projects:'Projects',contact:'Contact'};
 const measure=()=>{fullWidth=links.scrollWidth+10;compactWidth=currentNav.lastElementChild.getBoundingClientRect().width+48;wake()};
 function wake(){if(!frame)frame=requestAnimationFrame(draw)}
 function draw(time){
  frame=0;
  const expanded=!suppressed&&(hovered||focused||pinned),target=expanded?0:collapse;
  const blend=motionQuery.matches||!initialized?1:1-Math.exp(-Math.min(40,time-(lastTime||time-16))/85);
  progress+=(target-progress)*blend;if(Math.abs(target-progress)<.001)progress=target;
  const targetWidth=fullWidth+(compactWidth-fullWidth)*target;
  width+=(targetWidth-width)*blend;if(Math.abs(targetWidth-width)<.1)width=targetWidth;
  nav.style.setProperty('--nav-width',width+'px');
  nav.style.setProperty('--links-opacity',String(1-ease(progress/.55)));
  nav.style.setProperty('--label-opacity',String(ease((progress-.35)/.65)));
  nav.style.setProperty('--links-offset',(progress*8)+'px');
  const linksActive=progress<.5;
  links.inert=!linksActive;
  if(linksActive&&focusRequested){focusRequested=false;links.querySelector('[aria-current]')?.focus()}
  currentNav.inert=linksActive;
  links.style.visibility=progress===1?'hidden':'visible';
  currentNav.style.visibility=progress===0?'hidden':'visible';
  if(!linksActive&&returnFocus){returnFocus=false;currentNav.focus()}
  nav.classList.toggle('is-open',expanded);
  currentNav.setAttribute('aria-expanded',String(expanded));
  initialized=true;lastTime=time;
  if(progress!==target||width!==targetWidth)wake();
 }
 nav.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;suppressed=false;wake()}});
 nav.addEventListener('pointerleave',()=>{hovered=false;suppressed=false;wake()});
 nav.addEventListener('focusin',event=>{if(links.contains(event.target)){focused=true;suppressed=false;wake()}});
 nav.addEventListener('focusout',event=>{if(event.relatedTarget&&!nav.contains(event.relatedTarget)){focused=false;pinned=false;wake()}});
 currentNav.addEventListener('click',event=>{pinned=true;suppressed=false;focusRequested=event.detail===0;wake()});
 currentNav.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();pinned=true;suppressed=false;progress=0;wake();links.inert=false;links.querySelector('[aria-current]')?.focus()}});
 new ResizeObserver(measure).observe(links);
 document.fonts.ready.then(measure);
 measure();
 return {
  close(restoreFocus=false){pinned=false;focused=false;focusRequested=false;returnFocus=restoreFocus;suppressed=true;nav.classList.remove('is-open');currentNav.setAttribute('aria-expanded','false');wake()},
  update(amount,active){
   if(section!==active){
    section=active;const old=currentNav.lastElementChild,next=document.createElement('span');next.textContent=labels[active];currentNav.append(next);
    currentNav.setAttribute('aria-label',labels[active]+': open navigation');
    for(const child of [...currentNav.children])if(child!==old&&child!==next)child.remove();
    old.setAttribute('aria-hidden','true');
    if(!motionQuery.matches){
     old.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:180,fill:'forwards'}).finished.then(()=>old.remove()).catch(()=>{});
     next.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
    }else old.remove();
    measure();
   }
   if(collapse!==amount){collapse=amount;wake()}
  }
 };
}
const currentNav=document.createElement('button');currentNav.className='nav-current';currentNav.type='button';currentNav.setAttribute('aria-label','Home: open navigation');currentNav.setAttribute('aria-expanded','false');currentNav.innerHTML='<span>Home</span>';
$('.site-header nav').append(currentNav);
currentNav.setAttribute('aria-controls','nav-links');
navigationController=createNavigationController();
function closeNavigation(restoreFocus=false){navigationController.close(restoreFocus)}
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.site-header nav'))closeNavigation()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('.site-header nav').classList.contains('is-open'))closeNavigation(true)});
for(const link of document.querySelectorAll('.site-header a[href^="#"],.footer a[href="#about"]')){
 const section=link.hash.slice(1);link.href=sectionPaths[section]||'/';
 link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();setRoute(link.getAttribute('href'));closeNavigation();restoreRoute()});
}
document.querySelectorAll('.contact-email').forEach(link=>{link.href='/contact';link.removeAttribute('target');link.removeAttribute('rel')});
document.querySelectorAll('.site-header nav a').forEach(link=>link.dataset.section=Object.entries(sectionPaths).find(([,path])=>path===link.getAttribute('href'))?.[0]||'about');
routeReady=true;restoreRoute();

$('#copy-photo-link').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(location.href);$('#copy-photo-link').textContent='Link copied';setTimeout(()=>$('#copy-photo-link').textContent='Copy photo link',1800)}
 catch{$('#viewer-load-status').textContent='Copy the address from your browser to share this photo.'}
});
let swipeStart=null;
$('#lightbox-zoom').addEventListener('touchstart',event=>{if(!viewerZoomed&&event.touches.length===1)swipeStart=event.touches[0].clientX},{passive:true});
$('#lightbox-zoom').addEventListener('touchend',event=>{if(swipeStart===null||viewerZoomed)return;const delta=event.changedTouches[0].clientX-swipeStart;swipeStart=null;if(Math.abs(delta)>55)movePhoto(delta>0?-1:1)},{passive:true});
