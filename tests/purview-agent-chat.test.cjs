'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../purview-agent-chat.js');

test('Send inspects and blocks before invoking the agent',()=>{
  const chat=model.create(),turn=chat.submit();
  assert.equal(turn.decision,'block');assert.equal(turn.delivery,null);assert.equal(chat.snapshot().totalCalls,0);
  assert.equal(turn.scan.count,3);assert.equal(chat.snapshot().turns.length,1);
});

test('redacted draft requires an explicit new Send before agent invocation',()=>{
  const chat=model.create(),blocked=chat.submit();chat.prepareRedacted(blocked.id);
  assert.equal(chat.snapshot().totalCalls,0);assert.equal(chat.snapshot().stage,0);assert.equal(chat.snapshot().turns.length,1);
  const admitted=chat.submit();assert.equal(admitted.decision,'allow');assert.equal(admitted.delivery.received,true);
  assert.equal(chat.snapshot().totalCalls,1);assert.equal(chat.snapshot().turns[0].decision,'block');
});

test('editing the draft invalidates previous sanitize actions',()=>{
  const chat=model.create(),turn=chat.submit();chat.update('prompt','Different synthetic request');
  assert.throws(()=>chat.prepareRedacted(turn.id));
  const next=chat.submit();assert.throws(()=>chat.prepareRedacted(turn.id));chat.prepareRedacted(next.id);
});

test('prompt-only PII is still blocked with no attachment',()=>{
  const chat=model.create();chat.load('prompt');chat.removeAttachment();const turn=chat.submit();
  assert.equal(turn.attachment,null);assert.equal(turn.decision,'block');assert.ok(turn.scan.findings.every(f=>f.source==='prompt'));
});

test('removing the attachment removes only its content and label metadata',()=>{
  const chat=model.create();chat.load('confidential');assert.equal(chat.submit().decision,'block');
  chat.removeAttachment();const state=chat.snapshot();assert.equal(state.input.text,'');assert.equal(state.input.label,'General');assert.equal(state.attached,false);
  assert.equal(chat.submit().decision,'allow');
});

test('audit-only and outage behavior is unchanged by the chat wrapper',()=>{
  const chat=model.create();chat.update('mode','audit');const audit=chat.submit();
  assert.equal(audit.decision,'audit-allow');assert.equal(audit.delivery.sensitiveMatchPresent,true);assert.equal(chat.snapshot().totalCalls,1);
  chat.update('service','unavailable');const blocked=chat.submit();assert.equal(blocked.decision,'block');assert.equal(blocked.delivery,null);assert.equal(chat.snapshot().totalCalls,1);
});

test('conversation stores masked matches, not raw submitted identifiers',()=>{
  const chat=model.create();chat.load('prompt');chat.submit();
  const history=JSON.stringify(chat.snapshot().turns),evidence=JSON.stringify(chat.evidence());
  for(const raw of ['123-45-6789','demo.customer@example.com']){assert.ok(!history.includes(raw));assert.ok(!evidence.includes(raw));}
  assert.ok(history.includes('[REMOVED]'));
});

test('local attachment gets a generic filename and is inspected on Send',()=>{
  const chat=model.create();chat.attach('Synthetic email: local.customer@example.com');const turn=chat.submit();
  assert.equal(turn.attachment.name,'local-test-document.txt');assert.equal(turn.decision,'block');assert.ok(!turn.attachment.preview.includes('local.customer@example.com'));
});

test('reset and example selection clear conversation and cumulative model calls',()=>{
  const chat=model.create();chat.load('safe');chat.submit();chat.submit();assert.equal(chat.snapshot().totalCalls,2);
  chat.load('pii');assert.equal(chat.snapshot().turns.length,0);assert.equal(chat.snapshot().totalCalls,0);
  chat.submit();chat.reset();assert.equal(chat.snapshot().turns.length,0);assert.equal(chat.snapshot().events.length,0);
});

test('history retains eight exchanges while ids and total calls remain monotonic',()=>{
  const chat=model.create();chat.load('safe');for(let i=0;i<12;i++)chat.submit();
  const state=chat.snapshot();assert.equal(state.turns.length,8);assert.equal(state.turns.at(-1).id,12);assert.equal(state.totalCalls,12);
  const snapshot=chat.snapshot();snapshot.turns[0].decision='tampered';assert.notEqual(chat.snapshot().turns[0].decision,'tampered');
});