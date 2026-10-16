'use strict';
history.scrollRestoration='manual';
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
 if($('#contact').getBoundingClientRect().top<innerHeight*.65)active='contact';
 document.querySelectorAll('.site-header nav a').forEach(a=>{if(a.hash==='#'+active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 const immersion=Math.max(photoZoom,projectZoom);
 const header=$('.site-header');header.style.opacity=String(1-ease((photoZoom-.8)/.2));header.inert=photoZoom>.98;
 header.style.setProperty('--project-immersion',String(projectZoom));
 const collapse=still?0:ease((p-.008)/.075);
 header.style.setProperty('--nav-reveal',String(1-collapse));
 header.classList.toggle('is-compact',collapse>.99);
 header.classList.toggle('over-app',immersion>.95);
 $('.site-header nav').inert=collapse>.95;
 const contact=$('#contact');
 const contactVisible=still?1:ease((p-.96)/.04);
 contact.style.setProperty('--contact-reveal',String(contactVisible));
 contact.inert=!still&&p<.96;
 if(still||p>.965)contact.classList.add('is-in-view');
 else if(p<.92)contact.classList.remove('is-in-view');
 $('.photo-app').style.setProperty('--collections-reveal',String(still?1:ease((p-.245)/.10)));

 expandSurface(surfaces[0],photoZoom,ease((photoBoot-.65)/.35));
 surfaces[1].layer.style.setProperty('--boot-progress',String(ease(desktopBoot)));
 // The monitor is a preview until its screen fills the viewport.
 surfaces[1].app.classList.toggle('is-scroll-ready',still||projectZoom===1);
 expandSurface(surfaces[1],projectZoom,ease((desktopBoot-.65)/.35));
 if(!still&&(renderedProgress!==target||Object.values(startup).some(boot=>boot.start!==null&&boot.value<1)))requestFrame();
}
function requestFrame(){if(!framePending){framePending=true;requestAnimationFrame(updateScenes)}}
addEventListener('scroll',requestFrame,{passive:true});addEventListener('resize',requestFrame);motionQuery.addEventListener('change',requestFrame);
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
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{const target=destination(a.hash);if(target===null)return;event.preventDefault();history.pushState(null,'',a.hash);navigateTo(target)}));
addEventListener('load',()=>{const top=destination(location.hash||'#about');if(top!==null)scrollTo({top,behavior:'instant'});updateScenes()});
addEventListener('popstate',()=>{const top=destination(location.hash||'#about');if(top!==null)navigateTo(top)});
updateScenes();
const projects = [
 {image:'/project-previews/galleryx-site.jpg',website:'https://galleryx-sigma.vercel.app/',imageCaption:'GalleryX · live website',name:'GalleryX',tag:'DESKTOP APPLICATION · IN DEVELOPMENT',headline:'A better view of your media.',description:'An offline-first photo and video browser for large libraries on internal and external drives. GalleryX indexes media where it lives, so your original files stay in place.',stack:['Electron','SQLite','Local media'],notes:['Indexes folders in place and builds a thumbnail cache for fast browsing.','Includes photo and video galleries, favorites, timeline views, and duplicate review.','Keeps cached previews available when an external drive is disconnected.','Deletion goes to the operating system’s Trash or Recycle Bin.'],links:[['Browse my GitHub','https://github.com/404twillCODE']]},
 {image:'/project-previews/nodexity-site.png',website:'https://nodexity.com/',imageCaption:'Nodexity · live website',name:'Nodexity',tag:'SERVER MANAGEMENT',headline:'Minecraft servers, in one place.',description:'A Minecraft server manager that brings starting, stopping, monitoring, and configuring servers into one place. Built around making self-hosting easier to manage.',stack:['Node.js','Minecraft','Server tools'],notes:['Start and stop servers from a central workspace.','Monitor server activity and manage configuration.','Explore the project’s website for current details and availability.'],links:[['Visit Nodexity','https://nodexity.com/']]},
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
 if(projectBusy)return;projectBusy=true;projectIndex=index;projectReturnCard=card;renderProject();
 const indexView=$('.projects-index'),detail=$('.project-detail-view'),start=card.querySelector('img').getBoundingClientRect();indexView.inert=true;
 await Promise.all([...document.querySelectorAll('.project-card')].filter(c=>c!==card).map((c,i)=>animate(c,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(24px)'}],300,i*45)));
 indexView.hidden=true;detail.hidden=false;$('.editor').scrollTop=0;
 const visual=$('.work-visual'),end=visual.getBoundingClientRect();visual.style.transformOrigin='top left';
 await Promise.all([animate(visual,[{opacity:.6,transform:`translate(${start.left-end.left}px,${start.top-end.top}px) scale(${start.width/end.width})`},{opacity:1,transform:'none'}],700),animate($('.work-copy'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],650,150)]);
 projectBusy=false;$('#back-projects').focus({preventScroll:true});
}
async function closeProject(){
 if(projectBusy)return;projectBusy=true;const detail=$('.project-detail-view');await animate(detail,[{opacity:1},{opacity:0}],250);detail.hidden=true;detail.getAnimations().forEach(a=>a.cancel());$('.projects-index').hidden=false;$('.projects-index').inert=false;
 document.querySelectorAll('.project-card').forEach((card,i)=>{card.getAnimations().forEach(a=>a.cancel());animate(card,[{opacity:0,transform:'translateY(25px)'},{opacity:1,transform:'none'}],600,i*65)});projectBusy=false;projectReturnCard?.focus({preventScroll:true});
}
projects.forEach((p,i)=>{const card=node('button','project-card');card.setAttribute('aria-label','Read about '+p.name);const image=node('img');image.src=p.image;image.alt=p.imageCaption;const cover=node('span','project-card-cover');cover.append(image);const caption=node('span','project-card-caption');caption.append(node('small','',p.tag),node('strong','',p.name),node('span','',p.headline));card.append(cover,caption);card.addEventListener('click',()=>openProject(i,card));$('#project-cards').append(card)});
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
 if(albumBusy)return;albumBusy=true;returnCard=card;collectionIndex=index;query='';$('#photo-search').value='';
 const start=card.getBoundingClientRect();renderAlbum();
 const grid=$('.collection-index'),detail=$('.album-detail');detail.hidden=false;detail.style.visibility='hidden';$('.album-scroll').scrollTop=0;
 const end=$('.album-hero').getBoundingClientRect();
 const cover=$('.album-hero');const dx=start.left-end.left,dy=start.top-end.top,sx=start.width/end.width,sy=start.height/end.height;
 cover.style.transformOrigin='top left';
 const others=[...document.querySelectorAll('.collection-tile')].filter(b=>b!==card);
 grid.inert=true;
 const flights=others.map((b,i)=>animate(b,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(25px) scale(.97)'}],350,Math.min(i*25,100)));
 await Promise.all(flights);
 detail.style.visibility='';card.style.visibility='hidden';flights.length=0;
 flights.push(animate(cover,[{transform:`translate(${dx}px,${dy}px) scale(${sx},${sy})`},{transform:'none'}],850));
 flights.push(animate($('.album-title'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],600,200));
 flights.push(animate($('.album-header'),[{opacity:0},{opacity:1}],450,200));
 flights.push(animate($('#album-grid'),[{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'none'}],650,250));
 await Promise.all(flights);grid.hidden=true;grid.inert=false;albumBusy=false;$('#back-collections').focus({preventScroll:true});
}
async function closeCollection(){
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
function renderLightbox(){const photos=currentPhotos(),p=photos[photoIndex];if(!p)return;resetViewerZoom();$('#lightbox-image').src=p.url;$('#lightbox-image').alt=p.name;$('#lightbox-title').textContent=collections[collectionIndex].title;$('#lightbox-counter').textContent=(photoIndex+1)+' / '+photos.length;renderPhotoInformation(p)}
async function openLightbox(index,source){
 photoIndex=index;viewerOrigin=source;viewerClosing=false;renderLightbox();box.showModal();document.body.classList.add('photo-viewing');$('#close-lightbox').focus({preventScroll:true});
 if(!motionQuery.matches){const rect=source.getBoundingClientRect(),image=$('#lightbox-image'),end=image.getBoundingClientRect();image.animate([{opacity:.25,transform:`translate(${rect.left+rect.width/2-end.left-end.width/2}px,${rect.top+rect.height/2-end.top-end.height/2}px) scale(.7)`},{opacity:1,transform:'none'}],{duration:600,easing:'cubic-bezier(.22,1,.36,1)'});box.animate([{opacity:0},{opacity:1}],{duration:350,easing:'ease-out'})}
}
async function closeLightbox(){if(viewerClosing||!box.open)return;viewerClosing=true;photoSwap++;resetViewerZoom();await animate(box,[{opacity:1},{opacity:0}],250);box.close();box.getAnimations().forEach(a=>a.cancel());document.body.classList.remove('photo-viewing');viewerClosing=false;viewerOrigin?.focus({preventScroll:true})}
async function movePhoto(delta){const photos=currentPhotos();if(!photos.length||viewerClosing)return;const swap=++photoSwap;const image=$('#lightbox-image');if(!motionQuery.matches)await animate(image,[{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-delta*24}px)`}],140);if(swap!==photoSwap)return;image.getAnimations().forEach(a=>a.cancel());photoIndex=(photoIndex+delta+photos.length)%photos.length;renderLightbox();if(!motionQuery.matches)image.animate([{opacity:0,transform:`translateX(${delta*24}px)`},{opacity:1,transform:'none'}],{duration:400,easing:'cubic-bezier(.22,1,.36,1)'})}
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
 $('#photo-filename').textContent=photo.name;const list=$('#photo-settings');list.replaceChildren();
 const details=[['Camera',photo.camera],['Lens',photo.lens],['Settings',photo.settings],['Taken',photo.capturedAt?new Date(photo.capturedAt).toLocaleString():photo.date],['Collection',collections[collectionIndex].title]];
 for(const [label,value] of details){if(!value)continue;list.append(node('dt','',label),node('dd','',value))}
 if(!photo.camera&&!photo.settings)list.append(node('dd','','Camera settings were not provided for this photo.'));
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
 }finally{libraryLoading=false;}
}
loadLibrary();
setInterval(()=>{if(!document.hidden)loadLibrary()},60_000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastLibraryCheck>60_000)loadLibrary()});
