'use strict';

const EntraCAWorkspaceUI = (() => {
  const model=EntraCAWorkspace, demo=EntraCADemo, store=model.createWorkspace();
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>`<i class="fa-solid ${name}" aria-hidden="true"></i>`;
  let root,showDialog,draft=null,query='',modeFilter='all',view='policies',notice='',pane=null;
  const options=(items,value)=>items.map(([id,text])=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(text)}</option>`).join('');
  const pill=(text,tone='')=>`<span class="caw-pill ${tone}">${esc(text)}</span>`;
  function isCurrent(run,state) {return run&&run.revision===state.revision&&JSON.stringify(run.input)===JSON.stringify(state.input);}
  function controlText(policy) {return policy.controls.map(id=>({block:'Block access',mfa:'MFA',strong:'Phishing-resistant MFA',compliant:'Compliant device'}[id])).join(' + ');}
  function policyRows(state) {
    const records=state.policies.filter(p=>(modeFilter==='all'||p.mode===modeFilter)&&`${p.name} ${model.label('scope',p.scope)} ${model.label('app',p.app)}`.toLowerCase().includes(query.toLowerCase()));
    return `<div class="table-wrap"><table class="caw-table"><thead><tr><th>Policy name</th><th>State</th><th>Users</th><th>Target resources</th><th>Access controls</th><th>Actions</th></tr></thead><tbody>${records.map(p=>`<tr><td><button class="caw-name" data-caw-edit="${p.id}">${icon('fa-shield-halved')}${esc(p.name)}</button><small>${p.id} · Local demo policy</small></td><td>${pill(model.label('mode',p.mode),p.mode==='Enabled'?'on':p.mode==='Report-only'?'report':'off')}</td><td>${esc(model.label('scope',p.scope))}${p.exclude!=='none'?`<small>Excludes ${esc(model.label('exclude',p.exclude))}</small>`:''}</td><td>${esc(model.label('app',p.app))}</td><td>${esc(controlText(p))}</td><td><div class="caw-row-actions"><button class="text-button" data-caw-edit="${p.id}">Edit</button><button class="text-button" data-caw-delete="${p.id}" aria-label="Delete ${esc(p.name)}">Delete</button></div></td></tr>`).join('')}</tbody></table></div>${records.length?'':'<div class="empty-state">No policies match. Clear the filters or create a new policy.</div>'}<div class="table-footer"><span>${records.length} of ${state.policies.length} editable demo policies</span><span>Configuration revision ${state.revision}</span></div>`;
  }
  function resultSummary(run,state) {
    if(!run) return `<div class="caw-start"><span>${icon('fa-arrow-right-to-bracket')}</span><div><h3>See your policies in action</h3><p>Create or edit a policy, then test a sign-in to see what applies.</p></div><button class="button primary" data-caw-action="test">Test sign-in</button></div>`;
    const current=isCurrent(run,state);
    return `<div class="caw-last-result ${current?run.result.tone:'stale'}"><div class="caw-result-mark">${icon(current?(run.result.tone==='blocked'?'fa-ban':run.result.tone==='challenge'?'fa-mobile-screen-button':'fa-circle-check'):'fa-rotate')}</div><div><span class="caw-overline">${current?'LATEST SIMULATED RESULT':'HISTORICAL RESULT · RETEST REQUIRED'}</span><h3>${esc(run.result.outcome)}</h3><p>${esc(demo.people.find(p=>p.id===run.input.user).name)} · ${esc(demo.label('app',run.input.app))} · Run ${run.id} / revision ${run.revision}</p></div><button class="button" data-caw-action="test">${current?'Inspect / test again':'Retest changes'}</button></div>`;
  }
  function render() {
    if(!root?.isConnected) return;
    const state=store.snapshot();
    root.innerHTML=`<div class="caw-toolbar" aria-label="Conditional Access actions"><div><button class="button primary" data-caw-action="new">${icon('fa-plus')} New policy</button><button class="button" data-caw-action="test">${icon('fa-flask')} Test sign-in</button><button class="button" data-caw-action="export">${icon('fa-download')} Export workspace</button></div><button class="text-button" data-caw-action="reset">${icon('fa-arrow-rotate-left')} Reset demo</button></div>
      <div class="caw-disclosure">${icon('fa-flask')} <strong>Local demo workspace</strong><span>Changes affect this session only. Eight editable starter policies; the other 12 tenant reference policies are not evaluated.</span><button class="text-button" data-caw-action="about">Model scope</button></div>
      ${notice?`<div class="caw-notice" role="status">${icon('fa-circle-check')}${esc(notice)}<button class="inline-icon" data-caw-action="dismiss" aria-label="Dismiss message">${icon('fa-xmark')}</button></div>`:''}
      <section class="caw-stats" aria-label="Workspace policy counts">${[['Total policies',state.policies.length,'fa-shield-halved'],['On',state.policies.filter(p=>p.mode==='Enabled').length,'fa-circle-check'],['Report-only',state.policies.filter(p=>p.mode==='Report-only').length,'fa-eye'],['Off',state.policies.filter(p=>p.mode==='Disabled').length,'fa-circle-pause']].map(([label,count,glyph])=>`<div>${icon(glyph)}<span>${label}</span><strong>${count}</strong></div>`).join('')}</section>
      <div class="caw-inline-tabs" aria-label="Workspace views">${[['policies','Policies',state.policies.length],['signins','Test sign-ins',state.runs.length],['activity','Activity',state.events.length]].map(([key,title,count])=>`<button data-caw-view="${key}" class="${view===key?'active':''}" ${view===key?'aria-current="page"':''}>${title}<span>${count}</span></button>`).join('')}</div>
      ${resultSummary(state.runs[0],state)}
      ${view==='policies'?`<section class="panel caw-list-panel"><div class="caw-list-tools"><label class="search-field">${icon('fa-magnifying-glass')}<input id="caw-search" placeholder="Search policies" aria-label="Search editable policies" value="${esc(query)}"></label><label>State <select id="caw-mode-filter"><option value="all">All states</option>${options(model.choices.mode,modeFilter)}</select></label><span>Click a policy to edit assignments and controls.</span></div><div id="caw-list">${policyRows(state)}</div></section>`:view==='signins'?history(state):activity(state)}
      <div class="caw-bottom-note">Simulated decisions, not Microsoft's What If engine. Global scope and date filters do not affect this workspace. Reload or reset clears local changes.</div>`;
  }
  function history(state) {
    return `<section class="panel"><div class="table-wrap"><table><thead><tr><th>Run / UTC</th><th>User</th><th>Resource</th><th>Policy revision</th><th>Outcome</th><th></th></tr></thead><tbody>${state.runs.map(run=>`<tr><td>#${run.id}<small>${esc(run.time)}</small></td><td>${esc(demo.people.find(p=>p.id===run.input.user).name)}</td><td>${esc(demo.label('app',run.input.app))}</td><td>${run.revision}</td><td>${pill(run.result.outcome,run.result.tone)}</td><td><button class="text-button" data-caw-run="${run.id}">Inspect</button></td></tr>`).join('')}</tbody></table></div>${state.runs.length?'':'<div class="empty-state">No tests yet. Select Test sign-in to begin.</div>'}<div class="table-footer">Last eight tests · retained with their original policy snapshots</div></section>`;
  }
  function activity(state) {
    return `<section class="panel"><div class="table-wrap"><table><thead><tr><th>Time (UTC)</th><th>Activity</th><th>Details</th></tr></thead><tbody>${state.events.map(event=>`<tr><td>${esc(event.time)}</td><td>${esc(event.action)}</td><td>${esc(event.detail)}</td></tr>`).join('')}</tbody></table></div>${state.events.length?'':'<div class="empty-state">Policy edits and sign-in tests will appear here.</div>'}<div class="table-footer">Local presenter events only · not Microsoft Entra audit logs · last 100 events</div></section>`;
  }
  function selectField(key,value) {return `<label class="caw-field" for="caw-policy-${key}">${model.labels[key]}<select id="caw-policy-${key}" data-caw-draft="${key}">${options(model.choices[key],value)}</select></label>`;}
  function editPolicy(id) {
    const policy=id?store.snapshot().policies.find(p=>p.id===id):model.blank(); if(!policy) return;
    draft=JSON.parse(JSON.stringify(policy));pane='editor';
    const editing=Boolean(draft.id);
    showDialog(editing?draft.name:'New Conditional Access policy',`<form id="caw-policy-form" class="caw-editor"><p class="caw-pane-note">${icon('fa-flask')} Demo policy · no changes to Microsoft Entra</p><div id="caw-form-error" class="caw-error" role="alert" hidden></div>
      <label class="caw-field" for="caw-policy-name">Name<input id="caw-policy-name" data-caw-draft="name" value="${esc(draft.name)}" placeholder="Example: Require MFA for Finance" required minlength="3" maxlength="100"></label>
      <section class="caw-editor-section"><h3>Assignments</h3><p>Choose who and what this policy protects.</p><div class="caw-field-grid">${selectField('scope',draft.scope)}${selectField('exclude',draft.exclude)}</div>${selectField('app',draft.app)}</section>
      <section class="caw-editor-section"><h3>Conditions</h3><div class="caw-field-grid">${['location','risk','client','pilot'].map(key=>selectField(key,draft[key])).join('')}</div></section>
      <section class="caw-editor-section"><h3>Access controls</h3><p>All selected grant controls must be satisfied. Block access is exclusive.</p><fieldset class="caw-grants"><legend class="caw-sr-only">Grant or block controls</legend>${model.controlChoices.map(([id,label])=>`<label><input type="checkbox" data-caw-control="${id}" ${draft.controls.includes(id)?'checked':''}>${esc(label)}</label>`).join('')}</fieldset></section>
      <section class="caw-editor-section"><h3>Enable policy</h3><fieldset class="caw-mode"><legend class="caw-sr-only">Policy state</legend>${model.choices.mode.map(([value,label])=>`<label><input type="radio" name="caw-policy-mode" data-caw-draft="mode" value="${value}" ${draft.mode===value?'checked':''}>${label}</label>`).join('')}</fieldset><p>Report-only evaluates impact without enforcing access. New policies start in report-only.</p></section>
      <div class="caw-pane-footer"><button class="button primary" type="submit" name="caw-save" value="test">${editing?'Save':'Create'} & test</button><button class="button" type="submit" name="caw-save" value="save">${editing?'Save changes':'Create policy'}</button><button class="button" type="button" data-caw-action="close">Cancel</button></div></form>`,editing?'CONDITIONAL ACCESS | EDIT POLICY':'CONDITIONAL ACCESS | NEW POLICY');
    document.querySelector('#caw-policy-name').focus();
  }
  function testPane() {
    pane='test'; const state=store.snapshot(),latest=state.runs[0],current=isCurrent(latest,state);
    showDialog('Test sign-in',`<div class="caw-test-pane"><p class="caw-pane-note">${icon('fa-flask')} Evaluate against ${state.policies.length} saved demo policies · revision ${state.revision}</p><label class="caw-field" for="caw-example">Quick example<select id="caw-example"><option value="">Custom sign-in</option>${demo.scenarios.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label><form id="caw-test-form"><div class="caw-field-grid">${demo.fields.map(field=>`<label class="caw-field" for="caw-input-${field.key}">${esc(field.label)}<select id="caw-input-${field.key}" data-caw-input="${field.key}">${options(field.options,state.input[field.key])}</select></label>`).join('')}</div><button type="submit" class="button primary caw-evaluate">${icon('fa-play')} Evaluate sign-in</button></form>
      <div id="caw-test-result" tabindex="-1" role="status" aria-live="polite">${current?decision(latest):`<div class="caw-awaiting">${icon('fa-arrow-pointer')} ${latest?'Inputs or policies changed. Evaluate again.':'Choose your inputs, then evaluate.'}</div>`}</div>
      ${current?evaluationTable(latest):''}${state.runs.length>1?comparison(state.runs[0],state.runs[1]):''}
      <p class="caw-bottom-note">No real authentication challenge is sent. “Granted” means modeled controls are satisfied, not that a resource permission or token was issued.</p></div>`,'CONDITIONAL ACCESS | LOCAL WHAT-IF TEST');
  }
  function decision(run) {
    return `<div class="caw-decision ${run.result.tone}">${icon(run.result.tone==='blocked'?'fa-ban':run.result.tone==='challenge'?'fa-mobile-screen-button':'fa-circle-check')}<div><span class="caw-overline">SIMULATED RESULT · RUN ${run.id}</span><h3>${esc(run.result.outcome)}</h3><p>${esc(run.result.explanation)}</p></div></div>`;
  }
  function evaluationTable(run) {
    return `<h3 class="caw-section-title">Policy evaluation</h3><div class="caw-evaluation">${run.result.policies.map(p=>`<details ${p.applies&&(p.blocks||p.unmet.length)?'open':''}><summary><span>${esc(p.name)}</span>${pill(p.status,p.blocks?'blocked':p.mode==='Report-only'?'report':p.status==='Satisfied'?'granted':'')}</summary><p>${esc(p.reason)} ${p.reportOnly?'Report-only: never enforces access.':''}</p></details>`).join('')}</div>`;
  }
  function comparison(after,before) {
    const changes=demo.fields.filter(f=>after.input[f.key]!==before.input[f.key]);
    const beforePolicies=new Map(before.policySnapshot.map(p=>[p.id,p]));
    const afterPolicies=new Map(after.policySnapshot.map(p=>[p.id,p]));
    const edits=after.policySnapshot.filter(p=>JSON.stringify(beforePolicies.get(p.id))!==JSON.stringify(p)).map(p=>`${beforePolicies.has(p.id)?'Updated':'Created'}: ${p.name}`);
    for (const p of before.policySnapshot) if(!afterPolicies.has(p.id)) edits.push('Deleted: '+p.name);
    return `<section class="caw-compare"><h3>Before / after</h3><div>${pill(before.result.outcome,before.result.tone)}${icon('fa-arrow-right')}${pill(after.result.outcome,after.result.tone)}</div><p>Run ${before.id} / revision ${before.revision} → Run ${after.id} / revision ${after.revision}</p>${changes.map(f=>`<p><strong>${esc(f.label)}:</strong> ${esc(demo.label(f.key,before.input[f.key]))} → ${esc(demo.label(f.key,after.input[f.key]))}</p>`).join('')}${edits.map(text=>`<p>${esc(text)}</p>`).join('')}${!changes.length&&!edits.length?'<p>No input or configuration differences.</p>':''}</section>`;
  }
  function inspectRun(id) {
    const run=store.snapshot().runs.find(r=>r.id===Number(id));if(!run)return;pane='history';
    showDialog('Test sign-in #'+run.id,`<p class="caw-pane-note">Historical simulation · policy revision ${run.revision} · ${esc(run.time)}</p>${decision(run)}<div class="detail-facts">${demo.fields.map(f=>`<div><span>${esc(f.label)}</span><strong>${esc(demo.label(f.key,run.input[f.key]))}</strong></div>`).join('')}</div>${evaluationTable(run)}<p class="caw-bottom-note">Retained with the original policy snapshot. Later policy edits do not change this result.</p>`,'CONDITIONAL ACCESS | TEST HISTORY');
  }
  function close() {document.querySelector('#detail-dialog').close();pane=null;}
  function confirm(type,id) {
    pane='confirm';const policy=store.snapshot().policies.find(p=>p.id===id);
    showDialog(type==='reset'?'Reset demo workspace?':'Delete demo policy?',`<p>${type==='reset'?'Restore the eight starter policies and clear all local tests, edits, and activity?':`Delete <strong>${esc(policy?.name||'')}</strong> from this sandbox? Previous test evidence will be retained.`}</p><p class="caw-pane-note">No Microsoft tenant will be changed.</p><div class="dialog-actions"><button class="button danger" data-caw-confirm="${type}" data-caw-id="${esc(id||'')}">${type==='reset'?'Reset workspace':'Delete policy'}</button><button class="button" data-caw-action="close">Cancel</button></div>`,'LOCAL DEMO ONLY');
  }
  function exportWorkspace() {
    const url=URL.createObjectURL(new Blob([JSON.stringify({disclaimer:'SIMULATED WORKSPACE - NO LIVE MICROSOFT POLICIES OR SIGN-INS',...store.snapshot()},null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='contoso-ca-policy-workspace.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function error(message) {const target=document.querySelector('#caw-form-error');if(target){target.hidden=false;target.textContent=message;target.scrollIntoView({block:'nearest'});}}
  document.addEventListener('input',event=>{
    if(event.target.id==='caw-search') {query=event.target.value;const list=root?.querySelector('#caw-list');if(list)list.innerHTML=policyRows(store.snapshot());}
    if(pane==='editor'&&event.target.dataset.cawDraft==='name') draft.name=event.target.value;
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='caw-mode-filter'){modeFilter=event.target.value;render();root.querySelector('#caw-mode-filter')?.focus();}
    if(pane==='editor'&&event.target.dataset.cawDraft)draft[event.target.dataset.cawDraft]=event.target.value;
    if(pane==='editor'&&event.target.dataset.cawControl){
      const id=event.target.dataset.cawControl;
      if(event.target.checked){draft.controls=id==='block'?['block']:[...draft.controls.filter(value=>value!=='block'&&value!==id),id];}else draft.controls=draft.controls.filter(value=>value!==id);
      document.querySelectorAll('[data-caw-control]').forEach(node=>{node.checked=draft.controls.includes(node.dataset.cawControl);});
    }
    if(pane==='test'&&event.target.dataset.cawInput){const key=event.target.dataset.cawInput;store.setInput(key,event.target.value);render();testPane();document.querySelector('#caw-input-'+key)?.focus();}
    if(pane==='test'&&event.target.id==='caw-example'&&event.target.value){store.loadScenario(event.target.value);render();testPane();document.querySelector('#caw-input-user')?.focus();}
  });
  document.addEventListener('submit',event=>{
    if(event.target.id==='caw-policy-form'){
      event.preventDefault();try{const policy=store.save(draft);notice=`${policy.name} saved locally. Test a sign-in to see the effect.`;close();render();if(event.submitter?.value==='test')testPane();}catch(e){error(e.message);}
    }
    if(event.target.id==='caw-test-form'){event.preventDefault();store.run();render();testPane();document.querySelector('#caw-test-result').focus();}
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.cawEdit)editPolicy(button.dataset.cawEdit);
    if(button.dataset.cawDelete)confirm('delete',button.dataset.cawDelete);
    if(button.dataset.cawRun)inspectRun(button.dataset.cawRun);
    if(button.dataset.cawView){view=button.dataset.cawView;render();root.querySelector(`[data-caw-view="${view}"]`)?.focus();}
    if(button.dataset.cawConfirm){if(button.dataset.cawConfirm==='reset'){store.reset();query='';modeFilter='all';view='policies';notice='Workspace reset. Starter policies restored.';}else{store.remove(button.dataset.cawId);notice='Demo policy deleted.';}close();render();root?.querySelector('[data-caw-action="new"]')?.focus();}
    const action=button.dataset.cawAction;
    if(action==='new')editPolicy();if(action==='test')testPane();if(action==='close')close();if(action==='reset')confirm('reset');if(action==='export')exportWorkspace();if(action==='dismiss'){notice='';render();}
    if(action==='about')showDialog('About this demo workspace','<p>Eight editable starter policies model a subset of the 20 reference policies. New policies, edits, exclusions, and tests are local and session-only.</p><p>This is not Microsoft’s What If engine. User and resource assignments, selected conditions, policy states, and AND grant controls are modeled. Other tenant policies, emergency access accounts, guest trust, service identities, tokens, session controls, device platforms, and real application permissions are not evaluated. Priya is assumed to be an administrator for this sandbox.</p><p>Global business-unit and date filters do not affect this workspace. A real tenant may return a different result. Conditional Access requires eligible Entra licensing; risk-based features require P2. Verify actual entitlements.</p>','CONDITIONAL ACCESS | MODEL SCOPE');
  });
  return {mount(element,callbacks){root=element;showDialog=callbacks.showDialog;render();}};
})();