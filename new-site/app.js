import './scroll-experience.js';
import {groupAlbumPhotos} from './album-groups.js';
import {createPhotoZoom} from './photo-zoom.js';
import {connectContactForm} from './contact-form.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const projectData = [
  {id:'nodexity',name:'Nodexity',category:'SERVER MANAGEMENT',image:'/assets/projects/nodexity-site.png',color:'nodexity',description:'A calmer home for your Minecraft servers.',detail:'A Minecraft server manager that brings starting, stopping, monitoring, and configuring servers into one workspace. The idea is simple: spend less time managing the setup and more time enjoying what you host.',tags:['Node.js','Minecraft','Server tools'],notes:['Start and stop servers from one place.','Monitor server activity and manage configuration.','Built around making self-hosting easier to manage.'],links:[['Explore Nodexity','https://nodexity.com/']]},
  {id:'delta',name:'Delta Water Explorer',category:'DATA & THE OUTDOORS',image:'/assets/projects/delta-water-explorer.webp',color:'delta',description:'A little more context for a familiar body of water.',detail:'An interactive explorer for Delta Reservoir near Rome, New York. It brings observed water levels, seasonal drawdown, and the historical record into one place, with clear sources and context.',tags:['NOAA / NWPS','USGS','Interactive charts'],notes:['Explore recent NOAA observations and historical USGS records.','Compare seasonal drawdown, refill signals, and water-level trends.','Inspect data coverage and sources behind each view.'],links:[['Explore the project','https://delta-water-explorer.vercel.app/']]},
  {id:'galleryx',name:'GalleryX',category:'DESKTOP APP · IN DEVELOPMENT',image:'/assets/projects/galleryx-site.jpg',color:'galleryx',description:'Your media, right where you left it.',detail:'An offline-first photo and video browser for large libraries on internal and external drives. GalleryX indexes media where it lives, so your original files stay in place.',tags:['Electron','SQLite','Local media'],notes:['Indexes folders in place and builds a thumbnail cache.','Photo and video galleries, favorites, timelines, and duplicate review.','Cached previews stay available when an external drive is disconnected.'],links:[['View the project site','https://galleryx-sigma.vercel.app/'],['Browse my GitHub','https://github.com/404twillCODE']]},
  {id:'minecraft',name:'Minecraft Mods',category:'EXPERIMENTS & LITTLE OBSESSIONS',image:'/assets/projects/minecraft-mods-site.webp',color:'mods',description:'Small changes. Entirely new ways to play.',detail:'A collection of Minecraft Java mods, from boat motors to rocket launchers. A place to experiment, learn, and build something just because it would be fun to use.',tags:['Minecraft Java','Game mechanics','Modding'],notes:['Boat Motors: new ways to get around on the water.','Rocket RPG: a new addition to the inventory.','Nuclear Strike: another experiment in game mechanics.'],links:[['Explore the mods & wikis','/minecraft/'],['Browse my GitHub','https://github.com/404twillCODE']]},
  {id:'afterhours',name:'Afterhours',category:'GAMES & GOOD COMPANY',image:'/assets/projects/afterhours-site.webp',description:'Your favorite people. One more game.',tags:['Multiplayer games','Watch parties','Shared rooms'],links:[['Open Afterhours','https://afterhours-game-night-chi.vercel.app/']]},
  {id:'tevisuals',name:'TE Visuals',category:'PHOTOGRAPHY & VIDEOGRAPHY',image:'/assets/projects/tevisuals-site.webp',description:'Two perspectives. A place to share what we create.',tags:['Photography','Videography','Client galleries'],links:[['Open TE Visuals','https://www.tevisuals.com/']]}
];
const projectOrder=['nodexity','minecraft','delta','galleryx','afterhours','tevisuals'];
projectData.sort((a,b)=>projectOrder.indexOf(a.id)-projectOrder.indexOf(b.id));
const galleryDialog = $('#gallery-dialog'), viewer = $('#viewer'), contactCard = $('#contact-card');
let catalog = [], filter = 'all', currentCollection, currentPhotos = [], photoIndex = 0, livePending = null;
let lastTrigger = null, galleryOpening = false, pendingRoute = false;
let albumSection='', albumGroups=[], albumSectionGrids=new Map(), lastPhotoTrigger=null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motionDisabled = reduced.matches;
try { motionDisabled = localStorage.getItem('fot-motion') === 'off' || reduced.matches; } catch {}
function updateMotion() {
  document.documentElement.classList.toggle('motion-off',motionDisabled);
  $('#motion-toggle').textContent = motionDisabled ? 'Motion: off' : 'Motion: on';
  $('#motion-toggle').setAttribute('aria-pressed',String(motionDisabled));
  dispatchEvent(new Event('portfolio:motion'));
}
updateMotion();
$('#motion-toggle').addEventListener('click',()=>{motionDisabled=!motionDisabled;try{localStorage.setItem('fot-motion',motionDisabled?'off':'on')}catch{}updateMotion();});
reduced.addEventListener('change',e=>{motionDisabled=e.matches;updateMotion();});
$$('.year').forEach(el=>el.textContent=new Date().getFullYear());
const revealObserver = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.08});
const albumRevealObserver=new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.01,rootMargin:'0px 0px 80px 0px'});
const detailRevealObserver=new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.1,rootMargin:'0px 0px 30px 0px'});
const galleryPhotoObserver=new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{root:galleryDialog,threshold:.02,rootMargin:'0px 0px 60px 0px'});
$$('.section-heading>div>*, .section-index>span, .filter-tabs button, .gallery-hint, .about-copy>p, .now-list>div, .about-copy>.text-link').forEach(el=>{
  el.classList.remove('reveal');el.classList.add('detail-reveal');detailRevealObserver.observe(el);
});
function watchReveals(root=document){$$('.reveal',root).forEach(el=>(el.matches('.scroll-album, .workbench-reveal')?albumRevealObserver:revealObserver).observe(el));}
document.documentElement.classList.add('motion-ready');watchReveals();
let scrollQueued=false;
function updateScroll(){
  scrollQueued=false;const y=window.scrollY,total=document.documentElement.scrollHeight-innerHeight;
  $('.reading-progress').style.transform=`scaleX(${total>0?Math.min(1,y/total):0})`;
  $('.site-header').classList.toggle('scrolled',y>30);
  $('.site-header').classList.toggle('nav-compact',y>160);
  if(!motionDisabled && innerWidth>760 && y<1200){$$('.reel-frame').forEach((el,i)=>el.style.translate=`0 ${Math.min(y,650)*(i===1?-.035:i===0?.02:-.015)}px`);}
}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll)}},{passive:true});
updateScroll();
const sectionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){$$('.site-header nav a').forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}});
},{rootMargin:'-20% 0px -55% 0px'});
$$('main>section[id]').forEach(section=>sectionObserver.observe(section));
const menu=$('.menu-toggle');
function closeMenu(){ $('.site-header').classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation'); }
menu.addEventListener('click',()=>{const open=$('.site-header').classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
$$('.site-header a').forEach(a=>a.addEventListener('click',closeMenu));
addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
// Tapping opens the capsule; mouse users can simply hover over it.
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.site-header'))closeMenu()});
$('.site-header').addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')closeMenu()});
$('.site-header .brand').addEventListener('click',event=>{
  const header=$('.site-header');
  if(matchMedia('(hover: none)').matches&&header.classList.contains('nav-compact')&&!header.classList.contains('menu-open')){
    event.preventDefault();event.stopImmediatePropagation();header.classList.add('menu-open');
    menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Close navigation');
  }
},true);
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
// Two identical full-width groups keep the ribbon continuous on ultrawide displays.
const ticker=$('.ticker'),tickerTrack=node('div','ticker-track'),tickerGroup=node('div','ticker-group');
const tickerWords=['TOM WILLIAMS','CODE AFTER HOURS','TAKE THE SCENIC ROUTE','UPSTATE NEW YORK','ONE MORE FRAME','BUILT FROM CURIOSITY','CAMERA IN HAND','ALWAYS EXPLORING'];
for(const word of [...tickerWords,...tickerWords])tickerGroup.append(node('span','',word),node('b','','+'));
tickerTrack.append(tickerGroup,tickerGroup.cloneNode(true));ticker.replaceChildren(tickerTrack);
new ResizeObserver(()=>ticker.style.setProperty('--ticker-duration',`${Math.max(45,tickerGroup.scrollWidth/34)}s`)).observe(ticker);
function safeUrl(raw){try{const u=new URL(raw,location.origin);return u.protocol==='https:'||u.origin===location.origin?u.href:'';}catch{return '';}}
function externalLink(text,url,className=''){const a=node('a',className,text);a.href=safeUrl(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
function image(src,alt,loading='lazy'){const img=node('img');img.src=safeUrl(src);img.alt=alt;img.loading=loading;img.decoding='async';return img;}
const collectionDescriptions={
 'Adam LZ World Tour':'A weekend of cars, tire smoke, and the details between runs.',
 'Buffalo Cars And Coffee':'Early starts, good conversations, and a few very good reasons to bring a camera.',
 'Camping':'Getting a little farther from the screen. Looking a little closer at everything else.',
 'Chrysler 300':'Familiar lines, a different perspective. A closer look at a personal favorite.',
 'Gas Station Shoot':'A late-night stop. Quiet streets, clean lines, and a different kind of car shoot.',
 'Sylvan Beach':'A quieter pace by the water, with a camera along for the walk.'
};
const collectionOrder=['Camping','Adam LZ World Tour','Buffalo Cars And Coffee','Gas Station Shoot','Chrysler 300','Sylvan Beach'];
function normalize(data){
  if(!Array.isArray(data.collections))throw Error('Unavailable catalog');
  return data.collections.filter(c=>c.id&&c.name&&Array.isArray(c.photos)&&c.photos.length).map(c=>({...c,category:c.category||'Photography',totalPhotos:c.totalPhotos||c.photos.length,photos:c.photos.filter(p=>p.id&&safeUrl(p.url))})).sort((a,b)=>{const ai=collectionOrder.indexOf(a.name),bi=collectionOrder.indexOf(b.name);return (ai<0?100:ai)-(bi<0?100:bi)});
}
function renderCollections(){
  const grid=$('#collection-grid');grid.replaceChildren();
  const list=catalog.filter(c=>filter==='all'||c.category===filter);
  $('#collection-count').textContent=String(catalog.length).padStart(2,'0');
  for(const [index,c] of list.entries()){
    const card=node('button','collection-card scroll-album reveal');card.type='button';card.setAttribute('aria-label',`Explore ${c.name} collection`);
    const frame=node('div','collection-image');frame.append(image(c.coverUrl||c.photos[0].url,`${c.name} — photograph by Tom Williams`),node('span','collection-number',String(index+1).padStart(2,'0')),node('span','collection-open','↗'));
    const meta=node('div','collection-meta');meta.append(node('h3','',c.name),node('span','',c.category.toUpperCase()));
    card.append(frame,meta,node('p','collection-caption',`${c.totalPhotos} photographs · ${c.photos[0].date||'Through my lens'}`));card.addEventListener('click',()=>{lastTrigger=card;location.hash=`gallery/${c.id}`});grid.append(card);
  }
  watchReveals(grid);
  dispatchEvent(new Event('portfolio:collections'));
  if(!list.length)grid.append(node('p','catalog-status','No collections in this category yet.'));
}
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.filter;$$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});renderCollections();
}));
let selectProject;
function renderProjects(){
  const grid=$('#project-grid');grid.replaceChildren();
  const nav=node('div','workbench-index');nav.setAttribute('role','group');nav.setAttribute('aria-label','Select a coding project');
  const panel=node('section','workbench-screen');panel.setAttribute('aria-label','Selected project preview');
  const navArrival=node('div','workbench-arrival workbench-reveal reveal'),panelArrival=node('div','workbench-arrival workbench-preview-arrival workbench-reveal reveal');
  const buttons=[];
  function select(p,index){
    buttons.forEach((button,i)=>{button.classList.toggle('selected',i===index);button.setAttribute('aria-pressed',String(i===index));});
    panel.replaceChildren();
    const bar=node('div','workbench-bar');bar.append(node('span','console-lights','● ● ●'),node('span','',p.id+' / project-preview'),node('span','',String(index+1).padStart(2,'0')+' / '+String(projectData.length).padStart(2,'0')));
    const visual=externalLink('',p.links[0][1],'workbench-visual workbench-preview-link');visual.setAttribute('aria-label','Open '+p.name+' website (opens in a new tab)');
    if(p.image)visual.append(image(p.image,p.name+' interface preview','eager'));
    const copy=node('div','workbench-copy'),text=node('div','workbench-summary');text.append(node('h3','',p.name),node('p','',p.description));
    const prompt=node('span','workbench-hover-prompt','Open website');prompt.setAttribute('aria-hidden','true');visual.append(prompt);
    const meta=node('div','workbench-meta'),kind=node('span','workbench-kind',p.category.charAt(0)+p.category.slice(1).toLowerCase());
    const tags=node('div','workbench-stack');tags.setAttribute('aria-label','Built with');p.tags.forEach(tag=>tags.append(node('span','',tag)));meta.append(kind,tags);copy.append(text,meta);panel.append(bar,visual,copy);
  }
  projectData.forEach((p,index)=>{const button=node('button','project-selector');button.type='button';button.style.setProperty('--selector-order',String(index+1));button.setAttribute('aria-label','Show '+p.name+' project');const label=node('span');label.append(node('strong','',p.name),node('small','',p.category));button.append(node('span','project-selector-number','0'+(index+1)),label,node('span','project-selector-arrow','↗'));button.addEventListener('click',()=>select(p,index));buttons.push(button);nav.append(button);});
  const intro=node('div','workbench-index-label','~/ selected-work');nav.prepend(intro);navArrival.append(nav);panelArrival.append(panel);grid.append(navArrival,panelArrival);select(projectData[0],0);watchReveals(grid);
  selectProject=id=>{const index=projectData.findIndex(p=>p.id===id);if(index>=0)select(projectData[index],index)};
}

