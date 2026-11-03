'use strict';

// Microsoft 365 admin center "Agents" experience for Agent 365, driven by the local registry model.
const Agent365UI = (() => {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, family = 'fa-solid') => `<i class="${family} ${name}" aria-hidden="true"></i>`;
  const fmt = value => new Intl.NumberFormat('en-US').format(value);
  const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const pubClass = { Microsoft: 'ms', 'Third party': 'tp', 'Your org': 'org', 'Your users': 'usr' };
  const label = pub => Agent365.PUBLISHER_LABEL[pub];
  const dateText = iso => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const COLS = [['status', 'Status'], ['publisher', 'Publisher type'], ['platform', 'Platform'], ['owner', 'Owner'], ['channels', 'Channels'], ['risks', 'Risks'], ['version', 'Version'], ['modified', 'Last modified']];
  const SORTABLE = ['name', 'status', 'publisher', 'platform', 'owner', 'risks', 'version', 'modified'];
  const OWNERS = ['Priya Shah', 'Daniel Cho', 'Aisha Khan', 'Marcus Webb', 'Elena Rossi', 'Hannah Brooks', 'Jordan Lee'];
  const AUDIENCES = ['All users', 'Finance group', 'Sales group', 'Operations group', 'Legal group', 'Just me'];
  const CARD_FILTERS = { risk: { risk: 'at-risk' }, ownerless: { ownerless: true }, unmanaged: { unmanaged: true }, errors: { errors: true } };
  const WRITE_NOTE = 'Requires the AI Administrator or Global Administrator role';

  let root = null, store = null, st = null, toastTimer = null;
  const fresh = () => ({ page: 'overview', tab: 'registry', filters: {}, card: '', sort: { key: 'name', dir: 'asc' }, cols: { status: 1, publisher: 1, platform: 1, owner: 1, channels: 0, risks: 1, version: 0, modified: 1 }, compact: false, panel: null, selected: null, paneTab: 'details', openRisk: 'High', single: null, mapNode: null, role: 'ai-admin', dialog: null, wizard: { step: 0, uploaded: false, publish: 'Everyone in the organization', deploy: 'No one yet', template: 'Standard protection' }, toast: '' });
  const can = () => st.role === 'ai-admin';

  const statusBadge = status => `<span class="a365-status ${status.toLowerCase().replace(/\s+/g, '-')}"><i></i>${esc(status)}</span>`;
  const sevOf = agent => agent.risks.reduce((top, item) => Agent365.sevRank[item.sev] > (Agent365.sevRank[top] || 0) ? item.sev : top, '');
  const avatar = agent => `<span class="a365-ava ${pubClass[agent.publisher]}">${esc(initials(agent.name))}</span>`;
  const cell = (agent, key) => {
    if (key === 'status') return statusBadge(agent.status);
    if (key === 'publisher') return esc(label(agent.publisher));
    if (key === 'platform') return esc(agent.platform);
    if (key === 'owner') return agent.owner ? esc(agent.owner) : '<span class="a365-noowner">No owner</span>';
    if (key === 'channels') return esc(agent.channels.join(', '));
    if (key === 'risks') { const count = Agent365.riskCount(agent); return count ? `<button class="a365-risk ${sevOf(agent).toLowerCase()}" data-a365-risk="${agent.id}" aria-label="${count} risk signals for ${esc(agent.name)}. Open risk details">${icon('fa-triangle-exclamation')} ${count}</button>` : '<span class="a365-muted">0</span>'; }
    if (key === 'version') return esc(agent.version);
    return dateText(agent.modified);
  };

  /* ---------- navigation and header ---------- */
  function navHtml() {
    const item = (page, glyph, text, extra = '') => `<button class="a365-nav-item ${st.page === page ? 'active' : ''}" data-a365-page="${page}" ${st.page === page ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${text}</span>${extra}</button>`;
    const s = store.summary();
    return `<nav class="a365-nav" aria-label="Agents navigation"><div class="a365-nav-head">${icon('fa-grip')}<strong>Microsoft 365 admin center</strong></div>
      <div class="a365-nav-group">Agents</div>
      ${item('overview', 'fa-gauge-high', 'Overview')}${item('registry', 'fa-robot', 'All agents', s.pending ? `<em>${s.pending}</em>` : '')}${item('settings', 'fa-sliders', 'Settings')}
      <div class="a365-nav-note">Agent 365 gives IT a registry, observability and policy controls for every agent. All data here is fictional.</div>
      <button class="a365-nav-item a365-back" data-view="overview">${icon('fa-arrow-left')}<span>atQor security overview</span></button></nav>`;
  }
  function headerHtml() {
    const titles = { overview: ['Agents', 'Overview'], registry: ['Agents', 'All agents'], settings: ['Agents', 'Settings'] };
    const [parent, current] = titles[st.page];
    return `<header class="a365-header"><div><div class="a365-crumbs"><span>${parent}</span>${icon('fa-chevron-right')}<span>${current}</span></div><h1>${st.page === 'overview' ? 'Agent overview' : st.page === 'registry' ? 'All agents' : 'Agent settings'}</h1></div>
      <div class="a365-who"><label class="a365-role">Viewing as<select data-a365-role aria-label="Administrator role"><option value="ai-admin" ${can() ? 'selected' : ''}>Priya Shah · AI Administrator</option><option value="reader" ${can() ? '' : 'selected'}>Global Reader (view only)</option></select></label><span class="a365-sim">${icon('fa-flask')} Sample data · no tenant connection</span></div></header>`;
  }

  /* ---------- overview ---------- */
  function lineChart(values) {
    const w = 620, h = 150, pad = 8, min = Math.min(...values) - 40, max = Math.max(...values) + 40;
    const pts = values.map((value, index) => [pad + index * (w - pad * 2) / (values.length - 1), h - pad - (value - min) / (max - min) * (h - pad * 2)]);
    const path = pts.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join('');
    return `<svg class="a365-line" viewBox="0 0 ${w} ${h}" role="img" aria-label="Daily active users of agents over the last 30 days, ${fmt(values[0])} to ${fmt(values.at(-1))}"><path d="${path}L${pts.at(-1)[0]},${h}L${pts[0][0]},${h}Z" class="area"/><path d="${path}" class="stroke"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4"/></svg><div class="a365-line-axis"><span>Oct 4</span><span>Oct 19</span><span>Nov 2</span></div>`;
  }
  function overviewHtml() {
    const o = store.overview(), a = o.actions, total = o.byPublisher.reduce((sum, item) => sum + item.count, 0), top = o.topPlatforms[0].count;
    const hero = [['Agent registry', fmt(o.hero.registry), 'Agents in your organization’s catalog', 'Explore all agents', 'registry'], ['Active users', fmt(o.hero.activeUsers), 'Used an agent in the last 30 days', '', ''], ['Agent run-time', `${fmt(o.hero.runtimeHours)} hrs`, 'Time agents worked in the last 30 days', '', ''], ['Registry sync', `${o.hero.syncedPlatforms} platforms`, 'External platforms scanned for agents', 'Review sync', 'settings']];
    const actions = [['Pending requests', a.pending, 'Agents waiting for approval', 'Manage requests', 'requests', 'fa-inbox'], ['Agents at risk', a.atRisk, 'Agents with one or more risk signals', 'Manage agent risks', 'risk', 'fa-triangle-exclamation'], ['Agents without owners', a.ownerless, 'No one is accountable for these agents', 'Assign owner', 'ownerless', 'fa-user-slash'], ['Agents with exceptions', a.errors, 'Agents with an exception rate above 1%', 'View details', 'errors', 'fa-bug']];
    return `<div class="a365-banner">${icon('fa-circle-info')}<span>Fictional Contoso snapshot, November 2, 2026. Agent 365 data collection and risk signals depend on licensing and connected platforms; risk counts can trail the security portals by up to an hour.</span></div>
      <section class="a365-hero" aria-label="Agent impact">${hero.map(([name, value, note, link, target]) => `<article class="a365-card"><span>${name}</span><strong>${value}</strong><small>${note}</small>${link ? `<button class="a365-link" data-a365-go="${target}">${link} ${icon('fa-arrow-right')}</button>` : ''}</article>`).join('')}</section>
      <h2 class="a365-h2">Top actions for you</h2>
      <section class="a365-actions" aria-label="Governance actions">${actions.map(([name, count, note, link, target, glyph]) => `<article class="a365-card a365-actioncard ${count ? '' : 'clear'}"><div class="a365-ic">${icon(glyph)}</div><div><span>${name}</span><strong>${count}</strong><small>${note}</small></div><button class="a365-btn" data-a365-go="${target}">${link}</button></article>`).join('')}</section>
      <h2 class="a365-h2">Agent analytics</h2>
      <section class="a365-analytics"><article class="a365-card"><h3>Agents by creators</h3><div class="a365-stack" role="img" aria-label="Agents by creator: ${o.byPublisher.map(item => `${item.label} ${item.count}`).join(', ')}">${o.byPublisher.map(item => `<i class="${pubClass[item.name]}" style="flex:${item.count}"></i>`).join('')}</div><ul class="a365-legend">${o.byPublisher.map(item => `<li><i class="${pubClass[item.name]}"></i>${item.label}<b>${item.count}</b></li>`).join('')}</ul><small>${total} published or available agents. Drafts are not counted.</small></article>
        <article class="a365-card"><h3>Top platforms used to build agents</h3>${o.topPlatforms.map(item => `<div class="a365-bar"><span>${esc(item.name)}</span><div><i style="width:${Math.round(item.count / top * 100)}%"></i></div><b>${item.count}</b></div>`).join('')}<small>Only the five most used platforms are shown. Open the registry for all.</small></article>
        <article class="a365-card a365-wide"><h3>Active users over time</h3>${lineChart(o.trend)}<small>Daily unique users who prompted an agent, last 30 days.</small></article>
        <article class="a365-card"><h3>Trending agents by active users</h3><ol class="a365-trend">${o.trending.map(item => `<li><button data-a365-open="${item.id}">${esc(item.name)}</button><b>${fmt(item.users)}</b></li>`).join('')}</ol></article></section>`;
  }

  /* ---------- registry ---------- */
  const toolbarHtml = () => {
    const f = st.filters, facets = store.facets();
    const select = (key, name, options) => `<label class="a365-sel"><span>${name}</span><select data-a365-filter="${key}"><option value="">All</option>${options.map(option => `<option value="${esc(option)}" ${f[key] === option ? 'selected' : ''}>${esc(key === 'publisher' ? label(option) : option)}</option>`).join('')}</select></label>`;
    const active = Object.entries(f).filter(([key, value]) => key !== 'query' && value);
    return `<div class="a365-toolbar"><label class="a365-search">${icon('fa-magnifying-glass')}<input id="a365-search" type="search" value="${esc(f.query || '')}" placeholder="Search agents" aria-label="Search agents" autocomplete="off"></label>
      <button class="a365-btn ghost" data-a365-refresh>${icon('fa-rotate')} Refresh</button><button class="a365-btn ghost" data-a365-export>${icon('fa-file-export')} Export</button>
      <button class="a365-btn ghost" data-a365-add ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>${icon('fa-plus')} Add agent</button><button class="a365-btn ghost" data-a365-pins>${icon('fa-thumbtack')} Manage pinned agents</button>
      <button class="a365-btn ghost" data-a365-columns>${icon('fa-table-columns')} Customize view</button><button class="a365-btn ghost" data-a365-density aria-pressed="${st.compact}" title="Switch between normal and compact list">${icon(st.compact ? 'fa-list' : 'fa-bars')}</button></div>
      <div class="a365-filters">${select('status', 'Status', facets.status)}${select('publisher', 'Publisher type', facets.publisher)}${select('channel', 'Channel', facets.channel)}${select('platform', 'Platform', facets.platform)}${select('dataSource', 'Data source', facets.dataSource)}${active.length ? `<button class="a365-link" data-a365-clear>${icon('fa-xmark')} Clear filters</button>` : ''}</div>`;
  };
  function summaryTiles() {
    const s = store.summary();
    const tile = (key, name, value, note) => `<button class="a365-tile ${st.card === key ? 'on' : ''}" data-a365-card="${key}" aria-pressed="${st.card === key}"><span>${name}</span><strong>${value}</strong><small>${note}</small></button>`;
    return `<section class="a365-tiles" aria-label="Registry summary">${tile('total', 'Total agents', s.total, 'Filters do not change this count')}${tile('risk', 'Agents at risk', s.atRisk, 'One or more risk signals')}${tile('ownerless', 'Agents without owners', s.ownerless, 'No active owner')}${tile('unmanaged', 'Unmanaged agents', s.unmanaged, 'Outside Agent 365 protection')}</section>`;
  }
  function tableHtml() {
    const rows = store.list(st.filters, st.sort), cols = COLS.filter(([key]) => st.cols[key]);
    const head = (key, name) => `<th scope="col" aria-sort="${st.sort.key === key ? (st.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}">${SORTABLE.includes(key) ? `<button data-a365-sort="${key}">${name}${st.sort.key === key ? icon(st.sort.dir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : ''}</button>` : name}</th>`;
    if (!rows.length) return `<div class="a365-empty">${icon('fa-filter-circle-xmark')}<strong>No agents match these filters</strong><span>Clear a filter or change the search text. The total agent count above is unchanged.</span></div>`;
    return `<div class="a365-tablewrap"><table class="a365-table ${st.compact ? 'compact' : ''}"><caption class="sr-only">${rows.length} agents</caption><thead><tr>${head('name', 'Name')}${cols.map(([key, name]) => head(key, name)).join('')}</tr></thead><tbody>${rows.map(agent => `<tr class="${st.selected === agent.id && st.panel === 'agent' ? 'sel' : ''}"><td><button class="a365-name" data-a365-open="${agent.id}">${avatar(agent)}<span><b>${esc(agent.name)}</b><small>${esc(agent.type)}${agent.pinned ? ` · ${icon('fa-thumbtack')} Pinned` : ''}</small></span></button></td>${cols.map(([key]) => `<td>${cell(agent, key)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="a365-count" aria-live="polite">${rows.length} of ${store.summary().total} agents shown</p>`;
  }
  function requestsHtml() {
    const list = store.requests();
    if (!list.length) return `<div class="a365-empty">${icon('fa-circle-check')}<strong>No pending requests</strong><span>Creators’ requests to publish agents widely appear here for approval.</span></div>`;
    return `<div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Agent</th><th>Requested by</th><th>Requested on</th><th>Audience</th><th>Note</th><th>Decision</th></tr></thead><tbody>${list.map(item => `<tr><td><button class="a365-name" data-a365-open="${item.agentId}"><b>${esc(item.agentName)}</b></button></td><td>${esc(item.requestedBy)}</td><td>${dateText(item.date)}</td><td>${esc(item.scope)}</td><td>${esc(item.note)}</td><td class="a365-rowactions"><button class="a365-btn primary" data-a365-decide="approve" data-id="${item.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>Approve</button><button class="a365-btn" data-a365-decide="reject" data-id="${item.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>Reject</button></td></tr>`).join('')}</tbody></table></div><p class="a365-count">Approving publishes the agent to the requested audience. Rejecting leaves it with its creator.</p>`;
  }
  function mapHtml() {
    if (st.single) return singleMapHtml();
    const clusters = store.map(st.filters);
    if (!clusters.length) return `<div class="a365-empty">${icon('fa-filter-circle-xmark')}<strong>No agents match these filters</strong></div>`;
    return `<div class="a365-maplegend"><span><i class="dot high"></i>High risk signal</span><span><i class="dot medium"></i>Medium</span><span><i class="dot low"></i>Low</span><span><i class="dot dashed"></i>No owner</span><span><i class="dot blocked"></i>Blocked</span><span><i class="dot ring"></i>Observability data</span></div>
      <div class="a365-map">${clusters.map(group => `<article class="a365-cluster"><h3>${esc(group.name)}<b>${group.agents.length}</b></h3><div class="a365-nodes">${group.agents.map(agent => `<button class="a365-node ${pubClass[agent.publisher]} ${sevOf(agent).toLowerCase()} ${agent.owner ? '' : 'noowner'} ${agent.status === 'Blocked' ? 'blocked' : ''} ${agent.sdk ? 'sdk' : ''}" data-a365-open="${agent.id}" title="${esc(agent.name)}" aria-label="${esc(agent.name)}, ${esc(agent.status)}${sevOf(agent) ? ', ' + sevOf(agent) + ' risk signal' : ''}">${esc(initials(agent.name))}</button>`).join('')}</div></article>`).join('')}</div>`;
  }
  function singleMapHtml() {
    const m = store.singleMap(st.single), agent = m.agent;
    const maxS = Math.max(...m.users.map(item => item.sessions)), maxC = Math.max(...m.tools.map(item => item.calls));
    const ys = (n, i) => n === 1 ? 230 : 64 + i * (332 / (n - 1));
    const lines = [...m.users.map((item, i) => `<line x1="190" y1="${ys(m.users.length, i)}" x2="404" y2="230" stroke-width="${(1.5 + item.sessions / maxS * 7).toFixed(1)}"/>`), ...m.tools.map((item, i) => `<line class="${item.flagged ? 'flag' : ''}" x1="496" y1="230" x2="710" y2="${ys(m.tools.length, i)}" stroke-width="${(1.5 + item.calls / maxC * 7).toFixed(1)}"/>`)].join('');
    const userNodes = m.users.map((item, i) => `<g class="a365-sn ${st.mapNode === 'user:' + item.name ? 'on' : ''}" tabindex="0" role="button" data-a365-node="user:${esc(item.name)}" aria-label="User ${esc(item.name)}, ${item.sessions} sessions"><rect x="20" y="${ys(m.users.length, i) - 18}" width="170" height="36" rx="6"/><text x="34" y="${ys(m.users.length, i) + 4}">${esc(item.name)}</text></g>`).join('');
    const toolNodes = m.tools.map((item, i) => `<g class="a365-sn ${item.flagged ? 'flag' : ''} ${st.mapNode === 'tool:' + item.name ? 'on' : ''}" tabindex="0" role="button" data-a365-node="tool:${esc(item.name)}" aria-label="Tool ${esc(item.name)}, ${fmt(item.calls)} calls, ${item.exc}% exceptions"><rect x="710" y="${ys(m.tools.length, i) - 18}" width="190" height="36" rx="6"/><text x="724" y="${ys(m.tools.length, i) + 4}">${esc(item.name.length > 24 ? item.name.slice(0, 23) + '…' : item.name)}</text></g>`).join('');
    const node = st.mapNode ? st.mapNode.split(/:(.*)/s) : null;
    let detail = `<strong>${esc(agent.name)}</strong><span>${fmt(agent.activity.activeUsers)} users · ${fmt(agent.activity.sessions)} sessions · ${agent.activity.exceptionRate}% exceptions in the last 30 days.</span>`;
    if (node?.[0] === 'user') { const u = m.users.find(item => item.name === node[1]); detail = `<strong>${esc(u.name)}</strong><span>${fmt(u.sessions)} sessions with this agent in the last 30 days. Thicker lines mean more interaction.</span>`; }
    if (node?.[0] === 'tool') { const t = m.tools.find(item => item.name === node[1]); detail = `<strong>${esc(t.name)}</strong><span>${esc(t.kind)} · ${fmt(t.calls)} tool calls · ${t.exc}% exception rate${t.flagged ? '. Highlighted because the rate is above 1%.' : '.'}</span>`; }
    return `<div class="a365-single"><div class="a365-singlehead"><button class="a365-btn ghost" data-a365-back-map>${icon('fa-arrow-left')} Back to map</button><span class="a365-preview">Single agent map (preview)</span><small>Top users and tools from Agent 365 observability data · last 30 days</small></div>
      <svg class="a365-svg" viewBox="0 0 920 460" role="group" aria-label="Connections between ${esc(agent.name)}, its users and its tools"><g class="lines">${lines}</g><g class="center"><circle cx="450" cy="230" r="46"/><text x="450" y="236" text-anchor="middle">${esc(initials(agent.name))}</text></g><text class="cap" x="450" y="298" text-anchor="middle">${esc(agent.name)}</text><text class="cap" x="105" y="26" text-anchor="middle">Users</text><text class="cap" x="805" y="26" text-anchor="middle">Tools</text>${userNodes}${toolNodes}</svg>
      <div class="a365-nodedetail" aria-live="polite">${detail}</div></div>`;
  }
  function registryHtml() {
    const tabs = [['registry', 'Registry'], ['requests', `Requests${store.summary().pending ? ` (${store.summary().pending})` : ''}`], ['map', 'Map']];
    const body = st.tab === 'registry' ? tableHtml() : st.tab === 'requests' ? requestsHtml() : mapHtml();
    return `<div class="a365-tabs" role="tablist" aria-label="Agent views">${tabs.map(([key, name]) => `<button role="tab" aria-selected="${st.tab === key}" class="${st.tab === key ? 'on' : ''}" data-a365-tab="${key}">${name}</button>`).join('')}</div>${st.single ? '' : summaryTiles()}${st.tab === 'requests' || st.single ? '' : toolbarHtml()}<div id="a365-list">${body}</div>`;
  }

  /* ---------- settings ---------- */
  function settingsHtml() {
    return `<section class="a365-set"><h2 class="a365-h2">Policy templates</h2><p class="a365-lede">Templates bundle identity, data and threat protections so every new agent starts with the same guardrails. Sample templates, read-only.</p><div class="a365-templates">${Agent365.templates.map(item => `<article class="a365-card"><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><small>${item.appliesTo} agents use this template</small></article>`).join('')}</div>
      <h2 class="a365-h2">Governance rules</h2><p class="a365-lede">Rules-based management applies lifecycle policy automatically. Toggling a rule here only changes this demo session.</p><div class="a365-rules">${store.rules().map(rule => `<div class="a365-rule"><div><strong>${esc(rule.name)}</strong><span>${esc(rule.description)}</span></div><button class="a365-switch ${rule.enabled ? 'on' : ''}" role="switch" aria-checked="${rule.enabled}" aria-label="${esc(rule.name)}" data-a365-rule="${rule.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}><i></i></button></div>`).join('')}</div>
      <h2 class="a365-h2">Registry sync</h2><div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Platform</th><th>Status</th><th>Agents found</th><th>Last scan</th></tr></thead><tbody>${Agent365.platformsConnected.map(item => `<tr><td>${esc(item.name)}</td><td>${statusBadge(item.connected ? 'Available' : 'Not activated').replace('Available', 'Connected').replace('Not activated', 'Not connected')}</td><td>${item.agents}</td><td>${esc(item.last)}</td></tr>`).join('')}</tbody></table></div>
      <h2 class="a365-h2">Admin activity in this session</h2>${store.log().length ? `<div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Time</th><th>Agent</th><th>Action</th><th>Detail</th></tr></thead><tbody>${store.log().map(item => `<tr><td>${esc(item.time)}</td><td>${esc(item.agent)}</td><td>${esc(item.action)}</td><td>${esc(item.detail)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="a365-lede">No actions yet. Block, approve, assign or pin an agent to see entries here.</p>'}
      <p class="a365-disc">This log is a local demo record, not Microsoft Purview Audit. Nothing is sent to a tenant and the log clears when you leave this page.</p></section>`;
  }

  /* ---------- panels ---------- */
  const fact = (name, value) => `<div><dt>${name}</dt><dd>${value}</dd></div>`;
  function actionButtons(agent) {
    const allowed = store.actionsFor(agent.id);
    const labels = { block: ['Block', 'fa-ban'], unblock: ['Unblock', 'fa-rotate-left'], 'assign-owner': ['Assign new owner', 'fa-user-plus'], delete: ['Delete', 'fa-trash'], remove: ['Remove', 'fa-trash'], install: ['Install', 'fa-download'], pin: ['Pin for users', 'fa-thumbtack'], unpin: ['Unpin', 'fa-thumbtack'] };
    if (!allowed.length) return '<span class="a365-muted">No admin actions are available in this state.</span>';
    return allowed.map(action => `<button class="a365-btn ${action === 'block' || action === 'delete' || action === 'remove' ? 'danger' : ''}" data-a365-act="${action}" data-id="${agent.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>${icon(labels[action][1])} ${labels[action][0]}</button>`).join('');
  }
  function riskSections(agent) {
    if (!agent.risks.length) return '<p class="a365-muted">No active risk signals across connected platforms.</p>';
    return ['High', 'Medium', 'Low'].map(sev => { const items = agent.risks.filter(item => item.sev === sev); if (!items.length) return ''; const open = st.openRisk === sev; return `<section class="a365-rsec ${sev.toLowerCase()}"><button data-a365-sev="${sev}" aria-expanded="${open}">${icon(open ? 'fa-chevron-down' : 'fa-chevron-right')} <b>${sev}</b><span>${items.length} ${items.length === 1 ? 'signal' : 'signals'}</span></button>${open ? `<ul>${items.map(item => `<li><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p><small>Source: ${esc(item.source)} · ${item.occ} ${item.occ === 1 ? 'occurrence' : 'occurrences'}</small></li>`).join('')}</ul>` : ''}</section>`; }).join('') + '<p class="a365-disc">Source links open the owning security portal in a real tenant, subject to the viewer’s roles. They are not connected in this demo.</p>';
  }
  function agentPane(agent) {
    const tabs = [['details', 'Details'], ['users', 'Users'], ['data', 'Data and tools'], ['security', 'Security'], ['activity', 'Activity']];
    let body = '';
    if (st.paneTab === 'details') body = `<p>${esc(agent.description)}</p><dl class="a365-facts">${fact('Publisher', esc(label(agent.publisher)))}${fact('Agent type', esc(agent.type))}${fact('Platform', esc(agent.platform))}${fact('Owner', agent.owner ? esc(agent.owner) : '<span class="a365-noowner">No owner</span>')}${fact('Version', esc(agent.version))}${fact('Last updated', dateText(agent.modified))}${fact('Created', dateText(agent.created))}${fact('Channels', esc(agent.channels.join(', ')))}${fact('Deployed to', esc(agent.deployedTo))}${fact('Managed by Agent 365', agent.managed ? 'Yes' : 'No, discovered through registry sync')}${agent.policyTemplate ? fact('Policy template', esc(agent.policyTemplate)) : ''}${fact('Agent ID', esc(agent.id))}</dl>`;
    if (st.paneTab === 'users') body = `<dl class="a365-facts">${fact('Deployed to', esc(agent.deployedTo))}${fact('Active users (30 days)', fmt(agent.activity.activeUsers))}${fact('Sessions (30 days)', fmt(agent.activity.sessions))}</dl>${agent.sdk ? `<h4>Top users</h4><ul class="a365-plain">${agent.topUsers.map(([name, count]) => `<li>${esc(name)}<b>${count} sessions</b></li>`).join('')}</ul>` : '<p class="a365-muted">Per-user activity appears for agents that report observability data through Agent 365.</p>'}`;
    if (st.paneTab === 'data') body = `<dl class="a365-facts">${fact('Data sources', agent.dataSources.length ? esc(agent.dataSources.join(', ')) : 'None declared')}${fact('Knowledge', agent.knowledge.length ? esc(agent.knowledge.join(', ')) : 'None declared')}</dl>${agent.tools.length ? `<h4>Tools called in the last 30 days</h4><table class="a365-mini"><thead><tr><th>Tool</th><th>Calls</th><th>Exceptions</th></tr></thead><tbody>${agent.tools.map(item => `<tr class="${item.exc > 1 ? 'flag' : ''}"><td>${esc(item.name)}<small>${esc(item.kind)}</small></td><td>${fmt(item.calls)}</td><td>${item.exc}%</td></tr>`).join('')}</tbody></table>` : '<p class="a365-muted">Tool-level data appears for agents extended with the Agent 365 SDK.</p>'}`;
    if (st.paneTab === 'security') body = `<h4>Risk signals</h4>${riskSections(agent)}`;
    if (st.paneTab === 'activity') { const entries = store.log().filter(item => item.agentId === agent.id); body = `<dl class="a365-facts">${fact('Active users', fmt(agent.activity.activeUsers))}${fact('Sessions', fmt(agent.activity.sessions))}${fact('Exception rate', `${agent.activity.exceptionRate}%`)}${fact('Assisted hours', fmt(agent.activity.hours))}</dl>${agent.sdk ? `<button class="a365-btn" data-a365-single="${agent.id}">${icon('fa-diagram-project')} All connections</button>` : '<p class="a365-muted">The single agent map needs observability data from the Agent 365 SDK.</p>'}<h4>Admin actions this session</h4>${entries.length ? `<ul class="a365-plain">${entries.map(item => `<li><span>${esc(item.action)}<small>${esc(item.time)}</small></span></li>`).join('')}</ul>` : '<p class="a365-muted">None yet.</p>'}`; }
    return `<header><div class="a365-phead">${avatar(agent)}<div><h2 id="a365-ptitle" tabindex="-1">${esc(agent.name)}</h2><span>${esc(label(agent.publisher))} · ${esc(agent.type)}</span></div>${statusBadge(agent.status)}</div><button class="a365-x" data-a365-close aria-label="Close agent details">${icon('fa-xmark')}</button></header>
      <div class="a365-pactions">${actionButtons(agent)}</div><div class="a365-ptabs" role="tablist" aria-label="Agent details">${tabs.map(([key, name]) => `<button role="tab" aria-selected="${st.paneTab === key}" class="${st.paneTab === key ? 'on' : ''}" data-a365-ptab="${key}">${name}</button>`).join('')}</div><div class="a365-pbody">${body}</div>`;
  }
  function pinsPane() {
    const pinned = store.pinned(), eligible = store.list({ status: 'Available' }).filter(agent => agent.deployedTo !== 'Not deployed' && !agent.pinned);
    return `<header><div class="a365-phead"><span class="a365-ava org">${icon('fa-thumbtack')}</span><div><h2 id="a365-ptitle" tabindex="-1">Pinned agents</h2><span>Shown first in Copilot for the audience each agent is deployed to</span></div></div><button class="a365-x" data-a365-close aria-label="Close pinned agents">${icon('fa-xmark')}</button></header>
      <div class="a365-pbody"><h4>Pinned by your org (${pinned.length} of ${Agent365.MAX_PINNED})</h4>${pinned.length ? `<ol class="a365-pinlist">${pinned.map((agent, index) => `<li><span>${index + 1}</span><div><b>${esc(agent.name)}</b><small>${esc(agent.deployedTo)}</small></div><button class="a365-btn ghost" data-a365-move="up" data-id="${agent.id}" aria-label="Move ${esc(agent.name)} up" ${index === 0 || !can() ? 'disabled' : ''}>${icon('fa-arrow-up')}</button><button class="a365-btn ghost" data-a365-move="down" data-id="${agent.id}" aria-label="Move ${esc(agent.name)} down" ${index === pinned.length - 1 || !can() ? 'disabled' : ''}>${icon('fa-arrow-down')}</button><button class="a365-btn" data-a365-act="unpin" data-id="${agent.id}" ${can() ? '' : 'disabled'}>Unpin</button></li>`).join('')}</ol>` : '<p class="a365-muted">No agents are pinned by your organization.</p>'}
      <h4>Pinned by Microsoft</h4><ul class="a365-plain"><li>Researcher<b>Locked</b></li><li>Analyst<b>Locked</b></li></ul><p class="a365-muted">Users can’t unpin Microsoft-pinned or admin-pinned agents. Changes can take up to six hours to reach users.</p>
      <h4>Pin an agent</h4>${store.canPinMore() ? (eligible.length ? `<ul class="a365-plain">${eligible.map(agent => `<li><span>${esc(agent.name)}<small>${esc(agent.deployedTo)}</small></span><button class="a365-btn" data-a365-act="pin" data-id="${agent.id}" ${can() ? '' : 'disabled'}>Pin</button></li>`).join('')}</ul>` : '<p class="a365-muted">No deployed, available agents are left to pin.</p>') : '<p class="a365-muted">You can pin up to three agents. Unpin one to pin another. Only deployed agents that aren’t blocked can be pinned.</p>'}</div>`;
  }
  function riskPane(agent) {
    return `<header><div class="a365-phead">${avatar(agent)}<div><h2 id="a365-ptitle" tabindex="-1">Risk details</h2><span>${esc(agent.name)}</span></div></div><button class="a365-x" data-a365-close aria-label="Close risk details">${icon('fa-xmark')}</button></header><div class="a365-pbody"><p class="a365-muted">${Agent365.riskCount(agent)} signals across ${[...new Set(agent.risks.map(item => item.source))].length} platforms. Counts can trail the security portals by up to an hour.</p>${riskSections(agent)}<button class="a365-btn" data-a365-open="${agent.id}">${icon('fa-circle-info')} Open agent details</button></div>`;
  }
  function panelHtml() {
    if (!st.panel) return '';
    const inner = st.panel === 'pins' ? pinsPane() : agentSafe(agent => st.panel === 'risk' ? riskPane(agent) : agentPane(agent));
    return `<div class="a365-shade" data-a365-close></div><aside class="a365-panel" role="dialog" aria-modal="false" aria-labelledby="a365-ptitle">${inner}</aside>`;
  }
  const agentSafe = render => { try { return render(store.get(st.selected)); } catch { st.panel = null; return ''; } };

  /* ---------- dialogs ---------- */
  function dialogHtml() {
    const d = st.dialog;
    if (!d) return '';
    const wrap = (title, body, foot) => `<div class="a365-modalshade" data-a365-dialog-close></div><div class="a365-modal" role="dialog" aria-modal="true" aria-labelledby="a365-dtitle"><h2 id="a365-dtitle" tabindex="-1">${title}</h2><div class="a365-mbody">${body}</div><div class="a365-mfoot">${foot}</div></div>`;
    if (d.type === 'owner') return wrap('Assign new owner', `<p>Choose who is accountable for <b>${esc(store.get(d.id).name)}</b>.</p><label class="a365-field">Owner<select id="a365-owner">${OWNERS.map(name => `<option>${name}</option>`).join('')}</select></label>`, `<button class="a365-btn primary" data-a365-confirm>Assign owner</button><button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
    if (d.type === 'install') return wrap('Install agent', `<p>Deploy <b>${esc(store.get(d.id).name)}</b> to the people who should have it.</p><label class="a365-field">Audience<select id="a365-audience">${AUDIENCES.map(name => `<option>${name}</option>`).join('')}</select></label>`, `<button class="a365-btn primary" data-a365-confirm>Install</button><button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
    if (d.type === 'confirm') {
      const agent = store.get(d.id), copy = { block: `Members of your organization won’t be able to install or use <b>${esc(agent.name)}</b>, and it is removed from anyone who already installed it.`, delete: `<b>${esc(agent.name)}</b> is deleted from the registry. This can’t be undone in a tenant.`, remove: `<b>${esc(agent.name)}</b> is removed from the registry. Other registry entries for the same agent aren’t affected.` }[d.action];
      return wrap(`${{ block: 'Block', delete: 'Delete', remove: 'Remove' }[d.action]} this agent?`, `<p>${copy}</p><p class="a365-muted">Demo only: nothing changes in a tenant.</p>`, `<button class="a365-btn danger" data-a365-confirm>${{ block: 'Block', delete: 'Delete', remove: 'Remove' }[d.action]}</button><button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
    }
    if (d.type === 'columns') return wrap('Customize view', `<p>Choose the columns shown in the agent list. Name is always shown.</p><div class="a365-checks">${COLS.map(([key, name]) => `<label><input type="checkbox" data-a365-col="${key}" ${st.cols[key] ? 'checked' : ''}> ${name}</label>`).join('')}</div>`, `<button class="a365-btn primary" data-a365-dialog-close>Done</button>`);
    if (d.type === 'wizard') return wizardDialog(wrap);
    return '';
  }
  function wizardDialog(wrap) {
    const w = st.wizard, steps = ['Upload', 'Publish', 'Deploy', 'Protect', 'Permissions', 'Review'];
    const opt = (id, value, list) => `<label class="a365-field">${id}<select data-a365-wiz="${value}">${list.map(item => `<option ${w[value] === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label>`;
    const body = [
      `<p>Upload an agent package (.zip). The package is validated before you continue.</p>${w.uploaded ? `<div class="a365-file ok">${icon('fa-file-zipper')}<div><b>Contoso-Facilities-Agent.zip</b><small>Validated · Facilities Request Agent v1.0.0 · hosts: Teams, Copilot</small></div>${icon('fa-circle-check')}</div>` : `<button class="a365-btn" data-a365-wiz-upload>${icon('fa-file-arrow-up')} Choose sample package</button><p class="a365-muted">This demo offers one fictional package. No file is read from your device.</p>`}`,
      `<p>Choose who can install the agent.</p>${opt('Publish to', 'publish', ['Everyone in the organization', 'Specific users or groups', 'Just me'])}`,
      `<p>Optionally preinstall the agent for an audience. You can start with a small test group.</p>${opt('Deploy to', 'deploy', ['No one yet', ...AUDIENCES])}`,
      `<p>Apply a policy template. Default policies and protections are managed through each security platform, and might not be enabled.</p>${opt('Policy template', 'template', Agent365.templates.map(item => item.name))}`,
      `<p>Review what the agent asks to do.</p><ul class="a365-plain"><li>Read the signed-in user’s profile<b>Delegated</b></li><li>Read files the user can already access<b>Delegated</b></li><li>Post messages in Teams as the agent<b>Application</b></li></ul>`,
      `<dl class="a365-facts">${fact('Agent', 'Facilities Request Agent')}${fact('Publish to', esc(w.publish))}${fact('Deploy to', esc(w.deploy))}${fact('Policy template', esc(w.template))}</dl><p class="a365-muted">Finishing adds the agent to this demo registry only.</p>`
    ][w.step];
    const last = w.step === steps.length - 1;
    return wrap('Add agent', `<ol class="a365-steps">${steps.map((name, index) => `<li class="${index === w.step ? 'on' : index < w.step ? 'done' : ''}">${name}</li>`).join('')}</ol>${body}`, `<button class="a365-btn primary" data-a365-wiz-next ${w.step === 0 && !w.uploaded ? 'disabled' : ''}>${last ? 'Finish deployment' : 'Next'}</button>${w.step > 0 ? '<button class="a365-btn" data-a365-wiz-back>Back</button>' : ''}<button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
  }

  /* ---------- rendering and events ---------- */
  function pageHtml() { return st.page === 'overview' ? overviewHtml() : st.page === 'registry' ? registryHtml() : settingsHtml(); }
  function render(focus = '') {
    if (!root?.isConnected) return;
    root.className = 'a365-root';
    root.innerHTML = `<div class="a365">${navHtml()}<section class="a365-main" aria-label="Agents">${headerHtml()}<div class="a365-page">${pageHtml()}</div></section>${panelHtml()}${dialogHtml()}<div class="a365-toast ${st.toast ? 'on' : ''}" role="status" aria-live="polite">${esc(st.toast)}</div></div>`;
    if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
  }
  function refreshList() { const list = root.querySelector('#a365-list'); if (!list) return; const body = st.tab === 'registry' ? tableHtml() : st.tab === 'map' ? mapHtml() : requestsHtml(); list.innerHTML = body; }
  function toast(message) { st.toast = message; const element = root.querySelector('.a365-toast'); if (element) { element.textContent = message; element.classList.add('on'); } clearTimeout(toastTimer); toastTimer = setTimeout(() => { st.toast = ''; root?.querySelector('.a365-toast')?.classList.remove('on'); }, 4200); }
  const closeAll = () => { st.panel = null; st.dialog = null; };
  function go(target) {
    closeAll(); st.single = null; st.mapNode = null; st.card = '';
    if (target === 'settings') { st.page = 'settings'; return; }
    if (target === 'registry') { st.page = 'registry'; st.tab = 'registry'; st.filters = {}; return; }
    st.page = 'registry'; st.tab = target === 'requests' ? 'requests' : 'registry'; st.filters = {};
    if (CARD_FILTERS[target]) { st.filters = { ...CARD_FILTERS[target] }; st.card = target; }
  }
  function perform(id, action, payload) {
    try {
      const before = store.get(id).name;
      store.act(id, action, payload);
      const words = { block: 'blocked', unblock: 'unblocked', 'assign-owner': 'has a new owner', delete: 'deleted', remove: 'removed', install: 'installed', pin: 'pinned', unpin: 'unpinned' }[action];
      if (action === 'delete' || action === 'remove') st.panel = null;
      st.dialog = null; render('#a365-ptitle'); toast(`${before} ${words}. Recorded locally; nothing changed in a tenant.`);
    } catch (error) { st.dialog = null; render(); toast(error.message); }
  }
  function onClick(event) {
    const t = event.target.closest('[data-a365-node]');
    if (t) { st.mapNode = t.dataset.a365Node; render(); return; }
    const b = event.target.closest('button, .a365-shade, .a365-modalshade');
    if (!b || !root.contains(b)) return;
    const d = b.dataset;
    if (d.a365Page) { go(d.a365Page); render('.a365-main h1'); return; }
    if (d.a365Go) { go(d.a365Go); render('.a365-main h1'); return; }
    if (d.a365Tab) { st.tab = d.a365Tab; st.single = null; render('.a365-tabs .on'); return; }
    if (d.a365Card !== undefined) { const key = d.a365Card; st.card = st.card === key || key === 'total' ? '' : key; st.filters = st.card ? { ...CARD_FILTERS[st.card] } : {}; render(`[data-a365-card="${key}"]`); return; }
    if (d.a365Clear !== undefined) { st.filters = {}; st.card = ''; render('#a365-search'); return; }
    if (d.a365Sort) { const key = d.a365Sort; st.sort = { key, dir: st.sort.key === key && st.sort.dir === 'asc' ? 'desc' : 'asc' }; render(`[data-a365-sort="${key}"]`); return; }
    if (d.a365Open) { st.selected = d.a365Open; st.panel = 'agent'; st.paneTab = 'details'; render('#a365-ptitle'); return; }
    if (d.a365Risk) { st.selected = d.a365Risk; st.panel = 'risk'; st.openRisk = store.get(d.a365Risk).risks.some(item => item.sev === 'High') ? 'High' : sevOf(store.get(d.a365Risk)); render('#a365-ptitle'); return; }
    if (d.a365Ptab) { st.paneTab = d.a365Ptab; render(`[data-a365-ptab="${d.a365Ptab}"]`); return; }
    if (d.a365Sev) { st.openRisk = st.openRisk === d.a365Sev ? '' : d.a365Sev; render(`[data-a365-sev="${d.a365Sev}"]`); return; }
    if (d.a365Close !== undefined) { st.panel = null; render(); return; }
    if (d.a365DialogClose !== undefined) { st.dialog = null; render(); return; }
    if (d.a365Refresh !== undefined) { refreshList(); toast('Registry refreshed. The sample snapshot is fixed at Nov 2, 2026, 09:42 UTC.'); return; }
    if (d.a365Export !== undefined) { exportCsv(); return; }
    if (d.a365Add !== undefined) { st.wizard = { ...fresh().wizard }; st.dialog = { type: 'wizard' }; render('#a365-dtitle'); return; }
    if (d.a365Pins !== undefined) { st.panel = 'pins'; render('#a365-ptitle'); return; }
    if (d.a365Columns !== undefined) { st.dialog = { type: 'columns' }; render('#a365-dtitle'); return; }
    if (d.a365Density !== undefined) { st.compact = !st.compact; render('[data-a365-density]'); return; }
    if (d.a365Act) {
      const action = d.a365Act;
      if (action === 'assign-owner') { st.dialog = { type: 'owner', id: d.id }; render('#a365-dtitle'); }
      else if (action === 'install') { st.dialog = { type: 'install', id: d.id }; render('#a365-dtitle'); }
      else if (['block', 'delete', 'remove'].includes(action)) { st.dialog = { type: 'confirm', action, id: d.id }; render('#a365-dtitle'); }
      else perform(d.id, action);
      return;
    }
    if (d.a365Confirm !== undefined) {
      const dialog = st.dialog;
      if (dialog.type === 'owner') perform(dialog.id, 'assign-owner', { owner: root.querySelector('#a365-owner').value });
      else if (dialog.type === 'install') perform(dialog.id, 'install', { scope: root.querySelector('#a365-audience').value });
      else perform(dialog.id, dialog.action);
      return;
    }
    if (d.a365Move) { store.movePin(d.id, d.a365Move); render('#a365-ptitle'); toast('Pin order updated. Recorded locally.'); return; }
    if (d.a365Decide) { try { const agent = store.decide(d.id, d.a365Decide); render(); toast(`${agent.name} ${d.a365Decide === 'approve' ? 'approved and published' : 'request rejected'}. Recorded locally.`); } catch (error) { toast(error.message); } return; }
    if (d.a365Single) { st.single = d.a365Single; st.mapNode = null; st.page = 'registry'; st.tab = 'map'; st.panel = null; render('.a365-singlehead button'); return; }
    if (d.a365BackMap !== undefined) { st.single = null; st.mapNode = null; render('.a365-tabs .on'); return; }
    if (d.a365Rule) { store.toggleRule(d.a365Rule); render(`[data-a365-rule="${d.a365Rule}"]`); toast('Rule updated for this demo session only.'); return; }
    if (d.a365WizUpload !== undefined) { st.wizard.uploaded = true; render('[data-a365-wiz-next]'); return; }
    if (d.a365WizBack !== undefined) { st.wizard.step -= 1; render('#a365-dtitle'); return; }
    if (d.a365WizNext !== undefined) {
      if (st.wizard.step < 5) { st.wizard.step += 1; render('#a365-dtitle'); return; }
      try {
        const w = st.wizard, agent = store.addAgent({ name: 'Facilities Request Agent', description: 'Handles facilities requests from Teams and Copilot. Added from an uploaded package.', scope: w.deploy === 'No one yet' ? 'Not deployed' : w.deploy, template: w.template });
        st.dialog = null; st.page = 'registry'; st.tab = 'registry'; st.filters = {}; st.card = ''; st.selected = agent.id; st.panel = 'agent'; st.paneTab = 'details'; render('#a365-ptitle'); toast('Facilities Request Agent added to the demo registry.');
      } catch (error) { st.dialog = null; render(); toast(error.message); }
    }
  }
  function exportCsv() {
    const csv = store.exportCsv(st.filters);
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'contoso-agent-registry-sample.csv'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Exported the agents currently shown as CSV (sample data).');
  }
  function onChange(event) {
    const t = event.target;
    if (t.dataset.a365Filter !== undefined) { st.filters = { ...st.filters, [t.dataset.a365Filter]: t.value }; st.card = ''; render(`[data-a365-filter="${t.dataset.a365Filter}"]`); }
    else if (t.dataset.a365Role !== undefined) { st.role = t.value; render('[data-a365-role]'); }
    else if (t.dataset.a365Col) { st.cols[t.dataset.a365Col] = t.checked ? 1 : 0; render(`[data-a365-col="${t.dataset.a365Col}"]`); }
    else if (t.dataset.a365Wiz) { st.wizard[t.dataset.a365Wiz] = t.value; }
  }
  function onInput(event) {
    if (event.target.id !== 'a365-search') return;
    st.filters = { ...st.filters, query: event.target.value };
    refreshList();
  }
  function onKey(event) {
    if (!root?.isConnected) return;
    if (event.key === 'Escape' && (st.dialog || st.panel)) { event.preventDefault(); if (st.dialog) st.dialog = null; else st.panel = null; render(); return; }
    const node = event.target.closest?.('[data-a365-node]');
    if (node && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); st.mapNode = node.dataset.a365Node; render(`[data-a365-node="${CSS.escape(node.dataset.a365Node)}"]`); }
  }
  function unmount() { clearTimeout(toastTimer); if (root) { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('input', onInput); } document.removeEventListener('keydown', onKey); root = null; }
  function mount(element) {
    unmount(); root = element; store = Agent365.createStore(); st = fresh();
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); document.addEventListener('keydown', onKey);
    render();
  }
  return { mount, unmount };
})();
