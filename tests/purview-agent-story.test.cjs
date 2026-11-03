'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const storyModel=require('../purview-agent-story.js');
function decide(story){story.next();story.next();story.next();}

test('story introduces the task, attachment and discovery before an enforced block',()=>{
  const story=storyModel.create();assert.equal(story.snapshot().beat,'intro');
  story.next();assert.equal(story.snapshot().beat,'attached');assert.equal(story.snapshot().scan,null);
  story.next();assert.equal(story.snapshot().beat,'inspected');assert.equal(story.snapshot().scan.count,3);
  story.next();assert.equal(story.snapshot().beat,'decision');assert.equal(story.snapshot().decision,'block');
  assert.throws(()=>story.next());assert.equal(story.snapshot().delivery,null);
});

test('audience removal leads to reinspection, new decision, and only then invocation',()=>{
  const story=storyModel.create();decide(story);story.respond('redact');
  assert.equal(story.snapshot().beat,'revised');assert.equal(story.snapshot().scan,null);assert.equal(story.snapshot().delivery,null);
  story.next();assert.equal(story.snapshot().scan.count,0);story.next();assert.equal(story.snapshot().decision,'allow');
  assert.equal(story.snapshot().delivery,null);story.next();assert.equal(story.snapshot().beat,'outcome');assert.equal(story.snapshot().delivery.sensitiveMatchPresent,false);
});

test('keeping a request blocked produces a genuine no-invocation outcome',()=>{
  const story=storyModel.create();decide(story);story.respond('hold');
  const state=story.snapshot();assert.equal(state.beat,'outcome');assert.equal(state.held,true);assert.equal(state.delivery,null);
  assert.equal(storyModel.frame(state).blocked,true);assert.equal(storyModel.frame(state).received,false);assert.throws(()=>story.next());
});

test('restricted input cannot be silently relabeled and approved source selection is explicit',()=>{
  const story=storyModel.create();story.load('confidential');decide(story);
  assert.throws(()=>story.respond('redact'));assert.equal(story.snapshot().input.label,'Highly Confidential');
  story.respond('approved');assert.equal(story.snapshot().input.sample,'safe');assert.equal(story.snapshot().beat,'revised');
  story.next();story.next();story.next();assert.equal(story.snapshot().delivery.sensitiveMatchPresent,false);
});

test('audit comparison demonstrates exposure instead of a protected outcome',()=>{
  const story=storyModel.create();story.update('mode','audit');story.next();story.next();
  assert.equal(story.snapshot().decision,'audit-allow');story.next();
  const state=story.snapshot(),frame=storyModel.frame(state);assert.equal(state.delivery.sensitiveMatchPresent,true);assert.equal(frame.tone,'warning');assert.match(frame.title,/matched content/);
});

test('failed inspection reaches a blocked choice, never an agent call',()=>{
  const story=storyModel.create();story.update('service','unavailable');story.next();story.next();
  assert.equal(story.snapshot().decision,'block');assert.throws(()=>story.next());story.respond('hold');assert.equal(story.snapshot().delivery,null);
});

test('edits, local attachments and restarts invalidate old decisions and reset narrative state',()=>{
  const story=storyModel.create();decide(story);story.update('prompt','A synthetic project summary.');
  assert.equal(story.snapshot().beat,'attached');assert.equal(story.snapshot().decision,null);
  story.attach('Project update.');assert.equal(story.snapshot().input.sample,'local');story.replay();
  assert.equal(story.snapshot().beat,'intro');assert.equal(story.snapshot().input.sample,'pii');assert.equal(story.snapshot().events.length,0);
});

test('every story frame has concise narrative and a valid chapter',()=>{
  for(const sample of ['pii','payment','confidential','prompt','safe']){
    const story=storyModel.create();story.load(sample);
    for(let i=0;i<5;i++){
      const state=story.snapshot(),frame=storyModel.frame(state);assert.ok(frame.title.length<75);assert.ok(frame.caption.length<190);assert.ok(frame.chapter>=0&&frame.chapter<5);
      if(state.beat==='decision'&&state.decision==='block')story.respond('hold');else if(state.beat!=='outcome')story.next();
    }
  }
});