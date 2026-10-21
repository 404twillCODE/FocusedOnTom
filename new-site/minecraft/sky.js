const canvas=document.querySelector('#mod-stars'),ctx=canvas.getContext('2d');
let width=innerWidth,height=innerHeight,dpr=1,particles=[],meteor=null,nextMeteor=0,dirty=true,pointerX=innerWidth/2,pointerY=innerHeight/2;
const mobile=()=>innerWidth<=760;
const still=()=>document.documentElement.classList.contains('motion-off')||matchMedia('(prefers-reduced-motion: reduce)').matches;
function sizeCanvas(){
  width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  particles=Array.from({length:mobile()?95:210},(_,i)=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.05+.25,v:.035+Math.random()*.065,phase:i*1.7,warm:i%7===0,spark:i%29===0}));
  meteor=null;
  dirty=true;
}
sizeCanvas();
function drawAmbient(time,delta,animate=true){
  ctx.clearRect(0,0,width,height);
  const mx=animate?(pointerX/width-.5)*5:0,my=animate?(pointerY/height-.5)*5:0;
  for(const point of particles){
    point.y-=point.v*delta/16.67;if(point.y<-5){point.y=height+5;point.x=Math.random()*width;}
    const alpha=.16+(Math.sin(time*.0007+point.phase)+1)*.2;
    ctx.fillStyle=`rgba(${point.warm?'255,164,118':'175,218,242'},${alpha})`;ctx.beginPath();ctx.arc(point.x+mx,point.y+my,point.r,0,Math.PI*2);ctx.fill();
    if(point.spark){
      const shimmer=Math.max(0,Math.sin(time*.0008+point.phase));
      ctx.strokeStyle=`rgba(190,225,248,${shimmer*.24})`;ctx.lineWidth=.6;ctx.beginPath();
      ctx.moveTo(point.x+mx-3,point.y+my);ctx.lineTo(point.x+mx+3,point.y+my);
      ctx.moveTo(point.x+mx,point.y+my-3);ctx.lineTo(point.x+mx,point.y+my+3);ctx.stroke();
    }
  }
  if(!animate)return;
  if(!nextMeteor)nextMeteor=time+2300;
  if(!meteor&&time>=nextMeteor){
    const direction=Math.random()<.78?-1:1;
    meteor={start:time,x:width*(direction<0?.35+Math.random()*.6:.05+Math.random()*.5),y:height*(.04+Math.random()*.45),direction,duration:1450+Math.random()*650};
    nextMeteor=time+4000+Math.random()*3500;
  }
  if(meteor){
    const progress=(time-meteor.start)/meteor.duration;
    if(progress>=1){meteor=null;return;}
    const distance=progress*Math.min(width*.5,520),x=meteor.x+meteor.direction*distance,y=meteor.y+distance*.55;
    const tail=Math.min(mobile()?95:165,distance),fade=Math.sin(progress*Math.PI);
    const tx=x-meteor.direction*tail,ty=y-tail*.55;
    const length=Math.hypot(x-tx,y-ty)||1,nx=-(y-ty)/length,ny=(x-tx)/length;
    const gradient=ctx.createLinearGradient(x,y,tx,ty);
    gradient.addColorStop(0,`rgba(235,248,255,${fade*.9})`);
    gradient.addColorStop(.14,`rgba(162,219,255,${fade*.65})`);
    gradient.addColorStop(.55,`rgba(113,180,229,${fade*.2})`);
    gradient.addColorStop(1,'rgba(113,180,229,0)');
    // A widening shoulder and tapered tip give the trail a comet silhouette.
    ctx.fillStyle=gradient;ctx.shadowColor=`rgba(141,205,255,${fade*.45})`;ctx.shadowBlur=7;
    ctx.beginPath();ctx.moveTo(tx,ty);
    ctx.quadraticCurveTo(x-(x-tx)*.23+nx*2.3,y-(y-ty)*.23+ny*2.3,x+nx*.8,y+ny*.8);
    ctx.lineTo(x-nx*.8,y-ny*.8);
    ctx.quadraticCurveTo(x-(x-tx)*.23-nx*2.3,y-(y-ty)*.23-ny*2.3,tx,ty);ctx.fill();
    ctx.shadowBlur=0;
    const halo=ctx.createRadialGradient(x,y,0,x,y,8);
    halo.addColorStop(0,`rgba(247,252,255,${fade*.65})`);
    halo.addColorStop(.25,`rgba(167,220,255,${fade*.3})`);
    halo.addColorStop(1,'rgba(133,202,255,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(255,240,223,${fade})`;ctx.beginPath();ctx.arc(x,y,1.25,0,Math.PI*2);ctx.fill();
    for(let i=1;i<=3;i++){
      const behind=9+i*13,sparkle=fade*(.12+.12*Math.sin(time*.013+i*2));
      if(behind>distance)continue;
      ctx.fillStyle=`rgba(199,228,255,${sparkle})`;ctx.beginPath();ctx.arc(x-meteor.direction*behind+nx*Math.sin(i*2)*3,y-behind*.55+ny*Math.sin(i*2)*3,.65,0,Math.PI*2);ctx.fill();
    }
  }
}

let frame=0,previous=0;
function tick(time){frame=0;if(document.hidden)return;const reduced=still();if(reduced){drawAmbient(0,0,false);return;}if(time-previous>32){drawAmbient(time,Math.min(50,time-previous||16.67));previous=time;}frame=requestAnimationFrame(tick);}
function start(){if(!frame)frame=requestAnimationFrame(tick);}
addEventListener('resize',()=>{sizeCanvas();start()});
addEventListener('portfolio:motion',start);
addEventListener('pointermove',event=>{if(event.pointerType==='mouse'){pointerX=event.clientX;pointerY=event.clientY}},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else start()});start();
