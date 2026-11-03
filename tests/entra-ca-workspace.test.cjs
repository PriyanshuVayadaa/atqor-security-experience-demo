'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const demo=require('../entra-ca-demo.js');
const model=require('../entra-ca-workspace.js');
const custom=()=>({...model.blank(),name:'Finance MFA',scope:'Finance',mode:'Enabled'});

test('editable defaults agree with original outcome rules for every input combination',()=>{
  const policies=model.defaultPolicies();let count=0;
  function walk(i,input){if(i<demo.fields.length){const field=demo.fields[i];for(const [id]of field.options)walk(i+1,{...input,[field.key]:id});return;}assert.equal(model.evaluate(input,policies).outcome,demo.evaluate(input).outcome);count++;}
  walk(0,{});assert.equal(count,2304);
});

test('create, edit, disable and delete change actual evaluation without mutating starter rules',()=>{
  const workspace=model.createWorkspace();workspace.loadScenario('report');workspace.setInput('pilot','no');
  assert.equal(workspace.run().result.outcome,'Granted');
  let policy=workspace.save({...custom(),scope:'Engineering'});
  assert.equal(policy.id,'DEMO001');assert.equal(workspace.run().result.outcome,'Additional authentication required');
  policy=workspace.save({...policy,controls:['block']});assert.equal(workspace.run().result.outcome,'Blocked');
  policy=workspace.save({...policy,mode:'Disabled'});assert.equal(workspace.run().result.outcome,'Granted');
  workspace.remove(policy.id);assert.equal(workspace.snapshot().policies.length,8);
  assert.equal(model.defaultPolicies().length,8);
});

test('assignments, exclusions, resources and conditions determine applicability',()=>{
  const input={...demo.scenarios.find(s=>s.id==='report').input,user:'sarah',pilot:'no'};
  const policy={...custom(),controls:['block']};
  assert.equal(model.evaluate(input,[policy]).outcome,'Blocked');
  for(const changed of [{exclude:'sarah'},{scope:'Engineering'},{app:'erp'},{location:'external'},{risk:'high'},{client:'legacy'},{pilot:'yes'}])assert.equal(model.evaluate(input,[{...policy,...changed}]).outcome,'Granted',JSON.stringify(changed));
});

test('report-only block never enforces, but shows projected impact',()=>{
  const policy={...custom(),mode:'Report-only',controls:['block']};
  const result=model.evaluate({...demo.scenarios[0].input,risk:'none'},[policy]);
  assert.equal(result.outcome,'Granted');assert.equal(result.policies[0].status,'Would block');
});

test('saved policy revisions invalidate current results and preserve historical policy snapshots',()=>{
  const workspace=model.createWorkspace();const run=workspace.run();
  const original=JSON.stringify(run);
  workspace.save({...workspace.snapshot().policies.find(p=>p.id==='CA004'),mode:'Disabled'});
  const state=workspace.snapshot();assert.notEqual(state.revision,run.revision);
  assert.equal(JSON.stringify(state.runs[0]),original);
  assert.equal(state.runs[0].policySnapshot.find(p=>p.id==='CA004').mode,'Enabled');
});

test('AND grant controls, block precedence and legacy authentication remain correct',()=>{
  const policy={...custom(),controls:['strong','compliant']};
  const input={...demo.scenarios[0].input,risk:'none',auth:'mfa'};
  assert.equal(model.evaluate(input,[policy]).outcome,'Blocked');
  assert.equal(model.evaluate({...input,device:'compliant'},[policy]).outcome,'Additional authentication required');
  assert.equal(model.evaluate({...input,device:'compliant',auth:'phishing'},[policy]).outcome,'Granted');
  assert.equal(model.evaluate({...input,device:'compliant',auth:'phishing',client:'legacy'},[policy]).outcome,'Additional authentication required');
  assert.equal(model.evaluate({...input,auth:'phishing'},[{...policy,controls:['block']}]).outcome,'Blocked');
});

test('validation rejects bad controls, values, names and stale identifiers atomically',()=>{
  const workspace=model.createWorkspace();const before=workspace.snapshot();
  for(const bad of [{name:''},{name:'x'},{scope:'invalid'},{mode:'invalid'},{controls:[]},{controls:['block','mfa']},{controls:['unknown']},{id:'missing'}])assert.throws(()=>workspace.save({...custom(),...bad}));
  assert.throws(()=>workspace.save({...custom(),name:before.policies[0].name}));
  assert.deepEqual(workspace.snapshot(),before);
});

test('snapshots are isolated and reset restores initial workspace',()=>{
  const workspace=model.createWorkspace();const before=workspace.snapshot();
  const saved=workspace.save(custom());saved.controls.push('block');
  assert.deepEqual(workspace.snapshot().policies.at(-1).controls,['mfa']);
  workspace.run();workspace.loadScenario('admin');workspace.reset();assert.deepEqual(workspace.snapshot(),before);
});

test('history and activity retention are bounded with monotonic identifiers',()=>{
  const workspace=model.createWorkspace();for(let i=0;i<110;i++)workspace.run();
  const state=workspace.snapshot();assert.equal(state.runs.length,8);assert.equal(state.events.length,100);assert.equal(state.events[0].id,110);assert.equal(state.runs[0].id,110);
});