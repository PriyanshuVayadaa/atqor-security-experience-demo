'use strict';

const EntraReelUI=(()=>{
  const model=EntraReel,player=model.createPlayer();
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>`<i class="fa-solid ${name}" aria-hidden="true"></i>`;
  let root=null,timer=null,playing=false,pace=6000,details=null;
  const related={'risky-user':'risky-users','privileged-access':'pim','device-access':'devices','guest-review':'access-reviews'};
  function pause(){clearTimeout(timer);timer=null;playing=false;}
  function schedule(){
    clearTimeout(timer);
    if(!playing||!root?.isConnected||document.hidden||player.snapshot().step>=4||details!==null){playing=false;return;}
    timer=setTimeout(()=>{if(!root?.isConnected||document.hidden){pause();return;}player.next();if(player.snapshot().step===4)pause();render();schedule();},pace);
  }
  function tone(state,index,frame){
    if(state.step===0)return 'calm';
    if(state.step<=2)return index===1||(state.step===2&&index===0)?frame.tone:'calm';
    if(index===3)return frame.access==='blocked'?'danger':frame.access==='allowed'?'success':'calm';
    return index===2?frame.tone:index===0&&state.episode==='risky-user'?(state.step===6&&state.choice==='contain'?'success':'danger'):'calm';
  }
  function object(index,state,episode,frame){
    const titles=[episode.person,frame.source,'Microsoft Entra',episode.resource];
    const glyphs=['fa-user',frame.sourceIcon,'fa-fingerprint',frame.targetIcon];
    return `<button class="eo-object eo-object-${index} ${tone(state,index,frame)} ${state.step===2&&index===1?'eo-detected':''}" data-eo-inspect="${index}" aria-label="Inspect ${esc(titles[index])}: ${esc(frame.nodes[index])}"><span class="eo-platform"></span><span class="eo-object-visual">${index===0?`<span class="eo-person-head"></span><span class="eo-person-body"></span><span class="eo-person-initials">${episode.initials}</span>`:icon(glyphs[index])}</span><span class="eo-object-label">${esc(titles[index])}</span><strong>${esc(frame.nodes[index])}</strong></button>`;
  }
  function detailPane(state,episode,frame){
    const scene=model.getScene(state),node=typeof details==='number'?details:null;
    const title=node===null?'Behind this scene':[episode.person,frame.source,'Microsoft Entra',episode.resource][node];
    return `<div class="eo-drawer-shade"><button class="eo-drawer-dismiss" data-eo-action="details-close" aria-label="Close scene details"></button><aside class="eo-drawer" role="region" aria-label="Scene details"><header><div><span>OPTIONAL DETAILS</span><h3>${esc(title)}</h3></div><button class="eo-icon" data-eo-action="details-close" aria-label="Close details">${icon('fa-xmark')}</button></header><div class="eo-drawer-content">${node!==null?`<div class="eo-detail-state">Current state: <strong>${esc(frame.nodes[node])}</strong></div>`:''}<p>${esc(scene.text)}</p><h4>What this demonstrates</h4><p>${esc(scene.why)}</p><dl>${scene.facts.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><h4>Scenario evidence</h4><ol>${model.timeline(state).slice().reverse().map(event=>`<li><time>${event.time}</time><strong>${esc(event.text)}</strong><span>${esc(event.system)}</span></li>`).join('')}</ol><h4>Capabilities</h4><p>${episode.capabilities.map(esc).join(' · ')}</p><p class="eo-boundaries">Scripted, compressed story. No tenant API or real detection, authentication, session revocation, role activation, compliance fix, or access-review change occurs. Global filters and policy-workspace edits do not affect the reel. Licensing and integrations must be validated independently.</p><button class="eo-secondary" data-portal-target="section:${related[state.episode]}">Explore related module ${icon('fa-arrow-up-right-from-square')}</button></div></aside></div>`;
  }
  function render(focus=''){
    if(!root?.isConnected)return;
    const state=player.snapshot(),episode=model.getEpisode(state.episode),frame=EntraReelObserver.frame(state);
    const decision=state.step===4,finished=state.step===6;
    root.className='eo-shell';
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Entra interactive observer reel');
    root.innerHTML=`
      <header class="eo-header"><div class="eo-brand">${icon('fa-fingerprint')}<div><strong>Entra in action</strong><span>OBSERVER VIEW</span></div></div><div class="eo-header-actions"><span class="eo-simulation">${icon('fa-flask')} SIMULATION</span><button class="eo-secondary" data-eo-action="details" aria-label="Scene details" aria-expanded="${details!==null}">${icon('fa-circle-info')} <span>Scene details</span></button><button class="eo-icon" data-eo-action="exit" data-portal-target="tab:overview" aria-label="Exit reel" title="Exit reel (Escape)">${icon('fa-xmark')}</button></div></header>
      <nav class="eo-episodes" aria-label="Choose an Entra story">${model.episodes.map((e,index)=>`<button data-eo-episode="${e.id}" aria-pressed="${state.episode===e.id}" class="${state.episode===e.id?'selected':''}">${icon(e.icon)}<span>${EntraReelObserver.frame({episode:e.id,step:0,choice:null}).label}</span><small>0${index+1}</small></button>`).join('')}</nav>
      <section class="eo-stage ${frame.tone}" aria-label="Environment observer stage">
        <div class="eo-scene-heading" id="eo-scene-heading" tabindex="-1"><span class="eo-scene-kicker">${esc(frame.system)} <b>SCENE ${state.step+1}/7</b></span><h2>${esc(frame.title)}</h2><p>${esc(frame.caption)}</p></div>
        <div class="eo-world ${frame.access} step-${state.step}" aria-label="Visual environment: identity, signal, Entra, and application">
          <div class="eo-world-grid"></div><div class="eo-office-boundary"><span>CONTOSO ENVIRONMENT</span></div><div class="eo-cloud-boundary"><span>IDENTITY CONTROL PLANE</span></div>
          <svg class="eo-routes" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path class="eo-route" d="M205 140 C330 140 350 245 520 245"/><path class="eo-route" d="M205 360 C330 360 350 245 520 245"/><path class="eo-route eo-resource-route" d="M520 245 H820"/>${state.step>0?`<path class="eo-moving-signal ${frame.tone}" d="M205 140 C330 140 350 245 520 245"/>`:''}${state.step>2?`<path class="eo-moving-result" d="M520 245 H${frame.access==='blocked'?'664':'820'}"/>`:''}${frame.access==='blocked'?'<g class="eo-gate" transform="translate(682 245)"><circle r="18"/><path d="M-6 -6 L6 6 M6 -6 L-6 6"/></g>':''}</svg>
          ${[0,1,2,3].map(index=>object(index,state,episode,frame)).join('')}
          <span class="eo-camera-label">${icon('fa-eye')} THIRD-PERSON VIEW</span><span class="eo-story-clock">${model.clock(state,state.step)} <small>STORY TIME</small></span>
        </div>
        <div class="eo-action-zone">${decision?`<span class="eo-your-call">${icon('fa-hand-pointer')} Your call</span><div class="eo-choices">${frame.choices.map(choice=>`<button data-eo-choice="${choice.id}" class="${choice.recommended?'primary':''}">${icon(choice.recommended?'fa-shield-halved':'fa-code-compare')}<span>${esc(choice.label)}</span>${icon('fa-arrow-right')}</button>`).join('')}</div>`:`<div class="eo-scene-state"><span class="eo-state-dot ${frame.tone}"></span><strong>${esc(finished?'Outcome':state.step===5?'Verification checkpoint':state.step===0?'Environment ready':episode.steps[state.step].phase)}</strong><span>${esc(state.step===5?'Advance manually to verify or show the next state.':finished?'Compare the other response.':state.step===3?'Control applied to this modeled request.':'Watch the signal move through the environment.')}</span></div>`}</div>
      </section>
      <footer class="eo-player"><div class="eo-progress" aria-label="Story progress">${episode.steps.map((step,index)=>`<span class="${index<state.step?'done':index===state.step?'current':''}" ${index===state.step?'aria-current="step"':''} style="--eo-pace:${pace}ms"><i class="${playing&&index===state.step?'playing':''}"></i><b>${index+1}</b></span>`).join('')}</div><div class="eo-controls"><div class="eo-transport"><button class="eo-icon" data-eo-action="back" ${state.step===0?'disabled':''} aria-label="Previous scene">${icon('fa-backward-step')}</button><button class="eo-play" data-eo-action="play" ${decision||state.step===5?'disabled':''}>${icon(playing?'fa-pause':'fa-play')}<span>${playing?'Pause':finished?'Replay':'Play'}</span></button><button class="eo-icon" data-eo-action="replay" title="Restart story" aria-label="Restart story">${icon('fa-arrow-rotate-left')}</button><label class="eo-pace"><span>Pace</span><select id="eo-pace" aria-label="Automatic scene duration">${[[4000,'4 sec'],[6000,'6 sec'],[9000,'9 sec']].map(([value,label])=>`<option value="${value}" ${value===pace?'selected':''}>${label}</option>`).join('')}</select></label></div><span class="eo-control-hint">${decision?'Choose a response to continue':state.step===5?'Waiting for your confirmation':playing?'Playing · pauses for decisions':'Use Play or Next scene'}</span><button class="eo-next" data-eo-action="${finished?'compare':'next'}" ${decision?'disabled':''}>${esc(frame.nextLabel)} ${icon('fa-arrow-right')}</button></div></footer>
      ${details!==null?detailPane(state,episode,frame):''}<div class="eo-sr-only" role="status" aria-live="polite">Scene ${state.step+1}: ${esc(frame.title)}. ${esc(frame.caption)} ${decision?'Choose a response to continue.':''}</div>`;
    if(focus)root.querySelector(focus)?.focus({preventScroll:true});
  }
  function closeDetails(){details=null;render('[data-eo-action="details"]');}
  function onClick(event){
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.eoEpisode){pause();details=null;player.select(button.dataset.eoEpisode);render(`[data-eo-episode="${button.dataset.eoEpisode}"]`);return;}
    if(button.dataset.eoChoice){pause();player.choose(button.dataset.eoChoice);render('#eo-scene-heading');return;}
    if(button.dataset.eoInspect!==undefined){pause();details=Number(button.dataset.eoInspect);render('.eo-drawer [data-eo-action="details-close"]');return;}
    const action=button.dataset.eoAction;
    if(action==='play'){if(playing)pause();else{if(player.snapshot().step===6)player.replay();playing=true;}render('[data-eo-action="play"]');schedule();}
    if(action==='next'){pause();player.next();render('#eo-scene-heading');}
    if(action==='back'){pause();player.back();render('#eo-scene-heading');}
    if(action==='replay'){pause();player.replay();render('[data-eo-action="replay"]');}
    if(action==='compare'){pause();player.back();player.back();render('#eo-scene-heading');}
    if(action==='details'){pause();details=details===null?'scene':null;render(details===null?'[data-eo-action="details"]':'.eo-drawer [data-eo-action="details-close"]');}
    if(action==='details-close')closeDetails();
  }
  function unmount(){pause();details=null;document.body.classList.remove('er-presentation-open');root=null;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();render();}});
  document.addEventListener('keydown',event=>{
    if(!root?.isConnected)return;
    if(event.key==='Escape'){event.preventDefault();pause();if(details!==null)closeDetails();else root.querySelector('[data-eo-action="exit"]').click();return;}
    if(event.key==='Tab'){
      const scope=details===null?root:root.querySelector('.eo-drawer');
      const elements=[...scope.querySelectorAll('button:not(:disabled), select, a[href]')].filter(el=>el.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(event.shiftKey&&(!scope.contains(document.activeElement)||document.activeElement===first)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(!scope.contains(document.activeElement)||document.activeElement===last)){event.preventDefault();first?.focus();}
    }
  });
  return {mount(element){unmount();root=element;document.body.classList.add('er-presentation-open');render('[data-eo-action="play"]');root.addEventListener('click',onClick);root.addEventListener('change',event=>{if(event.target.id==='eo-pace'){pace=Number(event.target.value);render('#eo-pace');schedule();}});},unmount};
})();