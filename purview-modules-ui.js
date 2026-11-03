'use strict';

const PurviewModulesUI=(()=>{
  let data=PurviewData,product='purview';
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>`<i class="fa-solid ${name}" aria-hidden="true"></i>`;
  const preferences={};
  let root=null,key=null,scope={unit:'all',days:7},showDialog=null;
  const tones={Blocked:'blocked',High:'blocked',Failure:'blocked','Needs label':'review',New:'review','In review':'review','Pending review':'review',Escalated:'review',Open:'review','In progress':'review',Medium:'review',Simulation:'simulation','Audit-only allowed':'simulation',Active:'active',Enabled:'active',Published:'active',Success:'active',Resolved:'active',Closed:'active',Labeled:'active',Allowed:'active'};
  function badge(text){return `<span class="pv-status ${tones[text]||'neutral'}">${esc(text)}</span>`;}
  function preferenceKey(){return product+':'+key;}
  function settings(){return preferences[preferenceKey()]||(preferences[preferenceKey()]={query:'',state:'all'});}
  function rows(){return data.filter(key,{...scope,...settings()});}
  function table(){
    const mod=data.get(key),records=rows();
    return `<div class="table-wrap"><table class="pv-data-table"><thead><tr>${mod.columns.map(column=>`<th>${esc(column)}</th>`).join('')}<th>Business unit</th><th>Details</th></tr></thead><tbody>${records.map(row=>`<tr>${row.values.map((value,index)=>`<td>${index===0?`<button class="pv-record-name" data-pv-record="${row.id}" data-pv-module="${key}">${esc(value)}</button>${value!==row.id?`<small>${row.id}</small>`:''}`:tones[value]?badge(value):esc(value)}</td>`).join('')}<td><span class="pv-unit">${esc(row.unit==='all'?'Shared / tenant':row.unit)}</span></td><td><button class="text-button" data-pv-record="${row.id}" data-pv-module="${key}" aria-label="Inspect ${esc(row.values[0])}">Inspect ${icon('fa-arrow-right')}</button></td></tr>`).join('')}</tbody></table></div>${!records.length?`<div class="empty-state">${icon('fa-magnifying-glass')}<strong>No matching sample records</strong><p>Change your search, status, business unit or reporting period.</p><button class="button" data-pv-action="clear">Clear local filters</button></div>`:''}<div class="table-footer"><span>${records.length} of ${mod.rows.length} curated ${mod.activity?'activity':'snapshot'} records</span><span>${esc(scope.unit==='all'?'All business units':scope.unit)}${mod.activity?' · last '+scope.days+' day(s)':' · point-in-time assignments'}</span></div>`;
  }
  function metrics(){
    const records=rows(),mod=data.get(key),review=records.filter(r=>r.review).length;
    const workload=new Set(records.map(r=>r.unit).filter(unit=>unit!=='all')).size;
    const last=key==='dlp-alerts'?['Policy matches',records.reduce((n,r)=>n+(r.count||0),0),'Sum of displayed match groups']:['Source records',mod.rows.length,'Complete curated module fixture'];
    return [['Visible records',records.length,'Matches the current table'],['Flagged for review',review,'Workflow flags, not confirmed violations'],['Business units',workload,'Excludes shared tenant records'],last].map(([label,value,note])=>`<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join('');
  }
  function refresh(){if(!root?.isConnected)return;root.querySelector('#pv-module-table').innerHTML=table();root.querySelector('.pv-module-metrics').innerHTML=metrics();}
  function render(){
    const mod=data.get(key),filter=settings(),states=[...new Set(mod.rows.map(r=>r.state))];
    const actionBoundary=product==='defender'?'No device isolation, scan, email removal, identity action or remediation is executed. Existing cross-workload queues and hunting templates remain separate.':product==='intune'?'No enrollment, policy deployment, app installation, update, device command, group change, or support request is performed. Compliance evaluation and Conditional Access enforcement are distinct services.':'No policy, message, label, retention, investigation, or legal action is performed.';
    root.innerHTML=`<div class="pv-module-heading"><div class="pv-module-icon">${icon(mod.icon)}</div><div><h2>${esc(mod.title)}</h2><p>${esc(mod.subtitle)}</p></div><span class="pv-demo-badge">${icon('fa-database')} Fictional sample data</span></div>
      <section class="pv-module-metrics" aria-label="Filtered sample record metrics">${metrics()}</section>
      <div class="pv-module-toolbar"><label class="search-field">${icon('fa-magnifying-glass')}<input id="pv-module-search" aria-label="Search ${esc(mod.title)}" placeholder="Search names, IDs, owners or locations" value="${esc(filter.query)}"></label><label class="pv-status-filter">${mod.activity?'Review / result':'State'}<select id="pv-module-status" aria-label="Filter record state"><option value="all">All states</option>${states.map(state=>`<option value="${esc(state)}" ${filter.state===state?'selected':''}>${esc(state)}</option>`).join('')}</select></label><button class="button" data-pv-action="clear">${icon('fa-filter-circle-xmark')} Reset</button><button class="button" data-pv-action="export">${icon('fa-download')} Export visible records</button><span>Nov 2, 2026 · 09:42 UTC</span></div>
      <article class="panel" id="pv-module-table">${table()}</article><p class="inline-disclosure">Read-only fictional records. Cards are derived from the filtered curated table except “Source records,” which is the fixed full module size. Shared tenant records appear in each business-unit scope. ${mod.activity?'Reporting period filters activity ages.':'Inventory, configuration, exposure and reference assignments are point-in-time snapshots; the reporting period does not change them.'} ${actionBoundary}</p>
      <div class="pv-related-modules"><span>Related solutions</span>${mod.links.map(link=>`<button class="text-button" data-portal-target="section:${link}">${esc(data.get(link).title)} ${icon('fa-arrow-right')}</button>`).join('')}</div>`;
  }
  function inspect(moduleKey,id){
    const mod=data.modules[moduleKey],row=mod?.rows.find(r=>r.id===id);if(!row||!showDialog)return;
    const related=row.links||[];
    showDialog(row.values[0],`<div class="detail-labels">${badge(row.state)}<span class="pv-demo-badge">${row.id}</span><span class="pv-demo-badge">Read-only fixture</span></div><div class="detail-facts">${mod.columns.map((column,index)=>`<div><span>${esc(column)}</span><strong>${esc(row.values[index])}</strong></div>`).join('')}${Object.entries(row.details).map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div><div class="blade-section"><h3>Evidence timeline</h3><ul class="timeline">${row.timeline.map(event=>`<li><strong>${esc(event.time)}</strong><br>${esc(event.event)}</li>`).join('')}</ul></div>${related.length?`<div class="blade-section"><h3>Linked sample evidence</h3>${related.map(link=>{const target=data.get(link.module).rows.find(r=>r.id===link.id);return `<div class="pv-linked-record"><span>${esc(data.get(link.module).title)}</span><button class="text-button" data-pv-record="${link.id}" data-pv-module="${link.module}">${esc(target?.values[0]||link.id)} ${icon('fa-arrow-right')}</button></div>`;}).join('')}</div>`:''}<p class="inline-disclosure">Fictional snapshot, not an actual tenant record. Outcomes, service states, ownership and counts are invented. No source-service action can be executed from this detail pane.</p>`, 'MICROSOFT '+product.toUpperCase()+' | '+mod.title.toUpperCase());
  }
  function exportRows(){
    const mod=data.get(key),quote=value=>{let text=String(value);if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
    const records=[['SIMULATED DATA - NOT A MICROSOFT '+product.toUpperCase()+' EXPORT'],['Snapshot',data.snapshot],['Module',mod.title],['Business unit',scope.unit],['Reporting days',mod.activity?scope.days:'Snapshot; not activity-filtered'],[],['Record ID',...mod.columns,'Business unit','Fixture review flag'],...rows().map(row=>[row.id,...row.values,row.unit,row.review?'Needs contextual review':'No open review flag'])];
    const blob=new Blob(['\uFEFF'+records.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='contoso-'+product+'-'+key+'-sample.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(button?.dataset.pvRecord)inspect(button.dataset.pvModule,button.dataset.pvRecord);
  });
  return {
    mount(element,moduleKey,options){
      data=options.data||PurviewData;product=options.product||'purview';
      root=element;key=moduleKey;scope={unit:options.unit,days:options.days};showDialog=options.showDialog;
      render();
      root.addEventListener('input',event=>{if(event.target.id==='pv-module-search'){settings().query=event.target.value;refresh();}});
      root.addEventListener('change',event=>{if(event.target.id==='pv-module-status'){settings().state=event.target.value;refresh();}});
      root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const action=button.dataset.pvAction;if(action==='clear'){preferences[preferenceKey()]={query:'',state:'all'};render();root.querySelector('#pv-module-search').focus();}if(action==='export')exportRows();});
    },
    homeSummary(){
      const total=Object.values(PurviewData.modules).reduce((n,m)=>n+m.rows.length,0);
      return `<section class="pv-home-fixtures"><div><strong>Explore the Purview sample environment</strong><span>${Object.keys(PurviewData.modules).length} populated solutions · ${total} curated records · read-only snapshot</span></div><button class="button" data-portal-target="section:dlp-alerts">Review sample findings ${icon('fa-arrow-right')}</button></section>`;
    }
  };
})();