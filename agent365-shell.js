'use strict';

// Pure helpers behind the admin center header: global search, scripted Copilot, simulated shell, notifications, reports and help.
const Agent365Shell = (() => {
  const A = typeof Agent365 !== 'undefined' ? Agent365 : require('./agent365.js');
  const fmt = value => new Intl.NumberFormat('en-US').format(value);
  const PAGES = [['home', 'Home', 'fa-house'], ['overview', 'Agent overview', 'fa-gauge-high'], ['registry', 'All agents', 'fa-robot'], ['map', 'Agent map', 'fa-circle-nodes'], ['deleted', 'Deleted agents', 'fa-trash-can'], ['shadow', 'Shadow AI', 'fa-ghost'], ['tools', 'Tools', 'fa-screwdriver-wrench'], ['settings', 'Agent settings', 'fa-sliders']];
  const SHORTCUTS = [['Agents at risk', 'risk', 'fa-triangle-exclamation'], ['Agents without owners', 'ownerless', 'fa-user-slash'], ['Pending agent requests', 'requests', 'fa-inbox'], ['Agents with exceptions', 'errors', 'fa-bug']];
  const NAV_GROUPS = [
    { id: 'home', label: 'Home', icon: 'fa-house', page: 'home' },
    { id: 'users', label: 'Users', icon: 'fa-user', kids: ['Active users', 'Contacts', 'Guest users', 'Deleted users'] },
    { id: 'copilot', label: 'Copilot', icon: 'fa-wand-magic-sparkles', kids: ['Overview', 'Settings'] },
    { id: 'agents', label: 'Agents', icon: 'fa-robot', real: true },
    { id: 'apps', label: 'Apps', icon: 'fa-table-cells-large', kids: ['Integrated apps', 'Microsoft 365 apps'] },
    { id: 'teams', label: 'Teams & groups', icon: 'fa-people-group', kids: ['Active teams & groups', 'Deleted groups', 'Shared mailboxes'] },
    { id: 'resources', label: 'Resources', icon: 'fa-cube', kids: ['Rooms & equipment', 'Sites'] },
    { id: 'marketplace', label: 'Marketplace', icon: 'fa-bag-shopping', kids: [] },
    { id: 'settings', label: 'Settings', icon: 'fa-gear', kids: ['Org settings', 'Domains', 'Search & intelligence'] },
    { id: 'setup', label: 'Setup', icon: 'fa-wrench', kids: ['Get started', 'Migration'] }
  ];
  const HELP = [
    ['Microsoft Agent 365 overview', 'Observe, govern and secure agents across your organization.', 'https://learn.microsoft.com/en-us/microsoft-agent-365/overview'],
    ['Agent overview in the admin center', 'Hero metrics, top actions and agent analytics.', 'https://learn.microsoft.com/en-us/microsoft-agent-365/admin/agent-365-overview'],
    ['Agent registry', 'Agent types, filters, risk signals, pinning and export.', 'https://learn.microsoft.com/en-us/microsoft-agent-365/admin/agent-registry-overview'],
    ['Use Agent Map', 'Clusters, filters, the single agent map and actions.', 'https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-map'],
    ['Agent management roles and permissions', 'Which roles can view and which can act.', 'https://learn.microsoft.com/en-us/microsoft-agent-365/admin/agent-roles-perms'],
    ['Governance and lifecycle actions', 'Block, unblock, delete, install and pin agents.', 'https://learn.microsoft.com/en-us/microsoft-agent-365/admin/agent-actions']
  ];
  const KEYS = [['/', 'Focus the search box'], ['+ / −', 'Zoom the agent map'], ['0', 'Fit the agent map'], ['Esc', 'Close a pane or go back one level']];

  const scorePage = (text, q) => { const t = text.toLowerCase(); return t === q ? 3 : t.startsWith(q) ? 2 : t.includes(q) ? 1 : 0; };

  function search(store, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [...PAGES.slice(1, 5).map(([page, title, glyph]) => ({ kind: 'page', target: page, title, sub: 'Page', icon: glyph })), ...SHORTCUTS.slice(0, 3).map(([title, go, glyph]) => ({ kind: 'go', target: go, title, sub: 'Filtered view', icon: glyph }))];
    const pages = PAGES.map(([page, title, glyph]) => ({ score: scorePage(title, q), item: { kind: 'page', target: page, title, sub: 'Page', icon: glyph } })).filter(x => x.score);
    const shortcuts = SHORTCUTS.map(([title, go, glyph]) => ({ score: scorePage(title, q), item: { kind: 'go', target: go, title, sub: 'Filtered view', icon: glyph } })).filter(x => x.score);
    const agents = store.list({ query: q }, { key: 'risks', dir: 'desc' }).slice(0, 6).map(agent => ({ kind: 'agent', target: agent.id, title: agent.name, sub: `${A.PUBLISHER_LABEL[agent.publisher]} · ${agent.platform} · ${agent.status}`, icon: 'fa-robot' }));
    return [...pages.sort((x, y) => y.score - x.score).map(x => x.item), ...shortcuts.sort((x, y) => y.score - x.score).map(x => x.item), ...agents].slice(0, 9);
  }

  const high = store => store.list({ risk: 'at-risk' }).filter(agent => agent.risks.some(item => item.sev === 'High'));
  function notifications(store) {
    const s = store.summary(), h = high(store).length, list = [];
    if (s.pending) list.push({ id: 'requests', icon: 'fa-inbox', text: `${s.pending} agent requests are waiting for approval`, go: 'requests' });
    if (h) list.push({ id: 'high', icon: 'fa-triangle-exclamation', text: `${fmt(h)} agents have high severity risk signals`, go: 'risk' });
    if (s.ownerless) list.push({ id: 'ownerless', icon: 'fa-user-slash', text: `${fmt(s.ownerless)} agents have no owner`, go: 'ownerless' });
    list.push({ id: 'sync', icon: 'fa-rotate', text: 'Registry sync finished: 2 external platforms scanned', go: 'settings', info: true });
    return list;
  }

  const topNames = (agents, n = 5) => agents.slice(0, n).map(agent => `${agent.name} (${agent.id})`);
  function copilot(store, question) {
    const q = String(question || '').toLowerCase(), s = store.summary();
    const go = (label, target) => ({ label, go: target });
    if (/owner/.test(q)) return { text: `${fmt(s.ownerless)} agents have no active owner. A few examples:`, list: topNames(store.list({ ownerless: true })), actions: [go('Open agents without owners', 'ownerless')] };
    if (/risk|threat|vulnerab|secur/.test(q)) { const h = high(store); return { text: `${fmt(s.atRisk)} agents have risk signals and ${fmt(h.length)} have a high severity signal. Highest first:`, list: topNames(store.list({ risk: 'at-risk' }, { key: 'risks', dir: 'desc' })), actions: [go('Open agents at risk', 'risk')] }; }
    if (/request|approv|pending/.test(q)) { const r = store.requests(); return { text: r.length ? `${r.length} requests need a decision:` : 'No requests are waiting for approval.', list: r.map(item => `${item.agentName}, requested by ${item.requestedBy} for ${item.scope}`), actions: r.length ? [go('Manage requests', 'requests')] : [] }; }
    if (/tool|mcp|connector|exception|error/.test(q)) { const t = store.tools().filter(item => item.exc > 1); return { text: t.length ? `${t.length} tools have an exception rate above 1%:` : 'No tool exceeds a 1% exception rate.', list: t.map(item => `${item.name}: ${item.exc}% over ${fmt(item.calls)} calls, used by ${item.agents.length} agents`), actions: [go('Open Tools', 'tools')] }; }
    if (/shadow|unmanaged|discover/.test(q)) return { text: `${fmt(s.unmanaged)} agents run outside Agent 365 and have no risk protection or observability.`, list: topNames(store.list({ unmanaged: true })), actions: [go('Open Shadow AI', 'shadow')] };
    if (/block/.test(q)) return { text: `${fmt(s.blocked)} agents are blocked.`, list: [], actions: [go('Open All agents', 'registry')] };
    if (/map|cluster|platform|where|built/.test(q)) { const o = store.overview(); return { text: 'Most agents are built on these platforms:', list: o.topPlatforms.map(item => `${item.name}: ${fmt(item.count)}`), actions: [go('Open Agent map', 'map')] }; }
    if (/summar|overview|estate|how many|total|status/.test(q)) { const o = store.overview(); return { text: `Your registry has ${fmt(s.total)} agents.`, list: [...o.byPublisher.map(item => `${item.label}: ${fmt(item.count)}`), `Pending requests: ${s.pending}`, `Agents at risk: ${fmt(s.atRisk)}`, `Agents without owners: ${fmt(s.ownerless)}`], actions: [go('Open Agent overview', 'overview')] }; }
    return { text: 'I can answer questions about the agents in this sample environment. Try one of these:', list: ['Which agents have no owner?', 'Show agents at risk', 'What needs my approval?', 'Which tools fail most?', 'Summarize my agent estate'], actions: [], suggest: true };
  }
  const COPILOT_PROMPTS = ['Which agents have no owner?', 'Show agents at risk', 'What needs my approval?', 'Which tools fail most?', 'Summarize my agent estate'];

  function tokens(line) { return [...String(line).matchAll(/"([^"]*)"|(\S+)/g)].map(match => match[1] ?? match[2]); }
  const pad = (value, width) => String(value).length > width ? `${String(value).slice(0, width - 1)}…` : String(value).padEnd(width);
  function resolve(store, ref) {
    const key = String(ref || '').toLowerCase();
    if (!key) throw new Error('Specify an agent id or name.');
    const match = store.list({}).find(agent => agent.id.toLowerCase() === key || agent.name.toLowerCase() === key);
    if (!match) throw new Error(`No agent matches "${ref}".`);
    return match;
  }
  function flags(args) {
    const out = { _: [] };
    for (let i = 0; i < args.length; i += 1) {
      if (args[i].startsWith('--')) { const name = args[i].slice(2), next = args[i + 1]; if (next && !next.startsWith('--') && ['status', 'publisher', 'platform', 'search', 'top'].includes(name)) { out[name] = next; i += 1; } else out[name] = true; } else out._.push(args[i]);
    }
    return out;
  }
  const PUBLISHERS = { microsoft: 'Microsoft', partner: 'Third party', org: 'Your org', creator: 'Your users' };
  function runShell(store, line, ctx = { can: true }) {
    const args = tokens(line);
    if (!args.length) return { lines: [] };
    const [cmd, ...rest] = args, name = cmd.toLowerCase();
    if (name === 'clear' || name === 'cls') return { lines: [], clear: true };
    if (name === 'help') return { lines: ['Commands (simulated shell, sample data only):', '  agent365 summary', '  agent365 list [--status S] [--publisher microsoft|partner|org|creator] [--platform P] [--search text]', '                [--risk] [--ownerless] [--unmanaged] [--errors] [--top N]', '  agent365 show <id|name>', '  agent365 block|unblock|delete|pin|unpin <id|name>', '  agent365 assign-owner <id|name> <owner>', '  agent365 export', '  whoami, date, clear'] };
    if (name === 'whoami') return { lines: [`priya.shah@contoso.com (${ctx.can ? 'AI Administrator' : 'Global Reader'})`] };
    if (name === 'date') return { lines: ['Mon Nov 02 2026 09:42:00 UTC (sample snapshot)'] };
    if (name !== 'agent365') return { lines: [`'${cmd}' is not recognized in this simulated shell. Type help.`], error: true };
    const [sub, ...tail] = rest, f = flags(tail);
    try {
      if (!sub) return { lines: ['Usage: agent365 <summary|list|show|block|unblock|delete|pin|unpin|assign-owner|export>. Type help.'], error: true };
      if (sub === 'summary') { const s = store.summary(); return { lines: [`Total agents ........ ${fmt(s.total)}`, `At risk ............. ${fmt(s.atRisk)}`, `Without owners ..... ${fmt(s.ownerless)}`, `Unmanaged .......... ${fmt(s.unmanaged)}`, `Blocked ............ ${fmt(s.blocked)}`, `Pending requests ... ${s.pending}`] }; }
      if (sub === 'list') {
        const filters = {};
        if (f.status) filters.status = String(f.status).replace(/^./, c => c.toUpperCase());
        if (f.publisher) filters.publisher = PUBLISHERS[String(f.publisher).toLowerCase()] || String(f.publisher);
        if (f.platform) filters.platform = f.platform;
        if (f.search) filters.query = f.search;
        if (f.risk) filters.risk = 'at-risk'; if (f.ownerless) filters.ownerless = true; if (f.unmanaged) filters.unmanaged = true; if (f.errors) filters.errors = true;
        const all = store.list(filters), top = Math.min(50, Math.max(1, Number(f.top) || 15));
        const rows = all.slice(0, top).map(agent => `${pad(agent.id, 10)}${pad(agent.name, 32)}${pad(agent.status, 14)}${pad(agent.owner || '(none)', 18)}${A.riskCount(agent)}`);
        return { lines: [`${pad('Id', 10)}${pad('Name', 32)}${pad('Status', 14)}${pad('Owner', 18)}Risks`, ...rows, `${rows.length} of ${fmt(all.length)} matching agents shown.`] };
      }
      if (sub === 'export') return { lines: ['Exporting the registry to contoso-agent-registry-sample.csv ...'], download: true };
      const agent = resolve(store, f._[0]);
      if (sub === 'show') return { lines: [`${agent.name} (${agent.id})`, `Status ........... ${agent.status}`, `Publisher ........ ${A.PUBLISHER_LABEL[agent.publisher]}`, `Platform ......... ${agent.platform}`, `Owner ............ ${agent.owner || '(none)'}`, `Deployed to ...... ${agent.deployedTo}`, `Risk signals ..... ${A.riskCount(agent)}`, `Managed .......... ${agent.managed ? 'yes' : 'no'}`] };
      if (!ctx.can) return { lines: ['Access denied. Your role is view-only. Switch to AI Administrator to change agents.'], error: true };
      const actionMap = { block: 'block', unblock: 'unblock', pin: 'pin', unpin: 'unpin', delete: store.actionsFor(agent.id).includes('remove') ? 'remove' : 'delete', 'assign-owner': 'assign-owner' };
      if (!actionMap[sub]) return { lines: [`Unknown subcommand "${sub}". Type help.`], error: true };
      const payload = sub === 'assign-owner' ? { owner: f._.slice(1).join(' ') } : {};
      store.act(agent.id, actionMap[sub], payload);
      return { lines: [`OK: ${agent.name} ${sub} completed. Recorded locally; nothing changed in a tenant.`], changed: true };
    } catch (error) { return { lines: [`Error: ${error.message}`], error: true }; }
  }

  function usageReport(store, publisher = '') {
    const rows = store.list(publisher ? { publisher } : {}, { key: 'name', dir: 'asc' }).filter(agent => agent.activity.activeUsers > 0).sort((x, y) => y.activity.activeUsers - x.activity.activeUsers);
    const sum = pick => rows.reduce((total, agent) => total + pick(agent), 0);
    return { rows: rows.slice(0, 15), count: rows.length, users: sum(agent => agent.activity.activeUsers), sessions: sum(agent => agent.activity.sessions), hours: sum(agent => agent.activity.hours), exceptions: rows.filter(agent => agent.activity.exceptionRate > 1).length };
  }
  function usageCsv(store, publisher = '') {
    const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = store.list(publisher ? { publisher } : {}, { key: 'name', dir: 'asc' });
    return ['Name', 'Publisher type', 'Platform', 'Active users (30 days)', 'Sessions (30 days)', 'Exception rate %', 'Assisted hours'].map(cell).join(',') + '\n' + rows.map(agent => [agent.name, A.PUBLISHER_LABEL[agent.publisher], agent.platform, agent.activity.activeUsers, agent.activity.sessions, agent.activity.exceptionRate, agent.activity.hours].map(cell).join(',')).join('\n');
  }

  return { PAGES, SHORTCUTS, NAV_GROUPS, HELP, KEYS, COPILOT_PROMPTS, search, notifications, copilot, runShell, usageReport, usageCsv };
})();

if (typeof module !== 'undefined') module.exports = Agent365Shell;
