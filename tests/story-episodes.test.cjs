'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Episodes = require('../story-episodes.js');
const Screens = require('../story-screens.js');

const ids = ['entra', 'intune', 'purview', 'agent365'];
const gates = { entra: 'contain', intune: 'fix', purview: 'send', agent365: 'block' };
const steps = { entra: 3, intune: 3, purview: 2, agent365: 3 };

function walk(id) {
  const player = Episodes.createPlayer(id);
  const seen = [player.scene()];
  while (!player.scene().terminal) {
    if (player.scene().gate) player.choose(player.scene().gate.id);
    else player.next();
    seen.push(player.scene());
  }
  return { player, seen };
}

for (const id of ids) {
  test(`${id}: episode shape`, () => {
    const episode = Episodes.get(id);
    assert.equal(episode.rail.length, 5);
    assert.ok(episode.capabilities.length >= 3);
    assert.ok(episode.boundary.length > 20);
    assert.ok(episode.related.target && episode.related.label);
    for (const scene of episode.scenes) {
      assert.equal(scene.nodes.length, 5, scene.id);
      assert.equal(scene.pills.length, 5, scene.id);
      assert.equal(scene.facts.length, 3, scene.id);
      for (const key of ['id', 'phase', 'title', 'caption', 'tone', 'system', 'event', 'why']) assert.ok(scene[key], `${scene.id}.${key}`);
    }
  });

  test(`${id}: gate blocks advance and only the right choice moves on`, () => {
    const player = Episodes.createPlayer(id);
    while (!player.scene().gate) player.next();
    assert.equal(player.scene().gate.id, gates[id]);
    assert.throws(() => player.next(), /Choose a response/);
    const index = player.scene().index;
    assert.throws(() => player.choose('wrong'));
    assert.equal(player.scene().index, index);
    player.choose(gates[id]);
    assert.equal(player.scene().index, index + 1);
  });

  test(`${id}: ends on a terminal scene, back and replay work`, () => {
    const { player, seen } = walk(id);
    assert.equal(player.scene().terminal, true);
    const last = player.scene().index;
    player.next();
    assert.equal(player.scene().index, last);
    player.back();
    assert.equal(player.scene().index, seen.length - 2);
    player.replay();
    assert.equal(player.scene().index, 0);
  });

  test(`${id}: timeline is chronological and within the step size`, () => {
    const { seen } = walk(id);
    const timeline = Episodes.timeline(id, seen.length - 1);
    assert.equal(timeline.length, seen.length);
    const minutes = timeline.map(item => { const [h, m] = item.time.split(':').map(Number); return h * 60 + m; });
    for (let i = 1; i < minutes.length; i += 1) {
      assert.ok(minutes[i] > minutes[i - 1]);
      assert.ok(minutes[i] - minutes[i - 1] <= steps[id]);
    }
  });

  test(`${id}: every scene has a screen, visual and (terminal) ending`, () => {
    const episode = Episodes.get(id);
    for (const scene of episode.scenes) {
      assert.equal(typeof Screens.screens[id][scene.id], 'function', `screen ${scene.id}`);
      const visual = Screens.visuals[id][scene.id];
      assert.ok(visual, `visual ${scene.id}`);
      assert.ok(Screens.places[id][visual.place], `place ${visual.place}`);
      assert.equal(visual.cam.length, 3);
      assert.ok(visual.chapter.includes(' · '));
      const html = Screens.screens[id][scene.id]({ time: '9:12 AM' });
      assert.ok(html.length > 100);
      assert.ok(!html.includes('undefined'), `undefined in ${scene.id}`);
      if (scene.terminal) assert.ok(Screens.endings[id][scene.id].points.length >= 3);
    }
  });

  test(`${id}: copy avoids overclaims and secrets`, () => {
    const text = JSON.stringify(Episodes.get(id)) + JSON.stringify(Screens.endings[id]);
    assert.ok(!/password\s*[:=]\s*\S{6,}/i.test(text));
    assert.ok(!/guaranteed|100% (secure|protected)|zero risk|live tenant/i.test(text));
  });
}
