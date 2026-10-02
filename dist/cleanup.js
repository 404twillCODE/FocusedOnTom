(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 function text(selector,value){const el=$(selector);if(el)el.textContent=value;}
 function heading(id,title,caption){const root=$('#'+id);if(!root)return;const h=$('.section-heading h2',root);if(h)h.textContent=title;const p=$('.section-heading>p',root);if(p){if(caption)p.textContent=caption;else p.remove();}}
 // Keep the identity short; the rest of the page shows the interests in action.
 const about=$('.about-body');if(about)about.innerHTML='<p>I’m Tom—a developer, photographer, and outdoors person from Upstate New York.</p><p>Code, cameras, and time outside.</p>';
 text('.hero-top span','TOM WILLIAMS');
 text('.hero-coordinate','CODE. CAPTURE. EXPLORE.');
 text('#worlds .section-heading p','Photography, projects, and the outdoors.');
 text('#worlds .section-heading h1','A few sides of me.');
 $$('.world-card .card-link').forEach(el=>el.textContent='Explore');
 $$('.code-story,.scroll-invitation').forEach(el=>el.remove());
 const overlap=$('#overlap');if(overlap){$$('p',overlap).forEach(el=>el.remove());const h=$('h2',overlap);if(h)h.textContent='After dark.';}
 // Collapse repeated biography into the interactive map already on the page.
 const learning=$('#still-learning');if(learning){const banner=$('.explore-ny-banner',learning);if(banner)learning.before(banner);learning.remove();}
 heading('life-map','Connected interests.','Choose a thread.');
 heading('interactive-desk','On my desk.','Pick something up.');
 heading('time-and-numbers','A few numbers.','');
 heading('now','On my mind.','');
 heading('darkroom','The darkroom.','Edit, compare, export.');
 heading('camera-bag','The kit.','');
 heading('camera-simulator','Camera lab.','Change a setting. See the effect.');
 heading('archive','Photo studies.','Reference images to explore and edit.');
 heading('plan-a-shoot','Plan a shoot.','Pick a subject. Build a shot list.');
 heading('focal-journey','Change perspective.','');
 heading('moon-lab','Stack the moon.','Compare one frame with a stack.');
 heading('focus-challenge','Catch the moment.','Track the target. Capture five shots.');
 heading('director','The cutting room.','Reorder the shots. Play the sequence.');
 heading('terminal','Say hello.','Try a command.');
 heading('projects','Selected projects.','');
 heading('project-stories','Project notes.','');
 heading('project-labs','Try the ideas.','Interactive studies for Nodexity and GalleryX.');
 heading('code-playground','Play with code.','Fix a bug, run an example, or take a detour.');
 heading('ny-explorer','Explore New York.','Save a place for another day.');
 heading('choose-adventure','Head outside.','Choose your kind of day.');
 heading('field-guide','Water & woods.','');
 heading('explore-map','Around here.','');
 heading('boat-lab','The MirroCraft.','Explore the setup and planned upgrades.');
 heading('pack','What comes along.','Choose a trip. Pack your kit.');
 heading('camp-builder','Make camp.','Drag the gear, or select it and use arrow keys.');
 heading('tackle-box','One more cast.','Pick a presentation.');
 heading('boat-journal','On the boat.','');
 heading('campfire','Stay a while.','');
 heading('workshop-bench','Still in progress.','');
 // Two concise notes replace ten repeated timeline entries. Keep the chapter anchor.
 const stories=$('#story-layout');if(stories){stories.className='clean-project-notes';stories.innerHTML='<article><span class="eyebrow">NODEXITY</span><h3>The main project.</h3><p>An independent brand. More to come.</p></article><article><span class="eyebrow">GALLERYX</span><h3>Find the keepers.</h3><p>A desktop photo and video organizer, in development.</p></article>';}
 text('#now-label','Drafts save on this device.');
 text('#edit-now','Edit a local note');
 text('#archive > .fine-print','Reference imagery, not my original photos. Imports stay on this device · 12 photos max · 20 MB each.');
 text('#explore-map > .fine-print','Schematic locations—not a navigation map.');
 text('#ny-explorer > .fine-print:last-of-type','Personal place index; access and conditions aren’t live. Saves stay on this device.');
 text('#interactive-desk > .fine-print','Concept artwork.');
 text('#camp-builder .fine-print','Layout sketch, not a safety plan. Saved on this device.');
 text('#moon-lab .fine-print','Synthetic demonstration; real results depend on alignment and conditions.');
 text('#plan-a-shoot .fine-print','Adjust exposure for the light and subject.');
 text('#camera-simulator .fine-print','Simplified exposure demonstration.');
 text('.lens-explorer .fine-print','Digital crop study, not an optical lens comparison.');
 text('.pack-summary .fine-print','Personal kit, not a complete safety checklist. Saved on this device.');
 text('.boat-caption','CURRENT SETUP / PLANNED UPGRADES · NOT TO SCALE');
 text('#boat-journal .launch-study .fine-print','Abstract model, not a real launch-depth assessment.');
 text('.nodexity-room .fine-print','Visual experiment—not a product demo.');
 text('.gallery-room > .fine-print','Sample records. No files are scanned or changed.');
 text('#language-output + .fine-print','Example only; custom code isn’t executed.');
 // Less chrome around the same interactions.
 $$('.scene-bottom>span:first-child').forEach(el=>el.remove());
 $$('.scene-content>p').forEach(el=>el.remove());
 $$('.section-heading .eyebrow').forEach(el=>{el.textContent=el.textContent.replace(/^\d+\s*\/\s*/,'');});
 const aboutLinks=$('.about-tags');if(aboutLinks){const link=document.createElement('a');link.href='/tools/';link.className='text-button';link.textContent='My toolbox';aboutLinks.append(link);}
 document.body.classList.add('clean-edition');
 window.Tom?.reveal();
})();
