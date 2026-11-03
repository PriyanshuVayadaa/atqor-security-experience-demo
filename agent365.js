'use strict';

// Pure Agent 365 registry model: filters, summaries, governance actions and a local action log.
const Agent365 = (() => {
  const Data = typeof Agent365Data !== 'undefined' ? Agent365Data : require('./agent365-data.js');
  const PUBLISHER_LABEL = { Microsoft: 'Microsoft', 'Third party': 'External partner', 'Your org': 'Published by your org', 'Your users': 'Shared by creator' };
  const MAX_PINNED = 3;
  const clone = value => JSON.parse(JSON.stringify(value));
  const riskCount = agent => agent.risks.reduce((total, item) => total + item.occ, 0);
  const sevRank = { High: 3, Medium: 2, Low: 1 };
  const clusterOf = agent => agent.publisher === 'Microsoft' ? 'Microsoft' : agent.publisher === 'Third party' ? 'Third party' : agent.platform === 'Microsoft Foundry' ? 'Foundry' : agent.platform === 'Other' ? 'Others' : agent.platform;

  function createStore() {
    let agents = clone(Data.agents);
    let requests = clone(Data.requests);
    let rules = clone(Data.governanceRules);
    let log = [];
    let clock = 0;
    const live = () => agents.filter(agent => !agent.removed);
    const find = id => { const agent = live().find(item => item.id === id); if (!agent) throw new Error('Unknown agent'); return agent; };
    const stamp = () => { const minutes = 42 + (clock += 1); return `Nov 2, 2026, 09:${String(minutes).padStart(2, '0')} UTC`; };
    const record = (agent, action, detail) => { log.unshift({ id: log.length + 1, time: stamp(), agentId: agent.id, agent: agent.name, action, detail }); };
    const pinnedList = () => live().filter(agent => agent.pinned).sort((x, y) => x.pinOrder - y.pinOrder);
    const renumberPins = () => pinnedList().forEach((agent, index) => { agent.pinOrder = index + 1; });

    function actionsFor(id) {
      const agent = find(id), allowed = [];
      if (agent.status === 'Available' || agent.status === 'Not activated') allowed.push('block');
      if (agent.status === 'Blocked') allowed.push('unblock');
      if (!agent.owner && agent.publisher !== 'Microsoft') allowed.push('assign-owner');
      if (agent.publisher === 'Your users') allowed.push('delete');
      if (agent.publisher === 'Your org' || agent.publisher === 'Third party') allowed.push('remove');
      if (agent.status === 'Available' && agent.deployedTo === 'Not deployed' && agent.managed) allowed.push('install');
      if (agent.status === 'Available' && agent.deployedTo !== 'Not deployed') allowed.push(agent.pinned ? 'unpin' : 'pin');
      return allowed;
    }

    function act(id, action, payload = {}) {
      const agent = find(id);
      if (!actionsFor(id).includes(action)) throw new Error(`"${action}" is not available for this agent`);
      if (action === 'block') {
        agent.previousStatus = agent.status; agent.status = 'Blocked';
        if (agent.pinned) { agent.pinned = false; renumberPins(); }
        record(agent, 'Blocked', 'Members can no longer install or use this agent. Existing installs are removed.');
      } else if (action === 'unblock') {
        agent.status = agent.previousStatus && agent.previousStatus !== 'Blocked' ? agent.previousStatus : 'Available';
        record(agent, 'Unblocked', 'Access restored for the audience it was deployed to.');
      } else if (action === 'assign-owner') {
        const owner = String(payload.owner || '').trim();
        if (!owner) throw new Error('Choose an owner');
        agent.owner = owner;
        agent.risks = agent.risks.filter(item => item.title !== 'No active owner');
        record(agent, 'Owner assigned', `${owner} is now accountable for this agent.`);
      } else if (action === 'delete' || action === 'remove') {
        agent.removed = true; agent.pinned = false; renumberPins();
        requests = requests.filter(item => item.agentId !== id);
        record(agent, action === 'delete' ? 'Deleted' : 'Removed', 'Removed from the registry. Other registry entries for the same agent are unaffected.');
      } else if (action === 'install') {
        const scope = String(payload.scope || '').trim();
        if (!scope) throw new Error('Choose who gets the agent');
        agent.deployedTo = scope;
        record(agent, 'Installed', `Deployed to ${scope}.`);
      } else if (action === 'pin') {
        if (pinnedList().length >= MAX_PINNED) throw new Error(`Only ${MAX_PINNED} agents can be pinned`);
        agent.pinned = true; agent.pinOrder = pinnedList().length + 1; renumberPins();
        record(agent, 'Pinned', `Pinned for ${agent.deployedTo}.`);
      } else if (action === 'unpin') {
        agent.pinned = false; renumberPins();
        record(agent, 'Unpinned', 'No longer pinned by your organization.');
      }
      return clone(agent);
    }

    function movePin(id, direction) {
      const list = pinnedList(), index = list.findIndex(agent => agent.id === id);
      const target = index + (direction === 'up' ? -1 : 1);
      if (index < 0 || target < 0 || target >= list.length) return list.map(agent => agent.id);
      [list[index].pinOrder, list[target].pinOrder] = [list[target].pinOrder, list[index].pinOrder];
      record(list[index], 'Pin order changed', `Moved ${direction}.`);
      return pinnedList().map(agent => agent.id);
    }

    function decide(requestId, decision) {
      const request = requests.find(item => item.id === requestId);
      if (!request) throw new Error('Unknown request');
      const agent = find(request.agentId);
      if (decision === 'approve') {
        agent.status = 'Available'; if (agent.publisher === 'Your users') agent.publisher = 'Your org';
        agent.deployedTo = request.scope.replace(/\s*\(.*\)$/, '');
        record(agent, 'Request approved', `Published to ${agent.deployedTo}.`);
      } else if (decision === 'reject') {
        record(agent, 'Request rejected', 'The creator keeps the agent. It is not published more widely.');
      } else throw new Error('Unknown decision');
      requests = requests.filter(item => item.id !== requestId);
      return clone(agent);
    }

    function matches(agent, f) {
      if (f.query && !`${agent.name} ${agent.owner || ''} ${agent.platform} ${agent.description}`.toLowerCase().includes(f.query.toLowerCase())) return false;
      if (f.status && agent.status !== f.status) return false;
      if (f.publisher && agent.publisher !== f.publisher) return false;
      if (f.channel && !agent.channels.includes(f.channel)) return false;
      if (f.platform && agent.platform !== f.platform) return false;
      if (f.dataSource && !agent.dataSources.includes(f.dataSource)) return false;
      if (f.risk === 'at-risk' && !riskCount(agent)) return false;
      if (f.ownerless && agent.owner) return false;
      if (f.unmanaged && agent.managed) return false;
      if (f.errors && !(agent.activity.exceptionRate > 1)) return false;
      return true;
    }

    function list(filters = {}, sort = { key: 'name', dir: 'asc' }) {
      const sign = sort.dir === 'desc' ? -1 : 1;
      const value = agent => ({ name: agent.name.toLowerCase(), status: agent.status, publisher: agent.publisher, platform: agent.platform, owner: (agent.owner || '').toLowerCase(), risks: riskCount(agent), modified: agent.modified, version: agent.version }[sort.key]);
      return live().filter(agent => matches(agent, filters)).sort((x, y) => (value(x) > value(y) ? 1 : value(x) < value(y) ? -1 : 0) * sign || x.name.localeCompare(y.name)).map(agent => ({ ...agent }));
    }

    function summary() {
      const all = live();
      return { total: all.length, atRisk: all.filter(agent => riskCount(agent)).length, ownerless: all.filter(agent => !agent.owner).length, unmanaged: all.filter(agent => !agent.managed).length, errors: all.filter(agent => agent.activity.exceptionRate > 1).length, pending: requests.length, blocked: all.filter(agent => agent.status === 'Blocked').length };
    }

    function facets() {
      const unique = pick => [...new Set(live().flatMap(pick))].sort();
      return { status: unique(agent => [agent.status]), publisher: unique(agent => [agent.publisher]), channel: unique(agent => agent.channels), platform: unique(agent => [agent.platform]), dataSource: unique(agent => agent.dataSources) };
    }

    function overview() {
      const all = live(), published = all.filter(agent => agent.status !== 'Draft');
      const byPublisher = ['Your org', 'Your users', 'Third party', 'Microsoft'].map(name => ({ name, label: PUBLISHER_LABEL[name], count: published.filter(agent => agent.publisher === name).length }));
      const platforms = {};
      published.forEach(agent => { platforms[agent.platform] = (platforms[agent.platform] || 0) + 1; });
      const topPlatforms = Object.entries(platforms).map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count || x.name.localeCompare(y.name)).slice(0, 5);
      const trend = Array.from({ length: 30 }, (_, day) => 14600 + day * 90 + ([0, 6].includes((day + 2) % 7) ? -4200 : 0) + Math.round(Math.sin(day * 1.3) * 520));
      const trending = [...all].filter(agent => agent.status !== 'Blocked').sort((x, y) => y.activity.activeUsers - x.activity.activeUsers).slice(0, 5).map(agent => ({ id: agent.id, name: agent.name, users: agent.activity.activeUsers }));
      return {
        hero: { registry: all.length, activeUsers: 18420, runtimeHours: Math.round(all.reduce((total, agent) => total + agent.activity.hours, 0)), syncedPlatforms: Data.connectedPlatforms.filter(item => item.connected).length },
        actions: summary(), byPublisher, topPlatforms, trend, trending
      };
    }

    function map(filters = {}) {
      const groups = {};
      list(filters).forEach(agent => { (groups[clusterOf(agent)] = groups[clusterOf(agent)] || []).push(agent); });
      return Object.entries(groups).map(([name, items]) => ({ name, agents: items })).sort((x, y) => y.agents.length - x.agents.length || x.name.localeCompare(y.name));
    }

    function singleMap(id) {
      const agent = find(id);
      if (!agent.sdk) throw new Error('Single agent map needs observability data from the Agent 365 SDK');
      return { agent: clone(agent), users: agent.topUsers.map(([name, sessions]) => ({ name, sessions })), tools: agent.tools.map(item => ({ ...item, flagged: item.exc > 1 })) };
    }

    function exportCsv(filters = {}) {
      const rows = list(filters), cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const head = ['Name', 'Status', 'Publisher type', 'Platform', 'Owner', 'Channels', 'Version', 'Last modified', 'Risk signals'];
      return [head.map(cell).join(','), ...rows.map(agent => [agent.name, agent.status, PUBLISHER_LABEL[agent.publisher], agent.platform, agent.owner || 'No owner', agent.channels.join('; '), agent.version, agent.modified, riskCount(agent)].map(cell).join(','))].join('\n');
    }

    function addAgent(spec) {
      const name = String(spec.name || '').trim();
      if (!name) throw new Error('Package has no agent name');
      if (live().some(item => item.name === name)) throw new Error('This package is already in the registry');
      const agent = Data.make(`AG-${9000 + agents.length}`, name, { platform: 'Copilot Studio', type: 'MCS DA', owner: spec.owner || Data.admin.name, channels: ['Teams', 'Copilot'], version: '1.0.0', created: '2026-11-02', modified: '2026-11-02', description: spec.description || 'Uploaded as a package by an administrator.', deployedTo: spec.scope || 'Not deployed', policyTemplate: spec.template || 'Standard protection' });
      agents.push(agent);
      record(agent, 'Agent added', `Published from a package. ${agent.deployedTo === 'Not deployed' ? 'Not deployed to anyone yet' : `Deployed to ${agent.deployedTo}`}. Policy template: ${agent.policyTemplate}.`);
      return clone(agent);
    }

    function restore(id) {
      const agent = agents.find(item => item.id === id && item.removed);
      if (!agent) throw new Error('This agent is not in the deleted list');
      delete agent.removed;
      record(agent, 'Restored', 'Back in the registry. Pins and previous deployments are not restored.');
      return clone(agent);
    }

    function tools() {
      const byName = new Map();
      live().filter(agent => agent.sdk).forEach(agent => agent.tools.forEach(item => {
        const entry = byName.get(item.name) || { name: item.name, kind: item.kind, agents: [], calls: 0, failed: 0 };
        entry.agents.push(agent.name); entry.calls += item.calls; entry.failed += item.calls * item.exc / 100;
        byName.set(item.name, entry);
      }));
      return [...byName.values()].map(item => ({ name: item.name, kind: item.kind, agents: item.agents, calls: item.calls, exc: Math.round(item.failed / item.calls * 1000) / 10 })).sort((x, y) => y.calls - x.calls);
    }

    const toggleRule = id => { const rule = rules.find(item => item.id === id); if (!rule) throw new Error('Unknown rule'); rule.enabled = !rule.enabled; return clone(rule); };

    return {
      get: id => clone(find(id)), list, summary, facets, overview, map, singleMap, exportCsv, actionsFor, act, movePin, decide, addAgent, restore, toggleRule, tools,
      deleted: () => agents.filter(agent => agent.removed).map(clone),
      requests: () => clone(requests).map(item => ({ ...item, agentName: find(item.agentId).name })),
      pinned: () => pinnedList().map(clone), rules: () => clone(rules), log: () => clone(log), canPinMore: () => pinnedList().length < MAX_PINNED
    };
  }

  return { createStore, riskCount, clusterOf, PUBLISHER_LABEL, MAX_PINNED, sevRank, platformsConnected: Data.connectedPlatforms, templates: Data.policyTemplates, admin: Data.admin };
})();

if (typeof module !== 'undefined') module.exports = Agent365;