renderProjects();
function showDialog(dialog){if(!dialog.open)dialog.showModal();}
function restoreTrigger(){if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});}
function replaceHash(hash){history.replaceState(null,'','#'+hash);}
function closeGallery(){viewer.close();galleryDialog.close();replaceHash('photography');restoreTrigger();}
$('#gallery-close-icon').addEventListener('click',closeGallery);
const albumNavigation=$('.album-navigation'),albumBrand=$('.album-navigation .album-brand');
function updateAlbumNavigation(){
  const compact=galleryDialog.scrollTop>120;albumNavigation.classList.toggle('nav-compact',compact);
  albumBrand.setAttribute('aria-expanded',String(!compact||albumNavigation.classList.contains('menu-open')));
}
galleryDialog.addEventListener('scroll',updateAlbumNavigation,{passive:true});
albumBrand.addEventListener('click',()=>{albumNavigation.classList.toggle('menu-open');updateAlbumNavigation()});
albumNavigation.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){albumNavigation.classList.remove('menu-open');updateAlbumNavigation()}});
galleryDialog.addEventListener('pointerdown',event=>{if(!albumNavigation.contains(event.target)){albumNavigation.classList.remove('menu-open');updateAlbumNavigation()}});
galleryDialog.addEventListener('cancel',e=>{e.preventDefault();closeGallery()});
function showCollection(c){
  const opening=currentCollection?.id!==c.id || !galleryDialog.open;
  if(opening){
    currentCollection=c;albumSection='';albumGroups=groupAlbumPhotos(c.photos);
    $('#gallery-title').textContent=c.name;$('#gallery-category').textContent=c.category.toUpperCase()+' / TOM WILLIAMS';
    $('#gallery-description').textContent=collectionDescriptions[c.name]||'A collection of moments through my lens.';
    const link=$('#full-gallery-link');link.href=safeUrl(c.sourceUrl||'https://www.tevisuals.com/photographer/tom');
    renderAlbumFilters();renderAlbum();
  }
  showDialog(galleryDialog);if(opening&&!galleryOpening){galleryDialog.scrollTop=0;albumNavigation.classList.remove('menu-open');updateAlbumNavigation();galleryOpening=true;requestAnimationFrame(()=>galleryOpening=false);}
}
function renderAlbumFilters(){
  const tabs=$('#album-filters');tabs.replaceChildren();
  tabs.hidden=!albumGroups.some(group=>group.name);
  const options=[{name:'',label:'All photos',count:currentCollection.photos.length},...albumGroups.map(group=>({name:group.name||'__ungrouped',label:group.name||'More photographs',count:group.photos.length}))];
  for(const option of options){
    const button=node('button','album-filter');button.type='button';button.dataset.section=option.name;
    button.append(document.createTextNode(option.label),node('span','',String(option.count).padStart(2,'0')));
    button.setAttribute('aria-pressed',String(albumSection===option.name));
    button.addEventListener('click',()=>{albumSection=option.name;renderAlbum();});tabs.append(button);
  }
}
function renderAlbum(){
  $$('.album-photo').forEach(photo=>galleryPhotoObserver.unobserve(photo));
  const groups=albumGroups.filter(group=>!albumSection||(group.name||'__ungrouped')===albumSection);
  currentPhotos=groups.flatMap(group=>group.photos);albumSectionGrids=new Map();
  $('#album-grid').replaceChildren();
  $$('#album-filters button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.section===albumSection)));
  $('#album-photo-count').textContent=`${currentPhotos.length} photograph${currentPhotos.length===1?'':'s'}${currentPhotos[0]?.date?' / '+currentPhotos[0].date:''}`;
  renderAlbumPhotos();
}
function renderAlbumPhotos(){
  const grid=$('#album-grid');
  for(let i=0;i<currentPhotos.length;i++){
    const sectionName=currentPhotos[i].section?.trim()||'';
    if(!albumSectionGrids.has(sectionName)){
      const section=node('section','album-section'),photos=node('div','album-section-grid');
      if(sectionName||albumGroups.length>1){
        const heading=node('div','album-section-heading'),title=node('h3','',sectionName||'More photographs');
        const group=albumGroups.find(group=>group.name===sectionName);
        heading.append(node('span','album-section-index',String(albumSectionGrids.size+1).padStart(2,'0')+' /'),title,node('span','album-section-count',`${group.photos.length} photograph${group.photos.length===1?'':'s'}`));section.append(heading);
      }
      section.append(photos);grid.append(section);albumSectionGrids.set(sectionName,photos);
    }
    const p=currentPhotos[i],button=node('button','album-photo');button.type='button';button.setAttribute('aria-label',`View photograph ${i+1}: ${currentCollection.name}`);
    const img=image(p.thumbnailUrl||p.url,`${currentCollection.name} — ${p.name||'Photograph '+(i+1)}`);
    if(p.width&&p.height){img.width=p.width;img.height=p.height;}
    button.style.setProperty('--photo-delay',`${(i%4)*65}ms`);
    button.append(img,node('span','','View photograph ↗'));button.addEventListener('click',()=>{lastPhotoTrigger=button;location.hash=`photo/${currentCollection.id}/${p.id}`});albumSectionGrids.get(sectionName).append(button);galleryPhotoObserver.observe(button);
  }
}
function renderPhoto(){
  const p=currentPhotos[photoIndex];if(!p)return;
  const img=$('#viewer-image');$('#zoom-photo').classList.add('is-loading');img.src=safeUrl(p.url);img.alt=`${currentCollection.name} — ${p.name||'Photograph '+(photoIndex+1)} by Tom Williams`;
  if(img.complete&&img.naturalWidth)$('#zoom-photo').classList.remove('is-loading');
  $('#viewer-title').textContent=currentCollection.name;$('#viewer-count').textContent=`${String(photoIndex+1).padStart(2,'0')} / ${String(currentPhotos.length).padStart(2,'0')}`;
  $('#viewer-section').textContent=p.section||currentCollection.category;
  $('#viewer-camera').textContent=p.techCaption||[p.camera,p.lens,p.settings].filter(Boolean).join(' · ');
  $('#buy-photo').href=safeUrl(p.buyUrl||p.sourceUrl||currentCollection.sourceUrl||'https://www.tevisuals.com/photographer/tom');
  photoZoom.reset();
  $('#copy-photo').textContent='Copy photo link';$('#viewer-status').textContent='';
  $('#prev-photo').disabled=currentPhotos.length<2;$('#next-photo').disabled=currentPhotos.length<2;
  renderViewerThumbnails();
}
function renderViewerThumbnails(){
  const strip=$('#viewer-thumbnails'),hadFocus=strip.contains(document.activeElement);strip.replaceChildren();
  const start=Math.max(0,Math.min(photoIndex-3,currentPhotos.length-7)),end=Math.min(currentPhotos.length,start+7);
  for(let i=start;i<end;i++){
    const p=currentPhotos[i],button=node('button','viewer-thumbnail');button.type='button';button.setAttribute('aria-label',`Show photograph ${i+1}`);
    const preview=node('span','viewer-thumbnail-preview');preview.setAttribute('aria-hidden','true');preview.append(image(p.thumbnailUrl||p.url,'','eager'));
    button.setAttribute('aria-current',String(i===photoIndex));button.append(image(p.thumbnailUrl||p.url,'','eager'),preview);
    button.addEventListener('click',()=>{location.hash=`photo/${currentCollection.id}/${p.id}`});strip.append(button);
  }
  if(hadFocus)$('[aria-current="true"]',strip)?.focus({preventScroll:true});
}
function movePhoto(delta){photoIndex=(photoIndex+delta+currentPhotos.length)%currentPhotos.length;renderPhoto();replaceHash(`photo/${currentCollection.id}/${currentPhotos[photoIndex].id}`);}
$('#prev-photo').addEventListener('click',()=>movePhoto(-1));$('#next-photo').addEventListener('click',()=>movePhoto(1));
function closeViewer(){photoZoom.reset();viewer.close();replaceHash(`gallery/${currentCollection.id}`);if(lastPhotoTrigger?.isConnected)lastPhotoTrigger.focus({preventScroll:true});}
$('#close-viewer').addEventListener('click',closeViewer);viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer()});
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();movePhoto(-1)}if(e.key==='ArrowRight'){e.preventDefault();movePhoto(1)}});
const photoZoom=createPhotoZoom($('#zoom-photo'),$('#viewer-image'),closeViewer);
$('.viewer-stage').addEventListener('click',event=>{if(event.target===$('.viewer-stage'))closeViewer()});
let touchStart=null;$('#zoom-photo').addEventListener('touchstart',e=>{touchStart=e.touches[0].clientX},{passive:true});$('#zoom-photo').addEventListener('touchend',e=>{if(touchStart!==null&&!$('#zoom-photo').classList.contains('zoomed')){const delta=e.changedTouches[0].clientX-touchStart;if(Math.abs(delta)>70)movePhoto(delta>0?-1:1)}touchStart=null},{passive:true});
$('#viewer-image').addEventListener('load',()=>{$('#zoom-photo').classList.remove('is-loading');});
$('#viewer-image').addEventListener('error',()=>{$('#zoom-photo').classList.remove('is-loading');$('#viewer-status').textContent='This photograph could not be loaded. Try the next photograph or open the full collection.';});
$('#copy-photo').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#copy-photo').textContent='Link copied ✓';}catch{$('#viewer-status').textContent='Copy the address from your browser to share this photograph.';}});
let contactTrigger=null,contactAnimation=null;
function setContactCompose(open){
  if(!open&&contactForm.isSending())return;
  if(open&&!contactCard.classList.contains('is-composing')&&contactCard.dataset.formState==='sent')contactForm.reset();
  const oldHeight=contactCard.offsetHeight;
  contactAnimation?.cancel();
  const summary=$('#contact-summary'),compose=$('#contact-compose');
  contactCard.classList.toggle('is-composing',open);
  summary.hidden=open;compose.hidden=!open;$('#close-contact').hidden=!open;
  $$('[data-contact]').forEach(button=>button.setAttribute('aria-expanded',String(open)));
  const newHeight=contactCard.offsetHeight,content=open?compose:summary;
  const finishOpening=()=>{
    if(!contactCard.classList.contains('is-composing'))return;
    const rect=contactCard.getBoundingClientRect();
    if(rect.top<90||rect.bottom>innerHeight-20)contactCard.scrollIntoView({behavior:motionDisabled?'instant':'smooth',block:'start'});
  };
  if(!motionDisabled){
    contactAnimation=contactCard.animate([{height:oldHeight+'px'},{height:newHeight+'px'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
    content.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:550,delay:100,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    if(open)contactAnimation.finished.then(finishOpening).catch(()=>{});
  }
  if(open){
    $('input',compose).focus({preventScroll:true});
    if(motionDisabled)finishOpening();
  }else if(contactTrigger?.isConnected)contactTrigger.focus({preventScroll:true});
}
$$('[data-contact]').forEach(button=>{button.setAttribute('aria-controls','contact-compose');button.setAttribute('aria-expanded','false');button.addEventListener('click',()=>{contactTrigger=button;setContactCompose(true)});});
$('#close-contact').addEventListener('click',()=>setContactCompose(false));
addEventListener('keydown',event=>{if(event.key==='Escape'&&contactCard.contains(document.activeElement)&&contactCard.classList.contains('is-composing')){event.preventDefault();setContactCompose(false)}});
const contactForm=connectContactForm($('#contact-form'),{onResize:oldHeight=>{
  contactAnimation?.cancel();
  if(!motionDisabled)contactAnimation=contactCard.animate([{height:oldHeight+'px'},{height:contactCard.offsetHeight+'px'}],{duration:550,easing:'cubic-bezier(.22,1,.36,1)'});
}});
function route(){
  pendingRoute=false;
  const [kind,id,photoId]=location.hash.slice(1).split('/');
  if(kind==='gallery'||kind==='photo'){
    const c=catalog.find(c=>c.id===id);if(!c){pendingRoute=true;return;}
    showCollection(c);
    if(kind==='photo'){
      let index=currentPhotos.findIndex(p=>p.id===photoId);
      if(index<0&&c.photos.some(p=>p.id===photoId)){albumSection='';renderAlbum();index=currentPhotos.findIndex(p=>p.id===photoId);}
      if(index<0){pendingRoute=true;return;}photoIndex=index;renderPhoto();showDialog(viewer);
    }else viewer.close();
  }else if(kind==='project'){
    const p=projectData.find(p=>p.id===id);if(p){viewer.close();galleryDialog.close();selectProject(id);replaceHash('projects');$('#projects').scrollIntoView({behavior:motionDisabled?'instant':'smooth',block:'start'});}
  }else{viewer.close();galleryDialog.close();}
}
addEventListener('hashchange',route);
async function loadCatalog(){
  try{const response=await fetch('/catalog.json');if(!response.ok)throw Error('Catalog missing');catalog=normalize(await response.json());renderCollections();route();}
  catch{$('#catalog-status').textContent='The photo library is taking a moment. You can still explore the full collection on TEVisuals.';}
  // The local snapshot gives the portfolio an immediate, offline-friendly first render.
  // A successful API response replaces it with the complete, current photo library.
  refreshCatalog();
}
let catalogRefreshing=false;
function refreshCatalog(){
  if(catalogRefreshing||document.hidden)return;
  catalogRefreshing=true;
  livePending=fetch('/api/portfolio-photos',{signal:AbortSignal.timeout(45000)}).then(async response=>{
    if(!response.ok)return;const data=normalize(await response.json());if(!data.length)return;
    if(JSON.stringify(data)===JSON.stringify(catalog))return;
    catalog=data;
    // Avoid replacing buttons under the keyboard focus or changing an open collection.
    if(!galleryDialog.open&&!$('#collection-grid').contains(document.activeElement))renderCollections();
    if(pendingRoute){currentCollection=undefined;route();}
    else if(!galleryDialog.open)route();
  }).catch(()=>{}).finally(()=>{catalogRefreshing=false});
}
loadCatalog();
setInterval(refreshCatalog,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCatalog()});
