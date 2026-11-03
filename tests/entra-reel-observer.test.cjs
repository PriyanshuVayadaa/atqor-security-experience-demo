'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const reel=require('../entra-reel.js');
const observer=require('../entra-reel-observer.js');

test('all observer captions stay concise across every episode and response',()=>{
  for(const episode of reel.episodes)for(const choice of episode.choices){
    const player=reel.createPlayer();player.select(episode.id);
    for(let i=0;i<7;i++){
      const state=player.snapshot(),frame=observer.frame(state);
      assert.ok(frame.title.length<=55,frame.title);assert.ok(frame.caption.length<=90,frame.caption);
      assert.ok(frame.nextLabel.length<=25,frame.nextLabel);
      assert.equal(frame.nodes.length,4);assert.deepEqual(frame.nodes,reel.getNodes(state));
      assert.equal(frame.choices.length,2);assert.ok(frame.choices.every(c=>c.label.length<=26));
      if(i===4)player.choose(choice.id);else if(i<6)player.next();
    }
  }
});

test('risky identity shows the prevented attempt even after verified remediation',()=>{
  const frame=observer.frame({episode:'risky-user',step:6,choice:'contain'});
  assert.equal(frame.access,'blocked');assert.equal(frame.nodes[0],'Remediated');
  assert.match(frame.caption,/Fresh authentication/);
});

test('privilege is visualized as allowed only within the approved active window',()=>{
  assert.equal(observer.frame({episode:'privileged-access',step:5,choice:'approve'}).access,'allowed');
  assert.equal(observer.frame({episode:'privileged-access',step:6,choice:'approve'}).access,'blocked');
  assert.equal(observer.frame({episode:'privileged-access',step:5,choice:'deny'}).access,'blocked');
});

test('device and guest visual access states respect the verified response branch',()=>{
  assert.equal(observer.frame({episode:'device-access',step:5,choice:'repair'}).access,'blocked');
  assert.equal(observer.frame({episode:'device-access',step:6,choice:'repair'}).access,'allowed');
  assert.equal(observer.frame({episode:'device-access',step:6,choice:'hold'}).access,'blocked');
  assert.equal(observer.frame({episode:'guest-review',step:5,choice:'remove'}).access,'allowed');
  assert.equal(observer.frame({episode:'guest-review',step:6,choice:'remove'}).access,'blocked');
  assert.equal(observer.frame({episode:'guest-review',step:6,choice:'retain'}).access,'allowed');
});