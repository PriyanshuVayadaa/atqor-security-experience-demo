'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Agent365 = require('../agent365.js');
const Shell = require('../agent365-shell.js');

const store = () => Agent365.createStore();

test('search returns pages, shortcuts and agents ordered sensibly', () => {
  const s = store(), map = Shell.search(s, 'map');
  assert.equal(map[0].target, 'map');
  const agents = Shell.search(s, 'Contoso HR');
  assert.ok(agents.some(item => item.kind === 'agent' && /HR/i.test(item.title)));
  assert.ok(Shell.search(s, 'risk').some(item => item.kind === 'go' && item.target === 'risk'));
  assert.ok(Shell.search(s, '').length >= 5);
  assert.equal(Shell.search(s, 'zzzz-no-match').length, 0);
});

test('notifications reflect the registry and clear when work is done', () => {
  const s = store();
  assert.ok(Shell.notifications(s).some(item => item.id === 'requests'));
  ['REQ-310', 'REQ-309', 'REQ-307'].forEach(id => s.decide(id, 'reject'));
  assert.ok(!Shell.notifications(s).some(item => item.id === 'requests'));
});

test('copilot answers from the data and offers navigation', () => {
  const s = store();
  const owner = Shell.copilot(s, 'Which agents have no owner?');
  assert.match(owner.text, /\d+ agents have no active owner/);
  assert.equal(owner.actions[0].go, 'ownerless');
  assert.equal(Shell.copilot(s, 'what needs my approval').list.length, 3);
  assert.ok(Shell.copilot(s, 'which tools fail most').list.some(line => /CRM connector/.test(line)));
  assert.ok(Shell.copilot(s, 'hello there').suggest);
});

test('shell lists, shows and changes agents, and respects the role', () => {
  const s = store();
  assert.match(Shell.runShell(s, 'agent365 summary').lines[0], /Total agents/);
  const list = Shell.runShell(s, 'agent365 list --ownerless --top 5');
  assert.ok(list.lines.length >= 3 && list.lines.at(-1).includes('matching agents'));
  assert.match(Shell.runShell(s, 'agent365 show AG-017').lines[0], /Customer Escalation Router/);
  const blocked = Shell.runShell(s, 'agent365 block "Customer Escalation Router"');
  assert.ok(blocked.changed);
  assert.equal(s.get('AG-017').status, 'Blocked');
  assert.ok(Shell.runShell(s, 'agent365 block AG-017').error);
  assert.ok(Shell.runShell(s, 'agent365 unblock AG-017', { can: false }).error);
  assert.equal(s.get('AG-017').status, 'Blocked');
  Shell.runShell(s, 'agent365 assign-owner AG-020 Priya Shah');
  assert.equal(s.get('AG-020').owner, 'Priya Shah');
  assert.ok(Shell.runShell(s, 'agent365 export').download);
  assert.ok(Shell.runShell(s, 'nope').error);
  assert.ok(Shell.runShell(s, 'clear').clear);
});

test('usage report and csv are consistent', () => {
  const s = store(), report = Shell.usageReport(s);
  assert.ok(report.rows.length === 15 && report.rows[0].activity.activeUsers >= report.rows[1].activity.activeUsers);
  const csv = Shell.usageCsv(s).split('\n');
  assert.equal(csv.length, 1 + s.summary().total);
  assert.ok(Shell.usageReport(s, 'Microsoft').count < report.count);
});

test('navigation tree keeps Agents as the only real group', () => {
  const real = Shell.NAV_GROUPS.filter(group => group.real);
  assert.deepEqual(real.map(group => group.id), ['agents']);
  assert.ok(Shell.HELP.every(topic => topic[2].startsWith('https://learn.microsoft.com/')));
});
