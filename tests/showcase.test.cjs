'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8') + ';SecurityData;');
const Showcase = require('../showcase.js');
const defender = require('../defender-data.js');
const intune = require('../intune-data.js');
const purview = require('../purview-data.js');

const sectionKeys = {
  defender: [...Object.keys(defender.modules), 'attack-reel'],
  intune: [...Object.keys(intune.modules), 'device-protection', 'story'],
  entra: [...Object.keys(data.entra.modules), 'demo-reel', 'story'],
  purview: [...Object.keys(purview.modules), 'agent-protection', 'story']
};
const views = ['hunting', 'incidents', 'copilot', 'agent365', 'agent365-story', 'agent365-story-hr'];

test('capabilities of the four product catalogs match the catalog names', () => {
  for (const pillar of Showcase.pillars.filter(p => data.products[p.id])) {
    assert.equal(JSON.stringify(pillar.capabilities.map(c => c.name)), JSON.stringify(data.products[pillar.id].capabilities.map(c => c[0])), pillar.id);
  }
});

test('every capability points at a launchable reel, workspace and real incident', () => {
  const ids = new Set(data.incidents.map(item => item.id));
  const check = target => {
    const [kind, value] = target.split(':');
    if (kind === 'view') assert.ok(views.includes(value), target);
    else assert.ok(sectionKeys[kind]?.includes(value), target);
  };
  for (const c of Showcase.capabilities()) {
    for (const [name, target] of c.reels) { assert.ok(name); check(target); }
    if (c.page) check(c.page[1]);
    for (const id of c.incidents) assert.ok(ids.has(id), c.name + ' ' + id);
    assert.ok(['reel', 'workspace', 'described'].includes(c.level));
  }
});

test('coverage counts add up and described-only capabilities are not presented as demonstrated', () => {
  const cover = Showcase.coverage();
  assert.equal(cover.reel + cover.workspace + cover.described, cover.total);
  assert.equal(cover.total, Showcase.capabilities().length);
  for (const c of Showcase.capabilities().filter(item => item.level === 'described')) assert.equal(c.reels.length + (c.page ? 1 : 0), 0);
  assert.ok(cover.reel > 0 && cover.workspace > 0);
});

test('every reel in the tour is a known reel with a matching incident', () => {
  const ids = new Set(data.incidents.map(item => item.id));
  assert.equal(Showcase.stops.length, 6);
  for (const stop of Showcase.stops) {
    assert.ok(Showcase.reelFor(...(stop.target.startsWith('view:') ? [stop.target.slice(5), ''] : stop.target.split(':'))), stop.id);
    assert.ok(stop.bridge && stop.say && stop.boundary);
    for (const id of stop.incidents) {
      assert.ok(ids.has(id), id);
      assert.ok(data.incidents.find(item => item.id === id).reels.some(reel => reel[1] === stop.target), id + ' links back to ' + stop.target);
    }
  }
});

test('reelFor recognises reels and ignores ordinary pages', () => {
  assert.equal(Showcase.reelFor('defender', 'attack-reel'), 'defender:attack-reel');
  assert.equal(Showcase.reelFor('agent365-story-hr', ''), 'view:agent365-story-hr');
  assert.equal(Showcase.reelFor('entra', 'story'), 'entra:story');
  assert.equal(Showcase.reelFor('defender', 'endpoints'), null);
  assert.equal(Showcase.reelFor('overview', ''), null);
});

test('the tour advances only when a chapter is played and left', () => {
  const tour = Showcase.createTour();
  assert.equal(tour.isActive(), false);
  tour.start();
  assert.equal(tour.current().id, 'attack');
  tour.enter('entra:story');
  assert.equal(tour.isPlaying(), false);
  assert.equal(tour.leave(), null);
  tour.enter('defender:attack-reel');
  assert.equal(tour.isPlaying(), true);
  assert.equal(tour.leave().id, 'attack');
  assert.equal(tour.current().id, 'identity');
  assert.deepEqual(tour.incidents(), ['SIM-DEF-001']);
});

test('skipped chapters are not counted as demonstrated', () => {
  const tour = Showcase.createTour();
  tour.start();
  tour.skip();
  assert.equal(tour.snapshot().seen.length, 0);
  assert.equal(tour.demonstrated().length, 0);
  assert.deepEqual(tour.incidents(), []);
});

test('a completed tour reports every chapter, capability and incident once', () => {
  const tour = Showcase.createTour();
  tour.start();
  for (const stop of Showcase.stops) { tour.enter(stop.target); tour.leave(); }
  const snap = tour.snapshot();
  assert.equal(snap.done, true);
  assert.equal(snap.seen.length, 6);
  assert.equal(tour.current(), null);
  assert.equal(tour.incidents().length, 6);
  const shown = tour.demonstrated();
  assert.equal(new Set(shown.map(c => c.name)).size, shown.length);
  for (const name of ['Microsoft Defender XDR', 'Conditional Access', 'Device Compliance', 'Data Loss Prevention (DLP)', 'Ownership & lifecycle']) assert.ok(shown.some(c => c.name === name), name);
  tour.end();
  assert.equal(tour.isActive(), false);
});
