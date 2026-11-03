'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../intune-device-demo.js');

test('Windows compliance must be verified before a new access attempt is allowed',()=>{
  for(const id of ['encryption','risk']){
    const session=model.create();session.select(id);assert.equal(session.snapshot().status,'Noncompliant');
    assert.equal(session.attempt().allowed,false);assert.equal(session.attempt().enforcer,'Microsoft Entra Conditional Access');
    session.remediate();assert.equal(session.snapshot().fixed,true);assert.equal(session.snapshot().status,'Noncompliant');assert.equal(session.attempt().allowed,false);
    assert.equal(session.checkIn().compliant,true);assert.equal(session.snapshot().status,'Compliant');assert.equal(session.attempt().allowed,true);
  }
});

test('sync alone cannot fix encryption or lower Defender device risk',()=>{
  for(const id of ['encryption','risk']){const session=model.create();session.select(id);const check=session.checkIn();assert.equal(check.success,true);assert.equal(check.compliant,false);assert.equal(session.attempt().allowed,false);}
});

test('offline check-in cannot verify a requested fix',()=>{
  const session=model.create();session.attempt();session.remediate();session.setOnline(false);
  assert.equal(session.checkIn().success,false);assert.equal(session.snapshot().verified,false);assert.equal(session.attempt().allowed,false);
  session.setOnline(true);assert.equal(session.checkIn().compliant,true);assert.equal(session.attempt().allowed,true);
});

test('app protection restricts destination rather than marking a personal phone compliant',()=>{
  const session=model.create();session.select('mobile');const block=session.attempt();
  assert.equal(block.allowed,false);assert.equal(block.target,'Personal Notes');assert.equal(block.enforcer,'Intune App Protection');
  assert.throws(()=>session.checkIn());session.remediate();assert.equal(session.snapshot().verified,false);assert.equal(session.snapshot().status,'App policy active');
  const permitted=session.attempt();assert.equal(permitted.allowed,true);assert.equal(permitted.target,'OneNote · Work account');
});

test('recorded blocked attempts stay immutable after remediation and verification',()=>{
  const session=model.create(),blocked=session.attempt();session.remediate();session.checkIn();session.attempt();
  const state=session.snapshot();assert.deepEqual(state.attempts[0],blocked);assert.equal(state.attempts[0].allowed,false);assert.equal(state.attempts[1].allowed,true);
});

test('remediation requires a blocked attempt and cannot be requested twice',()=>{
  const session=model.create();assert.throws(()=>session.remediate());session.attempt();session.remediate();assert.throws(()=>session.remediate());
});

test('new scenario and reset clear local events, fixes and access history',()=>{
  const session=model.create();session.attempt();session.remediate();session.checkIn();session.attempt();session.select('risk');
  assert.equal(session.snapshot().attempts.length,0);assert.equal(session.snapshot().events.length,0);assert.equal(session.snapshot().fixed,false);
  session.attempt();session.reset();assert.equal(session.snapshot().id,'risk');assert.equal(session.snapshot().attempts.length,0);
});

test('invalid inputs do not mutate a valid story and snapshots are isolated',()=>{
  const session=model.create(),before=session.snapshot();assert.throws(()=>session.select('invalid'));assert.throws(()=>session.setOnline('yes'));assert.deepEqual(session.snapshot(),before);
  session.attempt();const snapshot=session.snapshot();snapshot.attempts[0].allowed=true;assert.equal(session.snapshot().attempts[0].allowed,false);
});

test('evidence has bounded chronological ids and clearly identifies simulation',()=>{
  const session=model.create();for(let i=0;i<50;i++)session.attempt();
  const state=session.snapshot();assert.equal(state.events.length,40);assert.equal(state.attempts.length,8);assert.equal(state.events[0].id,50);assert.equal(state.last.id,50);
  assert.match(session.evidence().disclaimer,/SIMULATED INTUNE/);
});

test('a verified device cannot complete fresh app access offline; stale compliance is not newly evaluated',()=>{
  const session=model.create();session.attempt();session.remediate();session.checkIn();session.setOnline(false);
  const result=session.attempt();assert.equal(result.allowed,false);assert.equal(result.enforcer,'Device connectivity');assert.equal(session.snapshot().verified,true);
  session.setOnline(true);assert.equal(session.attempt().allowed,true);
});