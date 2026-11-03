'use strict';

const EntraCAWorkspace = (() => {
  const demo = typeof module !== 'undefined' && module.exports ? require('./entra-ca-demo.js') : EntraCADemo;
  const copy = value => JSON.parse(JSON.stringify(value));
  const choices = {
    scope: [['all','All demo users'],['admins','Directory administrators'],['finance-engineering','Finance and Engineering'],['Finance','Finance department'],['Engineering','Engineering department'],['Operations','Operations department'],...demo.people.map(p=>[p.id,p.name])],
    exclude: [['none','None'],...demo.people.map(p=>[p.id,p.name])],
    app: [['all','All modeled resources'],['business-sensitive','Finance ERP and source control'],...demo.fields.find(f=>f.key==='app').options],
    location: [['any','Any location'],...demo.fields.find(f=>f.key==='location').options],
    risk: [['any','Any sign-in risk'],...demo.fields.find(f=>f.key==='risk').options],
    client: [['any','All clients'],...demo.fields.find(f=>f.key==='client').options],
    pilot: [['any','Any membership'],...demo.fields.find(f=>f.key==='pilot').options],
    mode: [['Enabled','On'],['Report-only','Report-only'],['Disabled','Off']]
  };
  const controlChoices = [['block','Block access'],['mfa','Require multifactor authentication'],['strong','Require phishing-resistant MFA'],['compliant','Require a compliant device']];
  const labels = {scope:'Users',exclude:'Excluded user',app:'Target resources',location:'Locations',risk:'Sign-in risk',client:'Client apps',pilot:'Pilot membership',mode:'Policy state'};
  const defaults = [
    ['CA001','Require MFA for administrators',{scope:'admins'},['strong']],
    ['CA002','Block legacy authentication',{client:'legacy'},['block']],
    ['CA003','Require compliant device',{scope:'finance-engineering',app:'business-sensitive'},['compliant']],
    ['CA004','Block high sign-in risk',{risk:'high'},['block']],
    ['CA006','Require MFA outside trusted locations',{location:'external'},['mfa']],
    ['CA009','Restrict administrative portals',{scope:'admins',app:'admin'},['strong','compliant']],
    ['CA014','Remediate medium sign-in risk',{risk:'medium'},['mfa']],
    ['CA019','Pilot phishing-resistant MFA for all employees',{pilot:'yes',mode:'Report-only'},['strong']]
  ];
  function blank() { return {id:'',name:'',scope:'all',exclude:'none',app:'all',location:'any',risk:'any',client:'any',pilot:'any',mode:'Report-only',controls:['mfa']}; }
  function defaultPolicies() { return defaults.map(([id,name,conditions,controls])=>({...blank(),id,name:`${id} - ${name}`,mode:'Enabled',...conditions,controls:[...controls]})); }
  function label(key,value) { return choices[key]?.find(([id])=>id===value)?.[1] || value; }
  function validatePolicy(policy) {
    if(typeof policy.name !== 'string'||policy.name.trim().length<3||policy.name.trim().length>100) throw new Error('Enter a policy name between 3 and 100 characters.');
    for (const [key,options] of Object.entries(choices)) if (!options.some(([value])=>policy[key]===value)) throw new Error(`Choose a valid ${labels[key].toLowerCase()}.`);
    if(!Array.isArray(policy.controls)||!policy.controls.length||new Set(policy.controls).size!==policy.controls.length||policy.controls.some(value=>!controlChoices.some(([id])=>id===value))) throw new Error('Select at least one valid access control.');
    if(policy.controls.includes('block')&&policy.controls.length>1) throw new Error('Block access cannot be combined with grant controls.');
  }
  function matches(policy,input) {
    const user = demo.people.find(p=>p.id===input.user);
    const failures = [];
    const scope = policy.scope==='all'||policy.scope===user.id||policy.scope===user.unit||(policy.scope==='admins'&&user.admin)||(policy.scope==='finance-engineering'&&['Finance','Engineering'].includes(user.unit));
    if(!scope) failures.push('User is outside the included assignment.');
    if(policy.exclude===user.id) failures.push('User is explicitly excluded.');
    if(!(policy.app==='all'||policy.app===input.app||(policy.app==='business-sensitive'&&['erp','source'].includes(input.app)))) failures.push('Target resource does not match.');
    for (const key of ['location','risk','client','pilot']) if(policy[key]!=='any'&&policy[key]!==input[key]) failures.push(`${labels[key]} does not match.`);
    return failures;
  }
  function evaluate(input,policies) {
    for(const field of demo.fields) if(!field.options.some(([id])=>input[field.key]===id)) throw new Error(`Invalid ${field.label}`);
    const mfa = input.client==='modern'&&['mfa','phishing'].includes(input.auth);
    const strong = input.client==='modern'&&input.auth==='phishing';
    const results = policies.map(policy=>{
      validatePolicy(policy);
      const failures = matches(policy,input);
      const applies = policy.mode!=='Disabled'&&!failures.length;
      const reportOnly = policy.mode==='Report-only';
      const block = policy.controls.includes('block');
      const unmet = applies ? policy.controls.filter(control=>control==='mfa'?!mfa:control==='strong'?!strong:control==='compliant'?input.device!=='compliant':false) : [];
      const denied = block||unmet.includes('compliant');
      const status = policy.mode==='Disabled' ? 'Off' : !applies ? 'Not applied' : reportOnly ? (denied?'Would block':unmet.length?'Would require MFA':'Would allow') : denied?'Block':unmet.length?'MFA required':'Satisfied';
      return {id:policy.id,name:policy.name,mode:policy.mode,applies,reportOnly,unmet,status,
        blocks:applies&&!reportOnly&&denied,
        reason:policy.mode==='Disabled'?'Policy is off.':failures.length?failures.join(' '):block?'All assignments and conditions match. Block access is configured.':unmet.length?'Required: '+unmet.map(id=>controlChoices.find(([key])=>key===id)[1]).join(' + ')+'.':'All configured grant controls are satisfied.',
        controls:[...policy.controls]};
    });
    const blocked = results.filter(p=>p.blocks);
    const pending = results.filter(p=>p.applies&&!p.reportOnly&&p.unmet.length);
    const outcome = blocked.length?'Blocked':pending.length?'Additional authentication required':'Granted';
    return {outcome,tone:blocked.length?'blocked':pending.length?'challenge':'granted',policies:results,
      decisive:(blocked.length?blocked:pending).map(p=>p.id),
      explanation:blocked.length?'Access prevented by '+blocked.map(p=>p.id).join(', ')+'.':pending.length?'The required authentication has not been satisfied.':'All applicable controls in this sandbox are satisfied. Resource permissions are not evaluated.',
      applied:results.filter(p=>p.applies&&!p.reportOnly).length};
  }
  function createWorkspace() {
    let policies=defaultPolicies(),input=copy(demo.scenarios[0].input),revision=1,runs=[],events=[],runId=0,eventId=0,newId=0;
    function log(action,detail) { events.unshift({id:++eventId,time:new Date().toISOString(),action,detail}); events=events.slice(0,100); }
    return {
      snapshot:()=>copy({policies,input,revision,runs,events}),
      setInput(key,value) {
        const field=demo.fields.find(f=>f.key===key); if(!field?.options.some(([id])=>id===value)) throw new Error('Invalid sign-in input.');
        input={...input,[key]:value};
      },
      loadScenario(id) {
        const preset=demo.scenarios.find(s=>s.id===id); if(!preset) throw new Error('Unknown sign-in example.');
        input=copy(preset.input); log('Example loaded',preset.title);
      },
      save(draft) {
        validatePolicy(draft);
        if(policies.some(p=>p.id!==draft.id&&p.name.toLowerCase()===draft.name.trim().toLowerCase())) throw new Error('A policy with this name already exists.');
        const index=policies.findIndex(p=>p.id===draft.id);
        if(draft.id&&index<0) throw new Error('This policy no longer exists.');
        if(index<0&&policies.length>=40) throw new Error('This demo supports up to 40 policies. Reset to start again.');
        // Pick only supported properties; no arbitrary metadata or executable input is retained.
        const next={id:index<0?'DEMO'+String(++newId).padStart(3,'0'):draft.id,name:draft.name.trim(),controls:[...draft.controls]};
        for(const key of Object.keys(choices)) next[key]=draft[key];
        if(index<0) policies.push(next); else policies[index]=next;
        revision++; log(index<0?'Policy created':'Policy updated',`${next.name} · ${label('mode',next.mode)} · revision ${revision}`); return copy(next);
      },
      remove(id) {
        const policy=policies.find(p=>p.id===id); if(!policy) throw new Error('Policy not found.');
        policies=policies.filter(p=>p.id!==id); revision++; log('Policy deleted',policy.name);
      },
      run() {
        const run={id:++runId,time:new Date().toISOString(),revision,input:copy(input),result:evaluate(input,policies),policySnapshot:copy(policies)};
        runs.unshift(run);runs=runs.slice(0,8);log('Test sign-in',`Run ${run.id} · revision ${revision} · ${run.result.outcome}`);return copy(run);
      },
      reset() {policies=defaultPolicies();input=copy(demo.scenarios[0].input);revision=1;runs=[];events=[];runId=0;eventId=0;newId=0;}
    };
  }
  return {choices,labels,controlChoices,blank,defaultPolicies,label,validatePolicy,evaluate,createWorkspace};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=EntraCAWorkspace;