'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../purview-agent-demo.js');
const input=id=>({...model.samples.find(s=>s.id===id),mode:'enforce',service:'available'});

test('PII, card, label and prompt samples block; business sample permits',()=>{
  for(const id of ['pii','payment','confidential','prompt'])assert.equal(model.inspect(input(id)).decision,'block',id);
  assert.equal(model.inspect(input('safe')).decision,'allow');
  assert.ok(model.inspect(input('prompt')).findings.some(f=>f.source==='prompt'&&f.type==='ssn'));
});

test('Luhn validation rejects invalid card numbers and repeated digits',()=>{
  const base=input('safe');
  assert.ok(model.inspect({...base,text:'Card: 4111 1111 1111 1111'}).findings.some(f=>f.type==='card'));
  assert.ok(!model.inspect({...base,text:'Card: 4111 1111 1111 1112'}).findings.some(f=>f.type==='card'));
  assert.ok(!model.inspect({...base,text:'Card: 0000 0000 0000 0000'}).findings.some(f=>f.type==='card'));
});

test('agent delivery is impossible until an allowed policy decision exists',()=>{
  const session=model.createSession();assert.throws(()=>session.deliver());assert.throws(()=>session.apply());
  session.scan();assert.throws(()=>session.deliver());assert.equal(session.apply(),'block');assert.throws(()=>session.deliver());
  assert.equal(session.snapshot().delivery,null);assert.equal(session.snapshot().stage,2);
});

test('remove identifiers, rescan, reapply then invoke the agent',()=>{
  const session=model.createSession();session.scan();session.apply();session.redact();
  assert.equal(session.snapshot().stage,0);assert.throws(()=>session.deliver());assert.throws(()=>session.apply());
  const scan=session.scan();assert.equal(scan.count,0);assert.equal(session.apply(),'allow');
  assert.equal(session.deliver().received,true);assert.equal(session.snapshot().stage,3);
  assert.throws(()=>session.deliver());
});

test('redaction handles overlapping values and does not erase the restricted label',()=>{
  const session=model.createSession();session.load('confidential');session.update('text','Email demo.customer@example.com; SSN 123-45-6789');
  session.scan();session.apply();session.redact();const scan=session.scan();
  assert.equal(scan.count,0);assert.equal(scan.labelBlocked,true);assert.equal(session.apply(),'block');assert.throws(()=>session.deliver());
  assert.equal(model.redact('Card: 4111 1111 1111 1111; email: a@example.com'),'Card: [REMOVED]; email: [REMOVED]');
});

test('audit-only clearly permits sensitive content; default enforcement does not',()=>{
  const session=model.createSession();session.update('mode','audit');session.scan();assert.equal(session.apply(),'audit-allow');
  const delivered=session.deliver();assert.equal(delivered.sensitiveMatchPresent,true);assert.equal(delivered.received,true);
  session.update('mode','enforce');assert.equal(session.snapshot().stage,0);assert.throws(()=>session.deliver());
  session.scan();assert.equal(session.apply(),'block');
});

test('inspection outages fail closed even in audit-only mode',()=>{
  for(const mode of ['enforce','audit']){
    const session=model.createSession();session.load('safe');session.update('mode',mode);session.update('service','unavailable');
    assert.equal(session.scan().status,'unavailable');assert.equal(session.apply(),'block');assert.throws(()=>session.deliver());
  }
});

test('edited drafts invalidate stale scans, decisions and agent delivery',()=>{
  const session=model.createSession();session.load('safe');session.scan();session.apply();session.deliver();
  session.update('prompt','My SSN is 123-45-6789');const state=session.snapshot();
  assert.equal(state.stage,0);assert.equal(state.scan,null);assert.equal(state.decision,null);assert.equal(state.delivery,null);assert.throws(()=>session.deliver());
  assert.equal(session.scan().decision,'block');
});

test('inspection findings, history, delivery and exported evidence never contain raw content or filenames',()=>{
  const session=model.createSession();session.update('text','UNIQUE-PRIVATE-PAYLOAD SSN: 123-45-6789 Email: customer.private@example.com');session.scan();session.apply();
  session.update('mode','audit');session.scan();session.apply();const delivery=session.deliver();
  const evidence=JSON.stringify({evidence:session.evidence(),scan:session.snapshot().scan,delivery});
  for(const raw of ['UNIQUE-PRIVATE-PAYLOAD','123-45-6789','customer.private@example.com','customer-onboarding-demo.txt'])assert.ok(!evidence.includes(raw),raw);
});

test('local attachment validates text without retaining the original filename',()=>{
  const session=model.createSession();session.attach('A synthetic text file with no supported identifiers.');
  assert.equal(session.snapshot().input.name,'local-test-document.txt');assert.equal(session.snapshot().input.sample,'local');
  assert.throws(()=>session.attach('a\u0000binary'));assert.throws(()=>session.attach('a'.repeat(model.LIMIT+1)));
  session.scan();assert.equal(session.apply(),'allow');
});

test('validation rejects unsupported fields, invalid policies, excessive content and empty requests',()=>{
  const session=model.createSession();for(const [key,value]of [['mode','unknown'],['label','unknown'],['service','unknown'],['text','a'.repeat(model.LIMIT+1)],['unsupported','x']])assert.throws(()=>session.update(key,value));
  session.update('text','');session.update('prompt','');assert.throws(()=>session.scan());
  assert.throws(()=>session.load('unknown'));
});

test('snapshots are isolated; reset clears text, history and events',()=>{
  const session=model.createSession();session.load('prompt');session.scan();session.apply();
  const copy=session.snapshot();copy.input.text='changed';copy.scan.findings.length=0;assert.notEqual(session.snapshot().input.text,'changed');
  session.reset();const state=session.snapshot();assert.equal(state.input.sample,'pii');assert.equal(state.stage,0);assert.equal(state.events.length,0);assert.equal(state.history.length,0);
});

test('metadata retention is bounded without reusing event ids',()=>{
  const session=model.createSession();session.load('safe');for(let i=0;i<30;i++){session.scan();session.apply();}
  const state=session.snapshot();assert.equal(state.events.length,40);assert.equal(state.history.length,8);assert.ok(state.events[0].id>40);
});