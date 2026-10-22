import {connectNavigation} from '../navigation.js';
import './sky.js';
const root=document.documentElement,header=document.querySelector('.site-header'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let disabled=motion.matches;
try{disabled ||= localStorage.getItem('fot-motion')==='off'}catch{}
function updateMotion(){root.classList.toggle('motion-off',disabled);const button=document.querySelector('#mc-motion');if(button){button.textContent=disabled?'Motion: off':'Motion: on';button.setAttribute('aria-pressed',String(disabled))}dispatchEvent(new Event('portfolio:motion'))}
updateMotion();
document.querySelector('#mc-motion')?.addEventListener('click',()=>{disabled=!disabled;try{localStorage.setItem('fot-motion',disabled?'off':'on')}catch{}updateMotion()});
motion.addEventListener('change',event=>{disabled=event.matches;updateMotion()});
const reveal=new IntersectionObserver((entries,observer)=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target)}},{threshold:.05,rootMargin:'0px 0px 50px 0px'});
root.classList.add('mc-motion-ready');document.querySelectorAll('.mc-reveal,.collection-title,.collection-feature,.wiki-hero').forEach(element=>{element.classList.add('mc-reveal');reveal.observe(element)});
let queued=false;
function updateScroll(){
 queued=false;const y=scrollY,total=root.scrollHeight-innerHeight;
 header.classList.toggle('nav-compact',y>160);header.classList.toggle('scrolled',y>30);
 document.querySelector('.mc-progress').style.transform=`scaleX(${total>0?Math.min(1,y/total):0})`;
 const scene=document.querySelector('.block-scene');
 if(scene){const progress=disabled?0:Math.min(1,y/(innerHeight*.8));scene.style.setProperty('--sandbox-scroll',progress.toFixed(4));document.querySelector('.sandbox-copy h1').style.translate=`${progress*-18}px 0`}
 const grid=document.querySelector('.mod-tiles');
 if(grid){
  const top=grid.getBoundingClientRect().top;
  const positions=[...grid.querySelectorAll('.mod-tile:not([hidden])')].map(card=>[card,disabled?0:Math.max(-1,Math.min(1,(innerHeight*.5-top-card.offsetTop-card.offsetHeight*.5)/(innerHeight*.85)))]);
  for(const [card,position] of positions)card.style.setProperty('--mod-position',position.toFixed(5));
  const collection=document.querySelector('#collection'),heading=collection.querySelector('.library-heading');
  collection.style.setProperty('--collection-enter',(disabled?1:Math.max(0,Math.min(1,(innerHeight*.9-heading.getBoundingClientRect().top)/(innerHeight*.7)))).toFixed(5));
 }
}
function request(){if(!queued){queued=true;requestAnimationFrame(updateScroll)}}
addEventListener('scroll',request,{passive:true});addEventListener('resize',request);addEventListener('portfolio:motion',request);updateScroll();
connectNavigation(header);

document.querySelectorAll('[data-filter],#mod-search').forEach(element=>{element.addEventListener('click',request);element.addEventListener('input',request)});
