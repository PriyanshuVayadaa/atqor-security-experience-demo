'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Agent365 = require('../agent365.js');
const Data = require('../agent365-data.js');

test('registry summary reconciles with the fixture', () => {
  const store = Agent365.createStore(), summary = store.summary();
  assert.equal(summary.total, Data.agents.length);
  assert.equal(summary.ownerless, Data.agents.filter(agent => !agent.owner).length);
  assert.equal(summary.unmanaged, Data.agents.filter(agent => !agent.managed).length);
  assert.equal(summary.atRisk, Data.agents.filter(agent => agent.risks.length).length);
  assert.equal(summary.pending, Data.requests.length);
  assert.equal(new Set(Data.agents.map(agent => agent.id)).size, Data.agents.length);
});

test('filters combine and filtering never changes the total', () => {
  const store = Agent365.createStore();
  assert.ok(store.list({ status: 'Blocked' }).every(agent => agent.status === 'Blocked'));
  const rows = store.list({ publisher: 'Your users', ownerless: true });
  assert.ok(rows.length >= 2 && rows.every(agent => !agent.owner && agent.publisher === 'Your users'));
  assert.equal(store.list({ risk: 'at-risk' }).length, store.summary().atRisk);
  assert.equal(store.list({ query: 'zzzz-none' }).length, 0);
  assert.equal(store.summary().total, Data.agents.length);
});

test('sorting by risk puts the most flagged agent first', () => {
  const store = Agent365.createStore(), rows = store.list({}, { key: 'risks', dir: 'desc' });
  assert.ok(Agent365.riskCount(rows[0]) >= Agent365.riskCount(rows[1]));
});

test('block removes the pin, unblock restores the previous status', () => {
  const store = Agent365.createStore();
  assert.ok(store.get('AG-004').pinned);
  store.act('AG-004', 'block');
  assert.equal(store.get('AG-004').status, 'Blocked');
  assert.equal(store.get('AG-004').pinned, false);
  assert.throws(() => store.act('AG-004', 'block'));
  store.act('AG-004', 'unblock');
  assert.equal(store.get('AG-004').status, 'Available');
});

test('delete and remove depend on publisher type; Microsoft agents can only be blocked', () => {
  const store = Agent365.createStore();
  assert.deepEqual(store.actionsFor('AG-002').filter(item => ['delete', 'remove'].includes(item)), []);
  assert.ok(store.actionsFor('AG-019').includes('delete'));
  assert.ok(store.actionsFor('AG-011').includes('remove'));
  assert.throws(() => store.act('AG-002', 'delete'));
  const before = store.summary().total;
  store.act('AG-019', 'delete');
  assert.equal(store.summary().total, before - 1);
  assert.throws(() => store.get('AG-019'));
});

test('assigning an owner clears ownerless state and the no-owner signal', () => {
  const store = Agent365.createStore(), ownerless = store.summary().ownerless;
  assert.throws(() => store.act('AG-020', 'assign-owner', { owner: ' ' }));
  store.act('AG-020', 'assign-owner', { owner: 'Priya Shah' });
  assert.equal(store.summary().ownerless, ownerless - 1);
  assert.ok(!store.get('AG-020').risks.some(item => item.title === 'No active owner'));
  assert.ok(!store.actionsFor('AG-020').includes('assign-owner'));
});

test('pinning requires a deployed, unblocked agent and is capped at three', () => {
  const store = Agent365.createStore();
  assert.ok(!store.actionsFor('AG-005').includes('pin'));
  assert.ok(!store.actionsFor('AG-010').includes('pin'));
  assert.equal(store.pinned().length, 2);
  store.act('AG-001', 'pin');
  assert.equal(store.canPinMore(), false);
  assert.throws(() => store.act('AG-003', 'pin'), /Only 3/);
  store.movePin('AG-001', 'up');
  assert.deepEqual(store.pinned().map(agent => agent.pinOrder), [1, 2, 3]);
  assert.equal(store.pinned()[1].id, 'AG-001');
});

test('adding an agent from a package registers it once and records the action', () => {
  const store = Agent365.createStore(), total = store.summary().total;
  const agent = store.addAgent({ name: 'Contoso Concierge Agent', scope: 'All users', template: 'Strict protection' });
  assert.equal(store.summary().total, total + 1);
  assert.equal(agent.publisher, 'Your org');
  assert.equal(store.log()[0].action, 'Agent added');
  assert.throws(() => store.addAgent({ name: 'Contoso Concierge Agent' }), /already/);
  assert.throws(() => store.addAgent({ name: ' ' }));
});

