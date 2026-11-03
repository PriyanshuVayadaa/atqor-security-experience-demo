'use strict';

const DefenderAttackReelUI=(()=>{
  const model=DefenderAttackReel,player=model.createPlayer();
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>`<i class="fa-solid ${name}" aria-hidden="true"></i>`;
  let root=null,timer=null,playing=false,pace=6200,drawer=false,inspected=null;
  const nodes=[['Sarah Chen','Employee','fa-user'],['Invoice link','Browser signal','fa-globe'],['FIN-LT-042','Endpoint','fa-laptop'],['Defender XDR','Incident','fa-shield-halved'],['SOC analyst','Response','fa-user-shield']];
  function pause(){clearTimeout(timer);timer=null;playing=false;}
  function schedule(){
    clearTimeout(timer);
    const scene=model.getScene(player.snapshot());
    if(!playing||!root?.isConnected||document.hidden||scene.choices||scene.terminal||drawer){playing=false;return;}
    timer=setTimeout(()=>{if(!root?.isConnected||document.hidden){pause();return;}player.next();render();schedule();},pace);
  }
  function mapTone(index,scene){
    if(scene.id==='environment')return 'calm';
    if(scene.id==='message'||scene.id==='warning')return index===1?'warning':'calm';
    if(scene.id==='prevented')return index===1?'success':'calm';
    if(index===0)return 'calm';
    if(index===1)return scene.tone==='danger'||scene.id==='incident'||scene.id==='decision'?'danger':scene.tone;
    if(index===2)return ['endpoint','incident','decision','isolation','verified','investigation'].includes(scene.id)?scene.tone:'calm';
    if(index===3)return ['incident','decision','isolation','verified','investigation'].includes(scene.id)?scene.tone:'calm';
    if(index===4)return ['decision','isolation','verified','investigation'].includes(scene.id)?scene.tone:'calm';
    return 'calm';
  }
  function node(index,scene){
    const [title,type,glyph]=nodes[index],status=scene.nodes[index];
    return `<button class="dar-node dar-node-${index} ${mapTone(index,scene)}" data-dar-inspect="${index}" aria-label="Inspect ${esc(title)}, ${esc(status)}"><span class="dar-node-icon">${icon(glyph)}</span><span class="dar-node-type">${type}</span><strong>${esc(title)}</strong><small>${esc(status)}</small></button>`;
  }
  function details(scene){
    const selected=inspected===null?null:nodes[inspected];
    return `<div class="dar-overlay"><button class="dar-shade" data-dar-action="close-details" aria-label="Close details"></button><aside class="dar-drawer" role="region" aria-label="${selected?esc(selected[0]):'Scene evidence'}"><header><div><span>SCENE EVIDENCE · FICTIONAL</span><h3>${selected?esc(selected[0]):esc(scene.phase)}</h3></div><button class="dar-icon" data-dar-action="close-details" aria-label="Close evidence">${icon('fa-xmark')}</button></header><div class="dar-drawer-body"><div class="dar-detail-state ${scene.tone}">${icon(scene.tone==='danger'?'fa-triangle-exclamation':scene.tone==='success'?'fa-circle-check':'fa-circle-info')} ${esc(scene.nodes[inspected??2])}</div><p>${esc(scene.text)}</p><h4>What this demonstrates</h4><p>${esc(scene.why)}</p><h4>Sample evidence</h4><dl>${scene.facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><h4>Story timeline</h4><ol class="dar-timeline">${model.timeline(player.snapshot()).map(event=>`<li><time>${esc(event.time)}</time><strong>${esc(event.event)}</strong><span>${esc(event.system)}</span></li>`).join('')}</ol><h4>Capabilities in this episode</h4><div class="dar-capabilities"><span>${icon('fa-globe')} Browser reputation · modeled</span><span>${icon('fa-shield-halved')} Defender for Endpoint · simulated</span><span>${icon('fa-diagram-project')} Defender XDR incident correlation · simulated</span><span>${icon('fa-user-check')} Analyst review and response decision</span></div><p class="dar-boundary">Fictional local story. No URL, file, malware, command, tenant API, device connection, or response action is real. Browser protection and endpoint detection depend on supported products, licensing, and configuration. An isolation recommendation is not malware removal or verified recovery.</p><button class="dar-secondary" data-portal-target="section:defender-incidents">Open sample Defender incidents ${icon('fa-arrow-up-right-from-square')}</button></div></aside></div>`;
  }
  function render(focus=''){
    if(!root?.isConnected)return;
    const state=player.snapshot(),scene=model.getScene(state),path=player.scenes();
    const isChoice=Boolean(scene.choices),last=Boolean(scene.terminal);
    root.className='dar-shell';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Defender suspicious download attack reel');
    const activeLink=scene.id==='message'||scene.id==='warning'||scene.id==='prevented'?1:scene.id==='environment'?0:scene.id==='endpoint'?2:scene.id==='incident'||scene.id==='decision'?3:scene.id==='isolation'||scene.id==='verified'||scene.id==='investigation'?4:0;
    root.innerHTML=`<header class="dar-header"><div class="dar-brand"><span class="dar-brand-icon">${icon('fa-shield-halved')}</span><div><strong>Defender · Attack stories</strong><small>EPISODE 01 · SUSPICIOUS DOWNLOAD</small></div></div><div class="dar-header-right"><span class="dar-local">${icon('fa-flask')} LOCAL SIMULATION</span><button class="dar-icon" data-dar-action="details" aria-label="Scene evidence" aria-expanded="${drawer}">${icon('fa-circle-info')}</button><button class="dar-icon" data-dar-action="exit" data-portal-target="tab:overview" aria-label="Exit Defender reel">${icon('fa-xmark')}</button></div></header>
      <section class="dar-stage dar-${scene.tone}" aria-label="Attack story scene"><div class="dar-stage-copy"><div class="dar-kicker"><span>${esc(scene.system)}</span><b>${String(scene.index+1).padStart(2,'0')} / ${String(path.length).padStart(2,'0')}</b></div><h1 id="dar-title" tabindex="-1">${esc(scene.title)}</h1><p>${esc(scene.caption)}</p></div>
        <div class="dar-world" aria-label="Employee, browser, endpoint, Defender XDR, and analyst timeline"><div class="dar-orbit dar-orbit-one"></div><div class="dar-orbit dar-orbit-two"></div><div class="dar-grid"></div><svg class="dar-routes" viewBox="0 0 1000 390" preserveAspectRatio="none" aria-hidden="true"><path class="dar-route" d="M105 196 C200 196 218 196 300 196 S420 196 500 196 S630 196 700 196 S840 196 910 196"/><path class="dar-signal ${scene.tone}" d="M105 196 C200 196 218 196 300 196 S420 196 500 196 S630 196 700 196 S840 196 910 196" style="--dar-duration:${pace}ms;--dar-position:${Math.min(activeLink,4)*25}%"/>${scene.id==='prevented'?'<g class="dar-stop" transform="translate(300 196)"><circle r="15"/><path d="M-5 -5L5 5M5 -5L-5 5"/></g>':''}</svg><div class="dar-nodes">${nodes.map((_,index)=>node(index,scene)).join('')}</div><span class="dar-stage-label">${icon('fa-eye')} THIRD-PERSON OBSERVER VIEW</span><span class="dar-story-clock">${model.timeline(state).at(-1).time}<small> STORY TIME</small></span></div>
  <div class="dar-stage-footer"><div class="dar-state"><span class="dar-state-dot ${scene.tone}"></span><strong>${esc(scene.phase)}</strong><span>${esc(last?'End of this path · replay to compare':isChoice?'Choose what happens next.':scene.id==='isolation'?'Response is simulated; recovery is not verified.':'Follow the signal across the environment.')}</span></div>${isChoice?`<div class="dar-choices">${scene.choices.map(choice=>`<button data-dar-choice="${choice.id}" class="${choice.recommended?'recommended':''}">${icon(choice.icon)}<span>${esc(choice.label)}</span>${icon('fa-arrow-right')}</button>`).join('')}</div>`:''}</div></section>
  <footer class="dar-player"><div class="dar-progress" aria-label="Episode progress">${path.map((item,index)=>`<span class="${index<state.step?'done':index===state.step?'current':''}" ${index===state.step?'aria-current="step"':''} title="${esc(item.title)}"><i></i><b>${index+1}</b></span>`).join('')}</div><div class="dar-controls"><div class="dar-transport"><button class="dar-icon" data-dar-action="back" ${state.step===0?'disabled':''} aria-label="Previous scene">${icon('fa-backward-step')}</button><button class="dar-play" data-dar-action="play" ${isChoice?'disabled':''}>${icon(playing?'fa-pause':last?'fa-rotate-right':'fa-play')}<span>${playing?'Pause':last?'Replay path':'Play story'}</span></button><button class="dar-icon" data-dar-action="replay" aria-label="Restart story" title="Restart story">${icon('fa-arrow-rotate-left')}</button><label class="dar-pace">Pace <select id="dar-pace" aria-label="Story scene duration">${[[4500,'Quick'],[6200,'Standard'],[8500,'Relaxed']].map(([value,label])=>`<option value="${value}" ${value===pace?'selected':''}>${label}</option>`).join('')}</select></label></div><span class="dar-hint">${isChoice?'Audience decision · playback pauses here':last?'Replay and choose the other path':playing?'Story playing':'Use Next scene to follow the evidence'}</span><button class="dar-next" data-dar-action="${last?'replay':'next'}" ${isChoice?'disabled':''}>${esc(scene.nextLabel||'Next scene')} ${icon(last?'fa-rotate-right':'fa-arrow-right')}</button></div><p class="dar-disclaimer">Fictional sample · No real download, execution, tenant connection, device isolation, or malware removal</p></footer>
      ${drawer?details(scene):''}<div class="dar-sr-only" role="status" aria-live="polite">Scene ${scene.index+1}: ${esc(scene.title)}. ${esc(scene.caption)} ${isChoice?'Choose what happens next.':''}</div>`;
  if(focus)root.querySelector(focus)?.focus({preventScroll:true});
  }
  function closeDetails(){drawer=false;inspected=null;render('[data-dar-action="details"]');}
  function click(event){
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.darChoice){pause();player.choose(button.dataset.darChoice);drawer=false;inspected=null;render('#dar-title');return;}
    if(button.dataset.darInspect!==undefined){pause();drawer=true;inspected=Number(button.dataset.darInspect);render('.dar-drawer [data-dar-action="close-details"]');return;}
    const action=button.dataset.darAction;
    if(action==='play'){if(playing)pause();else{const state=player.snapshot(),scene=model.getScene(state);if(scene.terminal)player.replay();playing=true;}render('[data-dar-action="play"]');schedule();}
    if(action==='next'){pause();try{player.next();render('#dar-title');}catch{render();}}
    if(action==='back'){pause();player.back();render('#dar-title');}
    if(action==='replay'){pause();player.replay();drawer=false;inspected=null;render('#dar-title');}
    if(action==='details'){pause();drawer=true;inspected=null;render('.dar-drawer [data-dar-action="close-details"]');}
    if(action==='close-details')closeDetails();
  }
  function unmount(){pause();drawer=false;inspected=null;root=null;document.body.classList.remove('dar-presentation-open','defender-reel-active');}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&root?.isConnected){pause();render();}});
  document.addEventListener('keydown',event=>{
    if(!root?.isConnected)return;
    if(event.key==='Escape'){event.preventDefault();pause();if(drawer)closeDetails();else root.querySelector('[data-dar-action="exit"]').click();return;}
    if(event.key==='Tab'){const scope=drawer?root.querySelector('.dar-drawer'):root;const elements=[...scope.querySelectorAll('button:not(:disabled),select,a[href]')].filter(el=>el.getClientRects().length);const first=elements[0],last=elements.at(-1);if(event.shiftKey&&(!scope.contains(document.activeElement)||document.activeElement===first)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(!scope.contains(document.activeElement)||document.activeElement===last)){event.preventDefault();first?.focus();}}
  });
  return {mount(element){unmount();root=element;document.body.classList.add('dar-presentation-open','defender-reel-active');render('[data-dar-action="play"]');root.addEventListener('click',click);root.addEventListener('change',event=>{if(event.target.id==='dar-pace'){pace=Number(event.target.value);render('#dar-pace');schedule();}});},unmount};
})();
