'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const reel=require('../entra-reel.js');

function decision(player,id='risky-user'){player.select(id);for(let i=0;i<4;i++)player.next();}

test('four complete episodes expose seven scenes, two choices, and four environment nodes',()=>{
  assert.equal(reel.episodes.length,4);
  for(const episode of reel.episodes){
    assert.equal(episode.steps.length,7);assert.equal(episode.choices.length,2);
    for(const choice of episode.choices){
      const player=reel.createPlayer();player.select(episode.id);
      for(let index=0;index<=6;index++){
        const state=player.snapshot(),scene=reel.getScene(state);
        for(const field of ['phase','title','text','system','event','why'])assert.ok(scene[field],episode.id+' '+index+' '+field);
        assert.equal(scene.facts.length,3);assert.equal(reel.getNodes(state).length,4);
        assert.equal(reel.timeline(state).length,index+1);
        if(index===4)player.choose(choice.id);else if(index<6)player.next();
      }
    }
  }
});

test('the story cannot skip the audience response gate',()=>{
  const player=reel.createPlayer();decision(player);const before=player.snapshot();
  assert.throws(()=>player.next());assert.throws(()=>player.choose('invalid'));assert.deepEqual(player.snapshot(),before);
  player.choose('contain');assert.equal(player.snapshot().step,5);assert.throws(()=>player.choose('observe'));
});

test('risky identity containment and block-only response have different outcomes',()=>{
  const player=reel.createPlayer();decision(player);player.choose('contain');
  assert.ok(reel.getScene(player.snapshot()).facts.some(([,value])=>value.includes('High until')));
  player.next();assert.ok(reel.getScene(player.snapshot()).facts.some(([,value])=>value==='Remediated in story'));
  player.back();player.back();assert.equal(player.snapshot().choice,null);player.choose('observe');player.next();
  const scene=reel.getScene(player.snapshot());assert.equal(scene.tone,'danger');assert.ok(scene.facts.some(([,value])=>value==='Not completed'));
  assert.ok(reel.timeline(player.snapshot()).some(e=>e.text.includes('residual identity risk')));
  assert.ok(!reel.timeline(player.snapshot()).some(e=>e.text.includes('Verified remediation completed')));
});

test('PIM distinguishes eligible, active, and expired without claiming token termination',()=>{
  const player=reel.createPlayer();decision(player,'privileged-access');player.choose('approve');
  assert.equal(reel.getNodes(player.snapshot())[3],'ACTIVE');assert.equal(reel.clock(player.snapshot(),5),'09:01:15 UTC');
  player.next();assert.equal(reel.getNodes(player.snapshot())[3],'INACTIVE');assert.equal(reel.clock(player.snapshot(),6),'10:01:15 UTC');
  assert.match(reel.getScene(player.snapshot()).why,/not instantaneous/);
});

test('device remediation remains pending until explicit verified check-in scene',()=>{
  const player=reel.createPlayer();decision(player,'device-access');player.choose('repair');
  assert.match(reel.getNodes(player.snapshot())[3],/blocked/i);player.next();
  assert.equal(reel.getNodes(player.snapshot())[1],'COMPLIANT');assert.equal(reel.getScene(player.snapshot()).tone,'success');
});

test('guest denial removes only the scoped group access, retaining the directory object',()=>{
  const player=reel.createPlayer();decision(player,'guest-review');player.choose('remove');player.next();
  const facts=reel.getScene(player.snapshot()).facts;
  assert.ok(facts.some(([label,value])=>label==='Project Atlas membership'&&value==='Removed'));
  assert.ok(facts.some(([label,value])=>label==='Guest directory object'&&value==='Still exists'));
});

test('replay, back and episode selection cannot leak later branch state',()=>{
  const player=reel.createPlayer();decision(player);player.choose('contain');player.next();
  player.replay();assert.deepEqual(player.snapshot(),{episode:'risky-user',step:0,choice:null});
  player.back();assert.equal(player.snapshot().step,0);
  player.select('guest-review');assert.deepEqual(player.snapshot(),{episode:'guest-review',step:0,choice:null});
  assert.throws(()=>player.select('invalid'));assert.equal(player.snapshot().episode,'guest-review');
  const copy=player.snapshot();copy.step=6;assert.equal(player.snapshot().step,0);
});

test('timeline clocks are ordered on every episode and branch; outcome cannot advance further',()=>{
  for(const episode of reel.episodes)for(const choice of episode.choices){
    const player=reel.createPlayer();decision(player,episode.id);player.choose(choice.id);player.next();
    const state=player.snapshot(),events=reel.timeline(state);
    assert.equal(events.length,7);assert.equal(events[0].step,0);
    for(let i=1;i<events.length;i++)assert.ok(events[i].time>events[i-1].time);
    player.next();assert.deepEqual(player.snapshot(),state);
  }
});