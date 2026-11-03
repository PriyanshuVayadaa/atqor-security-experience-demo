'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const demo = require('../entra-ca-demo.js');
const base = demo.scenarios[0].input;

test('all guided presets produce their advertised outcome', () => {
  for (const scenario of demo.scenarios) assert.equal(demo.evaluate(scenario.input).outcome,scenario.expected,scenario.id);
});

test('high sign-in risk blocks even with a compliant device and phishing-resistant MFA', () => {
  const result = demo.evaluate({...base,device:'compliant',auth:'phishing'});
  assert.equal(result.outcome,'Blocked');
  assert.ok(result.decisive.includes('CA004'));
});

test('step-up authentication transitions to granted when the assumed MFA is satisfied', () => {
  const input = demo.scenarios.find(s=>s.id==='stepup').input;
  assert.equal(demo.evaluate(input).outcome,'Additional authentication required');
  assert.equal(demo.evaluate({...input,auth:'mfa'}).outcome,'Granted');
});

test('device requirement is independent of MFA and cannot be bypassed by it', () => {
  const input = demo.scenarios.find(s=>s.id==='device').input;
  assert.equal(demo.evaluate(input).outcome,'Blocked');
  assert.equal(demo.evaluate({...input,device:'compliant'}).outcome,'Granted');
});

test('administrator portal policy requires both compliance and phishing-resistant MFA', () => {
  const input = demo.scenarios.find(s=>s.id==='admin').input;
  assert.equal(demo.evaluate({...input,auth:'mfa'}).outcome,'Additional authentication required');
  assert.equal(demo.evaluate({...input,device:'unmanaged'}).outcome,'Blocked');
  assert.equal(demo.evaluate(input).outcome,'Granted');
});

test('report-only pilot exposes impact without enforcement', () => {
  const result = demo.evaluate(demo.scenarios.find(s=>s.id==='report').input);
  assert.equal(result.outcome,'Granted');
  assert.equal(result.policies.find(p=>p.id==='CA019').status,'Would require stronger authentication');
});

test('medium risk challenges for MFA even in a trusted location', () => {
  const input = {...base,risk:'medium',location:'trusted',device:'compliant'};
  const result = demo.evaluate(input);
  assert.equal(result.outcome,'Additional authentication required');
  assert.ok(result.decisive.includes('CA014'));
  assert.equal(demo.evaluate({...input,auth:'mfa'}).outcome,'Granted');
});

test('legacy client blocks and never satisfies modern MFA controls', () => {
  const result = demo.evaluate({...base,risk:'none',auth:'phishing',client:'legacy'});
  assert.equal(result.outcome,'Blocked');
  assert.ok(result.decisive.includes('CA002'));
  assert.deepEqual(result.policies.find(p=>p.id==='CA006').unmet,['MFA']);
});

test('all 2,304 contexts respect block precedence, pilot non-enforcement, and deterministic evaluation', () => {
  let count = 0;
  function visit(index,input) {
    if(index < demo.fields.length) {
      const field = demo.fields[index];
      for (const [value] of field.options) visit(index+1,{...input,[field.key]:value});
      return;
    }
    const result = demo.evaluate(input); count++;
    assert.deepEqual(result,demo.evaluate(input));
    if(input.risk==='high'||input.client==='legacy') assert.equal(result.outcome,'Blocked');
    assert.equal(result.outcome,demo.evaluate({...input,pilot:input.pilot==='yes'?'no':'yes'}).outcome);
    assert.equal(result.policies.length,8);
  }
  visit(0,{});
  assert.equal(count,2304);
});

test('session input edits preserve historical evidence but do not mutate inputs or baseline fixtures', () => {
  const source = fs.readFileSync(path.join(__dirname,'../data.js'),'utf8');
  const data = vm.runInNewContext(source+';SecurityData;');
  const before = JSON.stringify(data);
  const presets = JSON.stringify(demo.scenarios);
  const session = demo.createSession();
  session.run(); session.setInput('risk','none'); session.setInput('auth','mfa'); session.run();
  const state = session.snapshot();
  assert.equal(state.runs[1].result.outcome,'Blocked');
  assert.equal(state.runs[0].result.outcome,'Granted');
  state.runs[0].input.user='changed';
  assert.equal(session.snapshot().runs[0].input.user,'sarah');
  assert.equal(JSON.stringify(demo.scenarios),presets);
  assert.equal(JSON.stringify(data),before);
  for (const id of demo.policyIds) assert.ok(data.entra.policies.some(p=>p.name.startsWith(id+' -')));
});

test('history retains eight runs, identifiers stay monotonic, and reset restores a clean session', () => {
  const session = demo.createSession();
  for (let i=0;i<12;i++) session.run();
  assert.equal(session.snapshot().runs.length,8);
  assert.equal(session.snapshot().runs[0].id,12);
  session.load('admin'); session.reset();
  const state = session.snapshot();
  assert.deepEqual(state.input,base); assert.equal(state.runs.length,0); assert.equal(state.events.length,0);
  assert.equal(session.run().id,1);
});

test('reject invalid inputs and unknown scenarios without changing state', () => {
  const session = demo.createSession(); const before = session.snapshot();
  assert.throws(()=>session.setInput('risk','invalid'));
  assert.throws(()=>session.setInput('unknown','value'));
  assert.throws(()=>session.load('unknown'));
  assert.throws(()=>demo.evaluate({...base,user:'unknown'}));
  assert.deepEqual(session.snapshot(),before);
});