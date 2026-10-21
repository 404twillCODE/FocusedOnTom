// Refraction is rendered in the backdrop layer. Text and photographs remain sharp.
// Displacement maps are generated only when a surface is created or resized.
const NS='http://www.w3.org/2000/svg';
const svg=document.createElementNS(NS,'svg');
svg.setAttribute('aria-hidden','true');svg.classList.add('glass-filter-definitions');
const defs=document.createElementNS(NS,'defs');svg.append(defs);document.body.append(svg);
let nextId=0,pending=false;
const surfaces=new WeakMap();
const tracked=new Set();
const supported=CSS.supports('backdrop-filter','url("#glass-test")');
const chromium=/Chrome|Chromium|Edg\//.test(navigator.userAgent);
function element(tag,attributes){const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;}
function displacement(width,height,radius,band){
  const w=Math.max(2,Math.round(width)),h=Math.max(2,Math.round(height));
  const ratio=Math.min(1,420/w,320/h),mw=Math.max(2,Math.round(w*ratio)),mh=Math.max(2,Math.round(h*ratio));
  const canvas=document.createElement('canvas');canvas.width=mw;canvas.height=mh;
  const context=canvas.getContext('2d'),pixels=context.createImageData(mw,mh),r=Math.min(radius,w/2,h/2);
  for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
    const px=(x+.5)*w/mw-w/2,py=(y+.5)*h/mh-h/2;
    const qx=Math.abs(px)-(w/2-r),qy=Math.abs(py)-(h/2-r);
    const ox=Math.max(qx,0),oy=Math.max(qy,0),length=Math.hypot(ox,oy);
    const signed=length+Math.min(Math.max(qx,qy),0)-r;
    let nx=0,ny=0;
    if(ox>0&&oy>0){nx=ox/length*Math.sign(px);ny=oy/length*Math.sign(py);}
    else if(qx>qy)nx=Math.sign(px);else ny=Math.sign(py);
    const depth=-signed;
    const profile=depth>=0&&depth<band?Math.cos(depth/band*Math.PI/2)**2:0;
    const index=(y*mw+x)*4;
    pixels.data[index]=Math.round(128+nx*profile*115);
    pixels.data[index+1]=Math.round(128+ny*profile*115);
    pixels.data[index+2]=128;pixels.data[index+3]=255;
  }
  context.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
}
function update(surface){
  const state=surfaces.get(surface);if(!state)return;
  const w=surface.clientWidth,h=surface.clientHeight;if(w<2||h<2)return;
  const radius=parseFloat(getComputedStyle(surface).borderTopLeftRadius)||24;
  const dimensions=`${w}:${h}:${radius}`;if(state.dimensions===dimensions)return;
  state.dimensions=dimensions;
  const band=state.photo?13:Math.min(20,h*.35);
  state.filter.setAttribute('width',w);state.filter.setAttribute('height',h);
  state.map.setAttribute('width',w);state.map.setAttribute('height',h);
  state.map.setAttribute('href',displacement(w,h,radius,band));
}
const resize=new ResizeObserver(entries=>entries.forEach(entry=>update(entry.target)));
function enhance(surface,photo=false){
  if(surfaces.has(surface)){const state=surfaces.get(surface);if(!surface.contains(state.layer))surface.prepend(state.layer);return;}
  const id=`optical-glass-${++nextId}`;
  const filter=element('filter',{id,x:0,y:0,width:1,height:1,filterUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'});
  const soft=element('feGaussianBlur',{in:'SourceGraphic',stdDeviation:photo?'.15':'.45',result:'soft-backdrop'});
  const map=element('feImage',{x:0,y:0,width:1,height:1,preserveAspectRatio:'none',result:'lens-map'});
  const bend=element('feDisplacementMap',{in:'soft-backdrop',in2:'lens-map',scale:photo?22:30,xChannelSelector:'R',yChannelSelector:'G'});
  filter.append(soft,map,bend);defs.append(filter);
  const optical=document.createElement('span');optical.className=photo?'glass-photo-lens':'glass-optics';optical.setAttribute('aria-hidden','true');
  if(supported&&chromium)optical.style.backdropFilter=`url("#${id}") saturate(1.15)`;
  else optical.style.backdropFilter=photo?'blur(.3px) saturate(1.1)':'blur(9px) saturate(1.25)';
  optical.style.webkitBackdropFilter=photo?'blur(.3px)':'blur(9px)';
  surface.classList.add(photo?'optic-photo':'optic-surface');surface.prepend(optical);
  surfaces.set(surface,{filter,map,photo,layer:optical,dimensions:''});tracked.add(surface);resize.observe(surface);update(surface);
}
function scan(){
  pending=false;
  for(const surface of tracked){if(!surface.isConnected){const state=surfaces.get(surface);state.filter.remove();resize.unobserve(surface);surfaces.delete(surface);tracked.delete(surface);}}
  document.querySelectorAll('.site-header,.filter-tabs,.workbench-index,.workbench-screen,.collection-card').forEach(surface=>enhance(surface));
  document.querySelectorAll('.collection-image').forEach(surface=>enhance(surface,true));
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(scan);}}
const changes=new MutationObserver(schedule);
for(const selector of ['#collection-grid','#project-grid'])changes.observe(document.querySelector(selector),{childList:true,subtree:true});
schedule();
