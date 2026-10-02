(() => {
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 // These experiences have been retired from the main journey.
 ['interactive-desk','time-and-numbers','moon-lab','director','camp-builder'].forEach(id=>$('#'+id)?.remove());
 $('.launch-study')?.remove();
 $$('.explore-ny-banner').forEach(el=>el.remove());
 const now=$('#now .section-heading h2');if(now)now.innerHTML='Curiosity doesn’t<br><span class="muted">really clock out.</span>';
 const life=$('#life-map .section-heading h2');if(life)life.innerHTML='A few paths.<br><span class="muted">All connected.</span>';
 const mapIntro=$('#life-map .section-heading>p');if(mapIntro)mapIntro.textContent='Keep scrolling through the connections.';
 // Let the shorter notes introduce the pinned map, then flow straight into New York.
 const intro=$('#introduction'),map=$('#life-map');if(intro&&map)intro.append(map);
 const chapterCards=$('.world-grid');if(chapterCards){const a=document.createElement('a');a.className='world-card ny-world-card reveal';a.href='#explore-new-york';a.innerHTML='<span class="card-top">01 <span>PLACES & FIELD NOTES</span></span><div class="card-copy"><span class="eyebrow">UPSTATE NEW YORK</span><h2>Explore<br>New York.</h2><p>A few places worth keeping close.</p><span class="card-link">Explore</span></div>';chapterCards.prepend(a);}
 // The source image is a reference: model angular coverage honestly, without inventing detail.
 const input=$('#lens-focal'),preview=$('.lens-preview');
 if(input&&preview){
  const overview=document.createElement('div');overview.className='focal-overview';overview.innerHTML='<img src="/landscape.jpg" alt="Full reference view with the selected crop outlined"><div class="focal-crop-outline"></div><span>10mm reference view</span>';preview.after(overview);
  function focal(){const f=Number(input.value),ratio=f/10,angle=2*Math.atan(23.3/(2*f))*180/Math.PI;preview.style.setProperty('--lens-zoom',String(ratio));$('.focal-crop-outline').style.width=100/ratio+'%';$('.focal-crop-outline').style.height=100/ratio+'%';$('#lens-readout').textContent=f+' mm · '+angle.toFixed(1)+'° horizontal view';$('#lens-explanation').textContent=ratio.toFixed(1)+'× tighter than 10mm on an APS-C sensor.';}
  input.oninput=focal;focal();const note=$('.lens-explorer .fine-print');if(note)note.textContent='Field-of-view model using a 10mm reference. High zoom enlarges this image’s pixels; a real lens captures more detail.';
 }
 // A single consistent exposure image replaces the mismatched sharp patch and moving dot.
 $$('.sim-focus,.sim-motion-sample').forEach(el=>el.hidden=true);
 const settings=['aperture','shutter','iso','focal'],shutters=[15,30,60,125,250,500,1000,2000],isos=[100,200,400,800,1600,3200,6400,12800];
 function exposure(){if(!$('#sim-background'))return;const aperture=+$('#sim-aperture').value,shutter=shutters[+$('#sim-shutter').value],iso=isos[+$('#sim-iso').value],focal=+$('#sim-focal').value;const ev=Math.log2((iso/400)*(250/shutter)*(8/aperture)**2);$('#sim-background').style.filter='brightness('+Math.max(.08,Math.min(4,2**ev))+')';$('#sim-background').style.transform='scale(1)';$('.sim-grain').style.opacity=Math.min(.24,Math.max(0,Math.log2(iso/100)*.03));$('#sim-readout').textContent=`f/${aperture.toFixed(1)} · 1/${shutter} s · ISO ${iso} · ${focal}mm`;$('#sim-explanation').textContent=(ev>0?'+':'')+ev.toFixed(1)+' stops from f/8 · 1/250s · ISO 400. '+(shutter>=1000?'Fast shutter for movement. ':shutter<=60?'Slow shutter lets in more light. ':'')+'Focal length changes framing, not exposure.';}
 const presets={wildlife:[6.3,7,4,600],portrait:[2.8,4,0,70],landscape:[8,3,0,18]};function updateExposure(){exposure();$('#sim-out-aperture').textContent='f/'+Number($('#sim-aperture').value).toFixed(1);$('#sim-out-shutter').textContent='1/'+shutters[+$('#sim-shutter').value]+' s';$('#sim-out-iso').textContent=isos[+$('#sim-iso').value];window.Tom.unlock('simulator');}settings.forEach(key=>{const el=$('#sim-'+key);if(el)el.oninput=updateExposure;});$$('[data-sim-preset]').forEach(b=>b.onclick=()=>{settings.forEach((key,i)=>$('#sim-'+key).value=presets[b.dataset.simPreset][i]);updateExposure();});exposure();
 const simFocal=$('#sim-focal');if(simFocal){simFocal.closest('.control-range').hidden=true;}
 const simNote=$('#camera-simulator .fine-print');if(simNote)simNote.textContent='Relative exposure preview from one reference image. Focus and subject motion aren’t simulated.';
 // Keep retired destinations from appearing as broken shortcuts.
 const retired=new Set(['interactive-desk','time-and-numbers','moon-lab','director','camp-builder']);
 $$('a[href]').forEach(a=>{const id=new URL(a.href,location.href).hash.slice(1);if(retired.has(id)){a.href=id==='camp-builder'?'#pack':id==='interactive-desk'?'#life-map':'#behind-the-lens';}});
 document.body.classList.add('cool-edition');window.Tom?.reveal();
})();