test('requests: approving publishes, rejecting does not', () => {
  const store = Agent365.createStore();
  assert.equal(store.requests().length, 3);
  store.decide('REQ-310', 'approve');
  assert.equal(store.get('AG-028').status, 'Available');
  assert.equal(store.get('AG-028').publisher, 'Your org');
  store.decide('REQ-309', 'approve');
  assert.equal(store.get('AG-005').publisher, 'Microsoft');
  store.decide('REQ-307', 'reject');
  assert.equal(store.get('AG-027').status, 'Draft');
  assert.equal(store.requests().length, 0);
  assert.throws(() => store.decide('REQ-310', 'approve'));
});

test('single agent map exists only for agents that report observability data', () => {
  const store = Agent365.createStore();
  const map = store.singleMap('AG-017');
  assert.ok(map.users.length && map.tools.some(tool => tool.flagged));
  assert.ok(map.tools.every(tool => tool.flagged === tool.exc > 1));
  assert.throws(() => store.singleMap('AG-011'), /observability/);
});

test('overview metrics are derived from the registry', () => {
  const store = Agent365.createStore(), overview = store.overview();
  assert.equal(overview.hero.registry, Data.agents.length);
  assert.equal(overview.byPublisher.reduce((total, item) => total + item.count, 0), Data.agents.filter(agent => agent.status !== 'Draft').length);
  assert.equal(overview.trend.length, 30);
  assert.ok(overview.topPlatforms.length <= 5);
  assert.ok(overview.trending[0].users >= overview.trending[1].users);
});

test('CSV export follows filters and quotes values', () => {
  const store = Agent365.createStore(), csv = store.exportCsv({ status: 'Blocked' }).split('\n');
  assert.equal(csv.length, 1 + store.list({ status: 'Blocked' }).length);
  assert.ok(csv[0].startsWith('"Name","Status"'));
  assert.ok(csv.slice(1).every(line => line.includes('"Blocked"')));
});

test('actions are recorded locally and stores are isolated', () => {
  const first = Agent365.createStore(), second = Agent365.createStore();
  first.act('AG-012', 'block');
  assert.equal(first.log().length, 1);
  assert.match(first.log()[0].time, /^Nov 2, 2026/);
  assert.equal(second.get('AG-012').status, 'Available');
  assert.equal(second.log().length, 0);
});

test('copy keeps the simulation boundary and avoids overclaims', () => {
  const text = JSON.stringify(Data);
  assert.ok(!/guarantee|100%|zero risk|real tenant|live tenant/i.test(text));
  assert.ok(Data.agents.every(agent => agent.description.length > 10));
});

test('map clusters follow the admin center groups and cover every agent', () => {
  const store = Agent365.createStore(), groups = store.map();
  assert.equal(groups.reduce((total, group) => total + group.agents.length, 0), store.summary().total);
  const names = groups.map(group => group.name);
  for (const name of ['Microsoft', 'Third party', 'Copilot Studio', 'Agent Builder', 'Foundry']) assert.ok(names.includes(name), name);
  assert.ok(!names.includes('Other') && !names.includes('Microsoft Foundry'));
  assert.equal(store.map({ ownerless: true }).reduce((total, group) => total + group.agents.length, 0), store.summary().ownerless);
});

test('deleted agents can be restored once', () => {
  const store = Agent365.createStore();
  store.act('AG-019', 'delete');
  assert.deepEqual(store.deleted().map(agent => agent.id), ['AG-019']);
  assert.equal(store.summary().total, Data.agents.length - 1);
  store.restore('AG-019');
  assert.equal(store.deleted().length, 0);
  assert.equal(store.get('AG-019').pinned, false);
  assert.throws(() => store.restore('AG-019'));
});

test('tenant-scale estate matches the admin center cluster counts', () => {
  const store = Agent365.createStore(), counts = Object.fromEntries(store.map().map(group => [group.name, group.agents.length]));
  assert.deepEqual(counts, { 'Copilot Studio': 2127, 'Third party': 341, 'Agent Builder': 109, Microsoft: 32, Foundry: 23, 'Agents Toolkit': 12, SharePoint: 9, 'Copilot Studio Legacy': 4, Others: 2 });
  assert.equal(new Set(Data.agents.map(agent => agent.name)).size, Data.agents.length);
});

test('tools roll up SDK agents and flag high exception rates', () => {
  const tools = Agent365.createStore().tools();
  assert.ok(tools.length >= 5 && tools.every((item, i) => i === 0 || tools[i - 1].calls >= item.calls));
  assert.ok(tools.some(item => item.name === 'Microsoft Graph' && item.agents.length >= 3));
  assert.ok(tools.find(item => item.name === 'CRM connector').exc > 1);
});
