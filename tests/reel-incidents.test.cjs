'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8') + ';SecurityData;');
const defender = require('../defender-data.js');

const reelIncidents = data.incidents.filter(item => item.id.startsWith('SIM-'));

test('every demo reel incident is a complete, unique queue record', () => {
  assert.equal(reelIncidents.length, 15);
  const ids = new Set(data.incidents.map(item => item.id));
  assert.equal(ids.size, data.incidents.length);
  for (const item of reelIncidents) {
    assert.ok(['Critical', 'High', 'Medium', 'Low'].includes(item.severity), item.id);
    assert.ok(['New', 'In progress', 'Resolved'].includes(item.status), item.id);
    assert.ok(['Finance', 'Engineering', 'Operations'].includes(item.unit), item.id);
    assert.ok(['defender', 'entra', 'intune', 'purview', 'agent365'].includes(item.source), item.id);
    assert.equal(item.steps.length, 3, item.id);
    assert.ok(item.description && item.recommendation && item.time && item.owner, item.id);
    assert.ok(item.reels.length >= 1, item.id);
  }
});

test('every demo reel incident links to a reel that can be launched', () => {
  const sections = { defender: ['attack-reel'], entra: ['demo-reel', 'story'], intune: ['device-protection', 'story'], purview: ['agent-protection', 'story'] };
  const views = ['agent365-story', 'agent365-story-hr'];
  for (const item of reelIncidents) {
    for (const [name, target] of item.reels) {
      assert.ok(name, item.id);
      const [kind, value] = target.split(':');
      if (kind === 'view') assert.ok(views.includes(value), item.id + ' ' + target);
      else assert.ok(sections[kind]?.includes(value), item.id + ' ' + target);
    }
  }
});

test('reels are all covered by at least one incident', () => {
  const targets = new Set(reelIncidents.flatMap(item => item.reels.map(reel => reel[1])));
  for (const target of ['defender:attack-reel', 'entra:demo-reel', 'entra:story', 'intune:device-protection', 'intune:story', 'purview:agent-protection', 'purview:story', 'view:agent365-story', 'view:agent365-story-hr']) assert.ok(targets.has(target), target);
});

test('Defender-sourced reel incidents also appear in the Defender incidents module', () => {
  const rows = defender.get('defender-incidents').rows;
  for (const item of reelIncidents.filter(record => record.source === 'defender')) {
    const row = rows.find(record => record.id === item.id);
    assert.ok(row, item.id);
    assert.equal(row.values[2], item.severity);
    assert.equal(row.values[5], item.status);
  }
});

test('reel incidents keep the boundary wording from their stories', () => {
  const byId = Object.fromEntries(reelIncidents.map(item => [item.id, item]));
  assert.match(byId['SIM-ENT-001'].description, /does not revoke/);
  assert.match(byId['SIM-AGT-001'].description, /containment, not a fix/);
  assert.match(byId['SIM-AGT-002'].description, /not evidence of misconduct/);
  assert.match(byId['SIM-PUR-001'].description, /no misconduct is implied/);
});
