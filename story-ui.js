'use strict';

// Shared cinematic story player for the Entra, Intune and Purview episodes.
const StoryUI=(()=>{
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=(name,family='fa-solid')=>`<i class="${family} ${name}" aria-hidden="true"></i>`;
  let root=null,episodeId=null,episode=null,config=null,player=null,timer=null,cardTimer=null,cardShown='';
  let playing=false,pace=7000,drawer=false,inspected=null,previousCursor=[50,72],lastPlace=null;
  const clock=value=>{const [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;};

  function pause(){clearTimeout(timer);timer=null;playing=false;}
  function isCard(){const scene=player.scene(),visual=config.visuals[scene.id];return Boolean(visual.card)&&cardShown!==`${scene.index}:${scene.id}`&&!drawer;}
  function schedule(){
    clearTimeout(timer);
    if(playing&&isCard())return;
    const scene=player.scene();
    if(!playing||!root?.isConnected||document.hidden||scene.gate||scene.terminal||drawer){playing=false;return;}
    timer=setTimeout(()=>{if(!root?.isConnected||document.hidden){pause();return;}player.next();render();schedule();},pace);
  }
  function details(scene){
    const selected=inspected===null?null:episode.rail[inspected];
    const related=episode.related;
    return `<div class="dar-overlay"><button class="dar-shade" data-dar-action="close-details" aria-label="Close details"></button><aside class="dar-drawer" role="region" aria-label="${selected?esc(selected[0]):'Scene evidence'}"><header><div><span>SCENE EVIDENCE · FICTIONAL</span><h3>${selected?esc(selected[0]):esc(scene.phase)}</h3></div><button class="dar-icon" data-dar-action="close-details" aria-label="Close evidence">${icon('fa-xmark')}</button></header><div class="dar-drawer-body"><div class="dar-detail-state ${scene.tone}">${icon(scene.tone==='danger'?'fa-triangle-exclamation':scene.tone==='success'?'fa-circle-check':'fa-circle-info')} ${esc(scene.nodes[inspected??2])}</div><p>${esc(scene.why)}</p><h4>Sample evidence</h4><dl>${scene.facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><h4>Story timeline</h4><ol class="dar-timeline">${StoryEpisodes.timeline(episodeId,scene.index).map(event=>`<li><time>${esc(event.time)}</time><strong>${esc(event.event)}</strong><span>${esc(event.system)}</span></li>`).join('')}</ol><h4>Capabilities in this episode</h4><div class="dar-capabilities">${episode.capabilities.map(item=>`<span>${icon('fa-circle-check')} ${esc(item)}</span>`).join('')}</div><p class="dar-boundary">${esc(episode.boundary)}</p><button class="dar-secondary" data-portal-target="${related.target}">${esc(related.label)} ${icon('fa-arrow-up-right-from-square')}</button></div></aside></div>`;
  }
  function render(focus=''){
    if(!root?.isConnected)return;
    clearTimeout(cardTimer);cardTimer=null;
    const scene=player.scene(),visual=config.visuals[scene.id],path=player.scenes();
    const isChoice=Boolean(scene.gate),last=Boolean(scene.terminal),live=playing&&!isChoice&&!last;
    const timeline=StoryEpisodes.timeline(episodeId,scene.index),time=clock(timeline.at(-1).time.slice(0,5));
    const card=isCard();
    if(card)cardTimer=setTimeout(()=>{cardShown=`${scene.index}:${scene.id}`;render();schedule();},2300);
    const cursor=visual.cursor,from=previousCursor,[chapterNumber,chapterName]=visual.chapter.split(' · ');
    const place=config.places[visual.place];
    const cut=!card&&lastPlace&&lastPlace!==visual.place;if(!card)lastPlace=visual.place;
    const ending=config.endings[scene.id];
    const screen=card?`<div class="dar-card"><small>${esc(visual.card[0])}</small><b>${esc(visual.card[1])}</b><span>${esc(visual.card[2])}</span></div>`:`<div class="dar-cam" style="--ox:${visual.cam[0]}%;--oy:${visual.cam[1]}%;--zoom:${visual.cam[2]};--dur:${pace+2200}ms">${config.screens[scene.id]({time})}${cursor&&!isChoice?`<div class="dar-cursor" style="--fx:${from[0]}%;--fy:${from[1]}%;left:${cursor[0]}%;top:${cursor[1]}%"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8-6.5 1.5L9 19z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><i class="rip"></i></div>`:''}</div><div class="dar-vignette"></div>${cut?'<div class="dar-wipe"></div>':''}${ending&&!drawer?`<div class="dar-end ${ending.tone}"><small>${ending.kicker}</small><h2>${ending.title}</h2><ul>${ending.points.map((point,i)=>`<li style="--i:${i}">${icon('fa-circle-check')} ${point}</li>`).join('')}</ul><button data-dar-action="replay">${icon('fa-rotate-right')} Replay the story</button></div>`:''}`;
    root.className='dar-shell';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',`${episode.product} story`);
    root.innerHTML=`<header class="dar-header"><div class="dar-brand"><span class="dar-brand-icon">${icon(episode.icon)}</span><div><strong>${esc(episode.product)} · Stories</strong><small>${esc(episode.kicker)}</small></div></div><div class="dar-header-right"><span class="dar-local">${icon('fa-flask')} LOCAL SIMULATION</span><button class="dar-icon" data-dar-action="details" aria-label="Scene evidence" aria-expanded="${drawer}" title="Scene evidence">${icon('fa-circle-info')}</button><button class="dar-icon" data-dar-action="exit" data-portal-target="${episode.exit||'tab:overview'}" aria-label="Exit story" title="Exit (Escape)">${icon('fa-xmark')}</button></div></header>
      <nav class="dar-rail" aria-label="Where the story is happening">${episode.rail.map(([name,type,glyph],index)=>`<button class="dar-pill ${scene.pills[index]}" data-dar-inspect="${index}" aria-label="Inspect ${esc(name)}: ${esc(scene.nodes[index])}"><span class="ic">${icon(glyph)}</span><span class="tx"><small>${type}</small><b>${esc(name)}</b></span><em>${esc(scene.nodes[index])}</em></button>`).join('')}</nav>
      <section class="dar-monitor dar-${scene.tone}" aria-label="Story scene"><div class="dar-device ${place.cls==='soc'?'soc':'laptop'}"><span class="dar-place ${place.cls}">${icon(place.glyph)} ${place.label}</span><div class="dar-screen ${drawer?'dar-still':''}">${screen}</div></div></section>
      <section class="dar-narration"><div class="dar-chapter"><small>${esc(chapterNumber.toUpperCase())}</small><b>${esc(chapterName)}</b><time>${time}</time></div><div class="dar-lines"><h1 id="dar-title" tabindex="-1">${esc(scene.title)}</h1><p>${esc(scene.caption)}</p></div><div class="dar-nhint">${isChoice?`<span class="decision">${icon('fa-hand-pointer')} Choose on screen</span>`:last?`<span>${icon('fa-flag-checkered')} End of the story</span>`:`<span>${icon('fa-circle-info')} ${esc(scene.system)}</span>`}</div></section>
      <footer class="dar-player"><div class="dar-progress" aria-label="Story progress">${path.map((item,index)=>`<span class="${index<scene.index?'done':index===scene.index?'current':''}" ${index===scene.index?'aria-current="step"':''} title="${esc(item.title)}"></span>`).join('')}</div><div class="dar-controls"><div class="dar-transport"><button class="dar-icon" data-dar-action="back" ${scene.index===0?'disabled':''} aria-label="Previous scene">${icon('fa-backward-step')}</button><button class="dar-play" data-dar-action="play" ${isChoice?'disabled':''}>${icon(live?'fa-pause':last?'fa-rotate-right':'fa-play')}<span>${live?'Pause':last?'Replay':'Play story'}</span></button><button class="dar-icon" data-dar-action="replay" aria-label="Restart story" title="Restart story">${icon('fa-arrow-rotate-left')}</button><label class="dar-pace">Pace <select id="dar-pace" aria-label="Story scene duration">${[[5000,'Quick'],[7000,'Standard'],[9500,'Relaxed']].map(([value,label])=>`<option value="${value}" ${value===pace?'selected':''}>${label}</option>`).join('')}</select></label></div><span class="dar-disclaimer">Fictional sample · no real sign-in, device, file, policy or tenant connection</span><button class="dar-next" data-dar-action="${last?'replay':'next'}" ${isChoice?'disabled':''}>${esc(scene.nextLabel||'Next scene')} ${icon(last?'fa-rotate-right':'fa-arrow-right')}</button></div></footer>
      ${drawer?details(scene):''}<div class="dar-sr-only" role="status" aria-live="polite">${esc(visual.chapter)}. ${esc(scene.title)} ${esc(scene.caption)} ${isChoice?'Choose an option on screen.':''}</div>`;
    previousCursor=cursor||previousCursor;
    if(focus)root.querySelector(focus)?.focus({preventScroll:true});
  }
  function closeDetails(){drawer=false;inspected=null;render('[data-dar-action="details"]');}
  function click(event){
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.darChoice){pause();try{player.choose(button.dataset.darChoice);}catch{return;}drawer=false;inspected=null;playing=!document.hidden;render('#dar-title');schedule();return;}
    if(button.dataset.darInspect!==undefined){pause();drawer=true;inspected=Number(button.dataset.darInspect);render('.dar-drawer [data-dar-action="close-details"]');return;}
    const action=button.dataset.darAction;
    if(action==='play'){if(playing)pause();else{if(player.scene().terminal){player.replay();cardShown='';lastPlace=null;}playing=true;}render('[data-dar-action="play"]');schedule();}
    if(action==='next'){pause();try{player.next();render('#dar-title');}catch{render();}}
    if(action==='back'){pause();player.back();render('#dar-title');}
    if(action==='replay'){pause();player.replay();previousCursor=[50,72];cardShown='';lastPlace=null;drawer=false;inspected=null;playing=true;render('#dar-title');schedule();}
    if(action==='details'){pause();drawer=true;inspected=null;render('.dar-drawer [data-dar-action="close-details"]');}
    if(action==='close-details')closeDetails();
  }
  function unmount(){pause();clearTimeout(cardTimer);cardTimer=null;cardShown='';lastPlace=null;drawer=false;inspected=null;previousCursor=[50,72];root=null;document.body.classList.remove('dar-presentation-open','story-active');}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&root?.isConnected){pause();render();}});
  document.addEventListener('keydown',event=>{
    if(!root?.isConnected)return;
    if(event.key==='Escape'){event.preventDefault();pause();if(drawer)closeDetails();else root.querySelector('[data-dar-action="exit"]').click();return;}
    if(event.key==='Tab'){const scope=drawer?root.querySelector('.dar-drawer'):root;const elements=[...scope.querySelectorAll('button:not(:disabled),select,a[href]')].filter(el=>el.getClientRects().length);const first=elements[0],last=elements.at(-1);if(event.shiftKey&&(!scope.contains(document.activeElement)||document.activeElement===first)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(!scope.contains(document.activeElement)||document.activeElement===last)){event.preventDefault();first?.focus();}}
  });
  return {mount(element,id){unmount();root=element;episodeId=id;episode=StoryEpisodes.get(id);config={places:StoryScreens.places[id],visuals:StoryScreens.visuals[id],screens:StoryScreens.screens[id],endings:StoryScreens.endings[id]};player=StoryEpisodes.createPlayer(id);document.body.classList.add('dar-presentation-open','story-active');playing=!document.hidden;render('[data-dar-action="play"]');schedule();root.addEventListener('click',click);root.addEventListener('change',event=>{if(event.target.id==='dar-pace'){pace=Number(event.target.value);render('#dar-pace');schedule();}});},unmount};
})();
