// Drag the enlarged image itself; the surrounding space still closes the viewer.
export function createPhotoZoom(frame,img,onOutside){
  let zoomed=false,panX=0,panY=0,limitX=0,limitY=0,drag=null,suppressClick=false;
  img.draggable=false;
  function pan(x,y){
    panX=Math.max(-limitX,Math.min(limitX,x));panY=Math.max(-limitY,Math.min(limitY,y));
    frame.style.setProperty('--pan-x',`${panX}px`);frame.style.setProperty('--pan-y',`${panY}px`);
  }
  function reset(){
    zoomed=false;drag=null;suppressClick=false;frame.classList.remove('zoomed','is-dragging');
    frame.setAttribute('aria-pressed','false');frame.setAttribute('aria-label','Zoom photograph');
    frame.style.removeProperty('--zoom-width');frame.style.removeProperty('--zoom-height');pan(0,0);
  }
  frame.addEventListener('click',event=>{
    if(suppressClick){suppressClick=false;return;}
    const photo=img.getBoundingClientRect(),box=frame.getBoundingClientRect();
    const keyboard=event.detail===0;
    if(!keyboard&&(event.clientX<photo.left||event.clientX>photo.right||event.clientY<photo.top||event.clientY>photo.bottom)){onOutside();return;}
    if(zoomed){reset();return;}
    if(!img.complete||!img.naturalWidth)return;
    const scale=Math.min(4,Math.max(2.25,box.width/photo.width*1.2,box.height/photo.height*1.2));
    const width=photo.width*scale,height=photo.height*scale;
    limitX=Math.max(0,(width-box.width)/2);limitY=Math.max(0,(height-box.height)/2);
    frame.style.setProperty('--zoom-width',`${width}px`);frame.style.setProperty('--zoom-height',`${height}px`);
    zoomed=true;frame.classList.add('zoomed');frame.setAttribute('aria-pressed','true');
    frame.setAttribute('aria-label','Zoomed photograph. Drag to move, click to zoom out');
    pan(keyboard?0:-(event.clientX-photo.left-photo.width/2)*(scale-1),keyboard?0:-(event.clientY-photo.top-photo.height/2)*(scale-1));
  });
  frame.addEventListener('pointerdown',event=>{
    if(!zoomed||!event.isPrimary||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,panX,panY,moved:false};
    frame.setPointerCapture(event.pointerId);
  });
  frame.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<5)return;
    drag.moved=true;frame.classList.add('is-dragging');pan(drag.panX+dx,drag.panY+dy);
  });
  frame.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    suppressClick=drag.moved;drag=null;frame.classList.remove('is-dragging');
    if(frame.hasPointerCapture(event.pointerId))frame.releasePointerCapture(event.pointerId);
  });
  frame.addEventListener('pointercancel',()=>{drag=null;suppressClick=false;frame.classList.remove('is-dragging')});
  frame.addEventListener('lostpointercapture',()=>{drag=null;frame.classList.remove('is-dragging')});
  addEventListener('resize',reset);
  return {reset};
}
