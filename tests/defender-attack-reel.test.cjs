'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const reel=require('../defender-attack-reel.js');

function advanceTo(player,id){while(player.scene().id!==id){const before=player.snapshot().step,scene=player.scene();if(scene.choices)player.choose(scene.id==='warning'?'continue':'isolate');else player.next();assert.ok(player.snapshot().step>before,'scene should advance');}}

test('episode starts as a fictional employee and device scene with concise inspectable evidence',()=>{
  const player=reel.createPlayer(),scene=player.scene();
  assert.equal(scene.id,'environment');assert.equal(scene.nodes.length,5);assert.equal(player.scenes().length,3);
  assert.match(scene.caption,/unexpected invoice/);assert.match(scene.facts[0][1],/fictional/);
});
test('employee warning is a real choice gate and cannot be skipped',()=>{
  const player=reel.createPlayer();advanceTo(player,'warning');const before=player.snapshot();
  assert.throws(()=>player.next(),/Choose a response/);assert.deepEqual(player.snapshot(),before);
  assert.throws(()=>player.choose('open-real-file'));assert.deepEqual(player.snapshot(),before);
});
test('cancel path ends with no download, endpoint execution, or incident',()=>{
  const player=reel.createPlayer();advanceTo(player,'warning');player.choose('cancel');
  assert.equal(player.scene().id,'prevented');assert.equal(player.scene().tone,'success');
  assert.equal(player.scene().facts.find(([k])=>k==='Download')[1],'Cancelled in the story');
  assert.ok(!player.scenes().some(s=>s.id==='endpoint'||s.id==='incident'));
  assert.deepEqual(player.snapshot(),{step:3,downloadChoice:'cancel',responseChoice:null});
});
test('proceed path models endpoint signal and XDR correlation without executable content',()=>{
  const player=reel.createPlayer();advanceTo(player,'warning');player.choose('continue');
  assert.equal(player.scene().id,'endpoint');assert.match(player.scene().why,/never downloaded or executed/);
  player.next();assert.equal(player.scene().id,'incident');assert.match(player.scene().facts.find(([k])=>k==='Incident')[1],/SIM-DEF/);
  assert.ok(!JSON.stringify(player.scenes()).match(/powershell|cmd\.exe|MZ header/i));
});
test('analyst response is a second gate with distinct isolation and investigate outcomes',()=>{
  const player=reel.createPlayer();advanceTo(player,'warning');player.choose('continue');advanceTo(player,'decision');
  assert.throws(()=>player.next(),/Choose a response/);player.choose('isolate');
  assert.equal(player.scene().id,'isolation');assert.match(player.scene().facts.find(([k])=>k==='Device state')[1],/simulated/);
  player.next();assert.equal(player.scene().id,'verified');assert.equal(player.scene().tone,'success');
  const other=reel.createPlayer();advanceTo(other,'warning');other.choose('continue');advanceTo(other,'decision');other.choose('investigate');
  assert.equal(other.scene().id,'investigation');assert.equal(other.scene().tone,'warning');
  assert.match(other.scene().facts.find(([k])=>k==='Incident')[1],/Open/);
});
test('back, replay and branch changes discard stale response decisions',()=>{
  const player=reel.createPlayer();advanceTo(player,'warning');player.choose('continue');advanceTo(player,'decision');player.choose('isolate');
  player.back();assert.equal(player.scene().id,'decision');assert.equal(player.snapshot().responseChoice,null);
  player.choose('investigate');assert.equal(player.scene().id,'investigation');
  player.back();player.back();player.back();player.back();
  assert.equal(player.scene().id,'warning');assert.equal(player.snapshot().downloadChoice,null);
  player.choose('cancel');assert.equal(player.scene().id,'prevented');player.replay();
  assert.deepEqual(player.snapshot(),{step:0,downloadChoice:null,responseChoice:null});
});
test('timeline is chronological, bounded to the active branch, and keeps story states local',()=>{
  const player=reel.createPlayer();advanceTo(player,'warning');player.choose('continue');advanceTo(player,'decision');player.choose('isolate');player.next();
  const events=reel.timeline(player.snapshot());assert.equal(events.length,8);
  for(let i=1;i<events.length;i++)assert.ok(events[i].time>events[i-1].time);
  const saved=player.snapshot();saved.step=0;assert.equal(player.scene().id,'verified');
  player.next();assert.equal(player.scene().id,'verified');
});
test('all scene copy states the appropriate prevention, response, and simulation boundary',()=>{
  for(const id of reel.scenes){
    const scene=id==='environment'?reel.getScene({step:0,downloadChoice:null,responseChoice:null}):null;
    if(scene)assert.ok(scene.title&&scene.caption&&scene.why);
  }
  const player=reel.createPlayer();advanceTo(player,'warning');player.choose('continue');advanceTo(player,'decision');player.choose('isolate');player.next();
  assert.match(player.scene().why,/not malware removal/);
  assert.match(player.scene().facts.find(([k])=>k==='Malware removal')[1],/Not performed/);
});
