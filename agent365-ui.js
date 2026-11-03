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
  const PAGE_SIZE = 50;
  const NOT_DEMO = 'This area of the admin center isn’t part of the Agent 365 demo.';

  let root = null, store = null, st = null, toastTimer = null, popNow = false, showLoader = false, drag = null;
  const fresh = () => ({ page: 'overview', tab: 'registry', filters: {}, card: '', sort: { key: 'name', dir: 'asc' }, pageNo: 0, cols: { status: 1, publisher: 1, platform: 1, owner: 1, channels: 0, risks: 1, version: 0, modified: 1 }, compact: false, panel: null, selected: null, paneTab: 'details', openRisk: 'High', single: null, mapNode: null, cluster: null, zoom: 1, pan: [0, 0], mapFilters: false, mapFull: false, pop: null, maxPer: 16, mapLoad: false, anim: false, fitPending: false, menu: null, navCollapsed: false, agentsOpen: true, resetScroll: true, role: 'ai-admin', dialog: null, wizard: { step: 0, uploaded: false, publish: 'Everyone in the organization', deploy: 'No one yet', template: 'Standard protection' }, toast: '' });
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

  /* ---------- product marks (original drawings, not Microsoft artwork) ---------- */
  const DEFS = '<svg class="a365-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><linearGradient id="a365-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f80f5"/><stop offset="1" stop-color="#2dd4b0"/></linearGradient><linearGradient id="a365-g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#f0508e"/></linearGradient><linearGradient id="a365-g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f5cf0"/><stop offset="1" stop-color="#d352e0"/></linearGradient><linearGradient id="a365-g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b5fe6"/><stop offset="1" stop-color="#5bb4ff"/></linearGradient></defs></svg>';
  const MARKS = {
    ms: '<rect x="3" y="3" width="12.5" height="12.5" fill="#f25022"/><rect x="16.5" y="3" width="12.5" height="12.5" fill="#7fba00"/><rect x="3" y="16.5" width="12.5" height="12.5" fill="#00a4ef"/><rect x="16.5" y="16.5" width="12.5" height="12.5" fill="#ffb900"/>',
    studio: '<rect x="4" y="10" width="17" height="17" rx="5" fill="url(#a365-g2)" transform="rotate(-14 12.5 18.5)"/><rect x="11" y="4" width="17" height="17" rx="5" fill="url(#a365-g1)" opacity=".93" transform="rotate(12 19.5 12.5)"/>',
    builder: '<rect x="4" y="10" width="17" height="17" rx="5" fill="url(#a365-g1)" transform="rotate(-14 12.5 18.5)"/><rect x="11" y="4" width="17" height="17" rx="5" fill="url(#a365-g3)" opacity=".93" transform="rotate(12 19.5 12.5)"/>',
    third: '<path d="M16 3l11 6.4v13.2L16 29 5 22.6V9.4z" fill="url(#a365-g3)"/><path d="M16 9.5l5.6 3.2v6.6L16 22.5l-5.6-3.2v-6.6z" fill="#fff" opacity=".88"/>',
    sharepoint: '<circle cx="17" cy="11" r="8" fill="#036c70"/><circle cx="22" cy="18" r="7" fill="#1a9ba1"/><circle cx="16" cy="23" r="5.5" fill="#37c6d0"/><rect x="3" y="8" width="15" height="15" rx="2.5" fill="#03787c"/><text x="10.5" y="19.6" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Segoe UI,Arial,sans-serif">S</text>',
    legacy: '<path d="M5 6h15a3 3 0 013 3v7a3 3 0 01-3 3h-6l-5 4v-4H5a3 3 0 01-3-3V9a3 3 0 013-3z" fill="#2f8fa8"/><path d="M13 12h14a3 3 0 013 3v7a3 3 0 01-3 3h-3v3.5l-4.6-3.5H13a3 3 0 01-3-3v-7a3 3 0 013-3z" fill="#6b4fb5" opacity=".93"/>',
    others: '<path d="M16 5l9 5.2v10.4L16 26l-9-5.4V10.2z" fill="url(#a365-g3)"/><circle cx="16" cy="15.4" r="3.4" fill="#fff" opacity=".88"/>',
    foundry: '<path d="M3 28L13.4 4h5.2L29 28h-6.2L16 11.8 9.2 28z" fill="url(#a365-g4)"/>'
  };
  const mark = (key, size) => `<svg class="a365-mark" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true" focusable="false">${MARKS[key]}</svg>`;
  const CLUSTER = {
    Microsoft: { ring: '#27a8dd', mark: 'ms', at: [-61, 9] }, 'Third party': { ring: '#7a6de6', mark: 'third', at: [-154, -82] }, 'Copilot Studio': { ring: '#f09a4d', mark: 'studio', at: [45, -74] },
    'Copilot Studio Legacy': { ring: '#8e56bd', mark: 'legacy', at: [-163, 65] }, 'Agent Builder': { ring: '#b24fd6', mark: 'builder', at: [146, 17] }, Foundry: { ring: '#2a6ee6', mark: 'foundry', at: [-62, 133] },
    SharePoint: { ring: '#1bb7c4', mark: 'sharepoint', at: [153, -150] }, 'Agents Toolkit': { ring: '#9bc02a', mark: 'ms', at: [-34, -178] }, Others: { ring: '#ec7fb0', mark: 'others', at: [38, 73] }
  };
  const clusterInfo = name => CLUSTER[name] || { ring: '#616161', mark: 'others', at: null };

  /* ---------- admin center chrome ---------- */
  function menuHtml() {
    if (!st.menu) return '';
    const shade = '<div class="a365-menushade" data-a365-menu-close></div>';
    if (st.menu === 'waffle') return `${shade}<div class="a365-menu left" role="menu" aria-label="Apps"><strong>Switch workspace</strong>${[['overview', 'fa-house', 'atQor security overview'], ['defender', 'fa-shield-halved', 'Microsoft Defender'], ['intune', 'fa-laptop', 'Microsoft Intune'], ['entra', 'fa-fingerprint', 'Microsoft Entra'], ['purview', 'fa-eye', 'Microsoft Purview'], ['copilot', 'fa-wand-magic-sparkles', 'Security Copilot']].map(([view, glyph, text]) => `<button role="menuitem" data-view="${view}">${icon(glyph)} ${text}</button>`).join('')}</div>`;
    if (st.menu === 'bell') { const s = store.summary(); return `${shade}<div class="a365-menu right" role="menu" aria-label="Notifications"><strong>Notifications</strong><button role="menuitem" data-a365-go="requests">${icon('fa-inbox')} ${s.pending} agent requests are waiting for approval</button><button role="menuitem" data-a365-go="risk">${icon('fa-triangle-exclamation')} ${fmt(s.atRisk)} agents have risk signals</button><button role="menuitem" data-a365-go="ownerless">${icon('fa-user-slash')} ${fmt(s.ownerless)} agents have no owner</button></div>`; }
    return `${shade}<div class="a365-menu right account" role="dialog" aria-label="Account"><div class="a365-acct"><span class="a365-avatar big">PS</span><div><strong>Priya Shah</strong><small>priya.shah@contoso.com</small></div></div><span class="a365-menulabel">Viewing as</span><button role="menuitemradio" aria-checked="${can()}" data-a365-setrole="ai-admin">${icon(can() ? 'fa-circle-dot' : 'fa-circle')} AI Administrator</button><button role="menuitemradio" aria-checked="${!can()}" data-a365-setrole="reader">${icon(can() ? 'fa-circle' : 'fa-circle-dot')} Global Reader (view only)</button><p>Sample data. No tenant connection and nothing is signed in.</p></div>`;
  }
  function topbarHtml() {
    const tb = (glyph, name) => `<button class="a365-ticon" data-a365-toast="${name} isn’t part of this demo." aria-label="${name}" title="${name}">${icon(glyph)}</button>`;
    const dark = document.body.classList.contains('dark');
    return `<header class="a365-top"><button class="a365-waffle" data-a365-menu="waffle" aria-label="App launcher" aria-expanded="${st.menu === 'waffle'}">${icon('fa-grip')}</button><span class="a365-brand">Microsoft 365 admin center</span>
      <form class="a365-gsearch" data-a365-gsearch role="search">${icon('fa-magnifying-glass')}<input name="q" placeholder="Search" aria-label="Search agents" autocomplete="off"></form>
      <div class="a365-topright"><button class="a365-tcopilot" data-a365-toast="Copilot in the admin center isn’t part of this demo.">${mark('studio', 18)} Copilot</button><span class="a365-vsep"></span>${tb('fa-terminal', 'Cloud Shell')}${tb('fa-file-lines', 'Reports')}<button class="a365-ticon" data-a365-theme aria-label="Switch theme" title="Switch theme">${icon(dark ? 'fa-sun' : 'fa-moon')}</button><button class="a365-ticon a365-bell" data-a365-menu="bell" aria-label="Notifications, 3 new" aria-expanded="${st.menu === 'bell'}">${icon('fa-bell')}<em>3</em></button><span class="a365-vsep"></span><span class="a365-orgname">Contoso</span>${tb('fa-gear', 'Settings')}${tb('fa-circle-question', 'Help')}<button class="a365-avatar" data-a365-menu="avatar" aria-label="Account: Priya Shah" aria-expanded="${st.menu === 'avatar'}">PS</button></div></header>`;
  }
  function navHtml() {
    const row = (glyph, text, extra = '', attrs = '') => `<button class="a365-ni" ${attrs}>${icon(glyph)}<span>${text}</span>${extra}</button>`;
    const stub = (glyph, text, chevron) => row(glyph, text, chevron ? icon('fa-chevron-down') : '', `data-a365-toast="${NOT_DEMO}"`);
    const child = (page, text) => `<button class="a365-nc ${st.page === page ? 'active' : ''}" data-a365-page="${page}" ${st.page === page ? 'aria-current="page"' : ''}>${text}</button>`;
    const kids = [['overview', 'Overview'], ['registry', 'All agents'], ['map', 'Agent map'], ['deleted', 'Deleted agents'], ['shadow', 'Shadow AI'], ['tools', 'Tools'], ['settings', 'Settings']];
    return `<nav class="a365-nav ${st.navCollapsed ? 'collapsed' : ''}" aria-label="Admin center navigation"><button class="a365-ni a365-burger" data-a365-navtoggle aria-label="Collapse navigation" aria-expanded="${!st.navCollapsed}">${icon('fa-bars')}</button>
      ${stub('fa-house', 'Home')}${stub('fa-user', 'Users', 1)}${stub('fa-wand-magic-sparkles', 'Copilot', 1)}
      ${row('fa-robot', 'Agents', icon(st.agentsOpen ? 'fa-chevron-up' : 'fa-chevron-down'), `data-a365-agents aria-expanded="${st.agentsOpen}"`)}
      ${st.agentsOpen && !st.navCollapsed ? `<div class="a365-kids">${kids.map(([page, text]) => child(page, text)).join('')}</div>` : ''}
      ${stub('fa-table-cells-large', 'Apps', 1)}${stub('fa-people-group', 'Teams &amp; groups', 1)}${stub('fa-cube', 'Resources', 1)}${stub('fa-bag-shopping', 'Marketplace')}${stub('fa-gear', 'Settings', 1)}${stub('fa-wrench', 'Setup', 1)}
      <hr>${stub('fa-pen', 'Customize navigation')}${stub('fa-ellipsis', 'Show all')}</nav>`;
  }
  function pageHeadHtml() {
    const names = { overview: ['Overview', 'Agent overview'], registry: ['All agents', 'All agents'], map: ['Agent map', 'Agent map'], deleted: ['Deleted agents', 'Deleted agents'], shadow: ['Shadow AI', 'Shadow AI'], tools: ['Tools', 'Tools'], settings: ['Settings', 'Agent settings'] };
    const ledes = { map: 'Visualize how agents are distributed across platforms. Explore connections, filter by status, and zoom into specific clusters to understand your agent ecosystem. <a href="https://learn.microsoft.com/en-us/microsoft-365/admin/manage/agent-map" target="_blank" rel="noopener noreferrer">Learn more.</a>', shadow: 'Agents found outside Agent 365 through registry sync, without its risk protection and observability.', tools: 'Connectors and MCP servers that your agents call, with exception rates from Agent 365 observability data.' };
    const [crumb, heading] = names[st.page];
    const badge = ['map', 'shadow', 'tools', 'overview'].includes(st.page) ? `<span class="a365-chip"><svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">${MARKS.foundry}</svg> Agent 365</span>` : '';
    return `<div class="a365-pagehead"><div class="a365-crumbs"><button data-a365-toast="${NOT_DEMO}">Home</button>${icon('fa-chevron-right')}<span>${crumb}</span></div><div class="a365-titlerow"><h1>${heading}</h1>${badge}<span class="a365-sim">${icon('fa-flask')} Sample data</span></div>${ledes[st.page] ? `<p class="a365-lede">${ledes[st.page]}</p>` : ''}</div>`;
  }

  /* ---------- overview ---------- */
  function lineChart(values) {
    const w = 620, h = 150, pad = 8, min = Math.min(...values) - 400, max = Math.max(...values) + 400;
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
      <section class="a365-actions" aria-label="Governance actions">${actions.map(([name, count, note, link, target, glyph]) => `<article class="a365-card a365-actioncard ${count ? '' : 'clear'}"><div class="a365-ic">${icon(glyph)}</div><div><span>${name}</span><strong>${fmt(count)}</strong><small>${note}</small></div><button class="a365-btn" data-a365-go="${target}">${link}</button></article>`).join('')}</section>
      <h2 class="a365-h2">Agent analytics</h2>
      <section class="a365-analytics"><article class="a365-card"><h3>Agents by creators</h3><div class="a365-stack" role="img" aria-label="Agents by creator: ${o.byPublisher.map(item => `${item.label} ${item.count}`).join(', ')}">${o.byPublisher.map(item => `<i class="${pubClass[item.name]}" style="flex:${item.count}"></i>`).join('')}</div><ul class="a365-legend">${o.byPublisher.map(item => `<li><i class="${pubClass[item.name]}"></i>${item.label}<b>${fmt(item.count)}</b></li>`).join('')}</ul><small>${fmt(total)} published or available agents. Drafts are not counted.</small></article>
        <article class="a365-card"><h3>Top platforms used to build agents</h3>${o.topPlatforms.map(item => `<div class="a365-bar"><span>${esc(item.name)}</span><div><i style="width:${Math.max(2, Math.round(item.count / top * 100))}%"></i></div><b>${fmt(item.count)}</b></div>`).join('')}<small>Only the five most used platforms are shown. Open the registry for all.</small></article>
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
    const tile = (key, name, value, note) => `<button class="a365-tile ${st.card === key ? 'on' : ''}" data-a365-card="${key}" aria-pressed="${st.card === key}"><span>${name}</span><strong>${fmt(value)}</strong><small>${note}</small></button>`;
    return `<section class="a365-tiles" aria-label="Registry summary">${tile('total', 'Total agents', s.total, 'Filters do not change this count')}${tile('risk', 'Agents at risk', s.atRisk, 'One or more risk signals')}${tile('ownerless', 'Agents without owners', s.ownerless, 'No active owner')}${tile('unmanaged', 'Unmanaged agents', s.unmanaged, 'Outside Agent 365 protection')}</section>`;
  }
  function tableHtml() {
    const all = store.list(st.filters, st.sort), cols = COLS.filter(([key]) => st.cols[key]);
    const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    st.pageNo = Math.min(st.pageNo, pages - 1);
    const rows = all.slice(st.pageNo * PAGE_SIZE, (st.pageNo + 1) * PAGE_SIZE);
    const head = (key, name) => `<th scope="col" aria-sort="${st.sort.key === key ? (st.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}">${SORTABLE.includes(key) ? `<button data-a365-sort="${key}">${name}${st.sort.key === key ? icon(st.sort.dir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : ''}</button>` : name}</th>`;
    if (!all.length) return `<div class="a365-empty">${icon('fa-filter-circle-xmark')}<strong>No agents match these filters</strong><span>Clear a filter or change the search text. The total agent count above is unchanged.</span></div>`;
    const from = st.pageNo * PAGE_SIZE + 1, to = from + rows.length - 1;
    const pager = `<div class="a365-pager"><span aria-live="polite">${fmt(from)}–${fmt(to)} of ${fmt(all.length)} agents</span><button class="a365-btn ghost" data-a365-pg="first" aria-label="First page" ${st.pageNo ? '' : 'disabled'}>${icon('fa-angles-left')}</button><button class="a365-btn ghost" data-a365-pg="prev" aria-label="Previous page" ${st.pageNo ? '' : 'disabled'}>${icon('fa-angle-left')}</button><span>Page ${st.pageNo + 1} of ${pages}</span><button class="a365-btn ghost" data-a365-pg="next" aria-label="Next page" ${st.pageNo < pages - 1 ? '' : 'disabled'}>${icon('fa-angle-right')}</button><button class="a365-btn ghost" data-a365-pg="last" aria-label="Last page" ${st.pageNo < pages - 1 ? '' : 'disabled'}>${icon('fa-angles-right')}</button></div>`;
    return `<div class="a365-tablewrap"><table class="a365-table ${st.compact ? 'compact' : ''}"><caption class="sr-only">${rows.length} agents on this page</caption><thead><tr>${head('name', 'Name')}${cols.map(([key, name]) => head(key, name)).join('')}</tr></thead><tbody>${rows.map(agent => `<tr class="${st.selected === agent.id && st.panel === 'agent' ? 'sel' : ''}"><td><button class="a365-name" data-a365-open="${agent.id}">${avatar(agent)}<span><b>${esc(agent.name)}</b><small>${esc(agent.type)}${agent.pinned ? ` · ${icon('fa-thumbtack')} Pinned` : ''}</small></span></button></td>${cols.map(([key]) => `<td>${cell(agent, key)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${pager}`;
  }
  function requestsHtml() {
    const list = store.requests();
    if (!list.length) return `<div class="a365-empty">${icon('fa-circle-check')}<strong>No pending requests</strong><span>Creators’ requests to publish agents widely appear here for approval.</span></div>`;
    return `<div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Agent</th><th>Requested by</th><th>Requested on</th><th>Audience</th><th>Note</th><th>Decision</th></tr></thead><tbody>${list.map(item => `<tr><td><button class="a365-name" data-a365-open="${item.agentId}"><b>${esc(item.agentName)}</b></button></td><td>${esc(item.requestedBy)}</td><td>${dateText(item.date)}</td><td>${esc(item.scope)}</td><td>${esc(item.note)}</td><td class="a365-rowactions"><button class="a365-btn primary" data-a365-decide="approve" data-id="${item.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>Approve</button><button class="a365-btn" data-a365-decide="reject" data-id="${item.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>Reject</button></td></tr>`).join('')}</tbody></table></div><p class="a365-count">Approving publishes the agent to the requested audience. Rejecting leaves it with its creator.</p>`;
  }
  function registryHtml() {
    const tabs = [['registry', 'Registry'], ['requests', `Requests${store.summary().pending ? ` (${store.summary().pending})` : ''}`]];
    const body = st.tab === 'registry' ? tableHtml() : requestsHtml();
    return `<div class="a365-tabs" role="tablist" aria-label="Agent views">${tabs.map(([key, name]) => `<button role="tab" aria-selected="${st.tab === key}" class="${st.tab === key ? 'on' : ''}" data-a365-tab="${key}">${name}</button>`).join('')}</div>${summaryTiles()}${st.tab === 'requests' ? '' : toolbarHtml()}<div id="a365-list">${body}</div>`;
  }

  /* ---------- agent map (bubble clusters) ---------- */
  function pack(items, pad = 32, squash = .8) {
    const placed = [];
    items.forEach((item, index) => {
      if (!index) { placed.push({ ...item, x: 0, y: 0 }); return; }
      let angle = index * 2.4, dist = item.r + placed[0].r + pad;
      for (let tries = 0; tries < 3000; tries += 1) {
        const x = Math.cos(angle) * dist, y = Math.sin(angle) * dist * squash;
        if (placed.every(other => Math.hypot(other.x - x, other.y - y) >= other.r + item.r + pad)) { placed.push({ ...item, x, y }); return; }
        angle += .3; dist += .9;
      }
      placed.push({ ...item, x: 0, y: 0 });
    });
    return placed;
  }
  const place = (item, extra = '') => `left:${item.x.toFixed(1)}px;top:${item.y.toFixed(1)}px;width:${item.r * 2}px;height:${item.r * 2}px;margin:${-item.r}px 0 0 ${-item.r}px;${extra}`;
  const clusterRadius = count => Math.round(27 + 6.3 * Math.log10(count + 1));
  function mapWorld() {
    const groups = store.map(st.filters);
    if (!groups.length) return { html: '', note: '', count: 0, groups: 0 };
    if (st.cluster && !groups.some(group => group.name === st.cluster)) st.cluster = null;
    const pop = popNow ? ' pop' : '';
    if (st.cluster) {
      const group = groups.find(item => item.name === st.cluster), info = clusterInfo(group.name);
      const sorted = [...group.agents].sort((x, y) => Agent365.riskCount(y) - Agent365.riskCount(x) || x.name.localeCompare(y.name)).slice(0, st.maxPer);
      const dense = sorted.length > 10, radius = dense ? 30 : 36;
      const placed = pack(sorted.map(agent => ({ agent, r: radius })), dense ? 64 : 58, .6);
      if (st.fitPending) {
        const xs = placed.map(item => item.x), ys = placed.map(item => item.y), margin = radius + 44;
        const w = Math.max(...xs) - Math.min(...xs) + margin * 2, h = Math.max(...ys) - Math.min(...ys) + margin * 2;
        const viewport = root?.querySelector('.a365-viewport'), vw = viewport?.clientWidth || 1000, vh = viewport?.clientHeight || 460;
        st.zoom = Math.max(.45, Math.min(1, +Math.min((vw - 60) / w, (vh - 110) / h).toFixed(2)));
        st.pan = [-(Math.max(...xs) + Math.min(...xs)) / 2 * st.zoom, -(Math.max(...ys) + Math.min(...ys)) / 2 * st.zoom + 20];
        st.fitPending = false;
      }
      const html = placed.map((item, index) => { const agent = item.agent, sev = sevOf(agent).toLowerCase(); return `<button class="a365-abub ${pubClass[agent.publisher]} ${sev} ${agent.owner ? '' : 'noowner'} ${agent.status === 'Blocked' ? 'blocked' : ''} ${agent.sdk ? 'sdk' : ''}${pop}" style="${place(item, `animation-delay:${Math.min(index, 30) * 25}ms`)}" data-a365-open="${agent.id}" aria-label="${esc(agent.name)}, ${esc(agent.status)}${sev ? ', ' + sev + ' risk signal' : ''}${agent.owner ? '' : ', no owner'}">${esc(initials(agent.name))}<span class="a365-bl">${esc(agent.name.length > 22 ? agent.name.slice(0, 21) + '…' : agent.name)}</span></button>`; }).join('');
      return { html, ring: info.ring, count: group.agents.length, groups: groups.length, note: group.agents.length > sorted.length ? `Showing ${sorted.length} of ${fmt(group.agents.length)} agents. Raise “Max agents per cluster” in settings to see more.` : '' };
    }
    const known = groups.filter(group => CLUSTER[group.name]), extra = groups.filter(group => !CLUSTER[group.name]);
    const placed = [...known.map(group => ({ group, r: clusterRadius(group.agents.length), x: CLUSTER[group.name].at[0], y: CLUSTER[group.name].at[1] })), ...pack(extra.map(group => ({ group, r: clusterRadius(group.agents.length) })), 34).map(item => ({ ...item, x: item.x + 230, y: item.y }))];
    const html = placed.map((item, index) => {
      const group = item.group, info = clusterInfo(group.name), risky = group.agents.filter(agent => Agent365.riskCount(agent)).length, text = `${group.name} (${group.agents.length})`;
      return `<button class="a365-bub${pop}" style="${place(item, `--c:${info.ring};animation-delay:${index * 45}ms`)}" data-a365-cluster="${esc(group.name)}" aria-label="${esc(text)}${risky ? `, ${fmt(risky)} with risk signals` : ''}. Open cluster">${mark(info.mark, Math.round(item.r * 1.04))}<span class="a365-bl" style="max-width:${Math.round(item.r * 2.8)}px">${esc(text)}</span></button>`;
    }).join('');
    return { html, ring: '', count: groups.reduce((total, group) => total + group.agents.length, 0), groups: groups.length, note: '' };
  }
  const worldStyle = () => `transform:translate(${st.pan[0]}px,${st.pan[1]}px) scale(${st.zoom})`;
  function applyView() { const world = root?.querySelector('.a365-world'); if (world) world.style.transform = worldStyle().replace('transform:', ''); }
  const zoomBy = delta => { st.zoom = Math.min(2.4, Math.max(.5, +(st.zoom + delta).toFixed(2))); applyView(); };
  function refreshWorld() { const world = root.querySelector('.a365-world'); if (!world) return; const view = mapWorld(); world.innerHTML = view.html; const note = root.querySelector('.a365-mapnote'); if (note) note.textContent = view.note; const value = root.querySelector('#a365-maxval'); if (value) value.textContent = st.maxPer; }
  function mapFilterPanel() {
    const f = st.filters, facets = store.facets();
    const select = (key, name, options) => `<label class="a365-sel"><span>${name}</span><select data-a365-filter="${key}"><option value="">All</option>${options.map(option => `<option value="${esc(option)}" ${f[key] === option ? 'selected' : ''}>${esc(key === 'publisher' ? label(option) : option)}</option>`).join('')}</select></label>`;
    const flag = (key, name, on) => `<label class="a365-flag"><input type="checkbox" data-a365-flag="${key}" ${on ? 'checked' : ''}> ${name}</label>`;
    return `<div class="a365-fpanel a365-floating" role="group" aria-label="Map filters"><header><strong>Filters</strong><button class="a365-x" data-a365-mapfilters aria-label="Close filters">${icon('fa-xmark')}</button></header>${select('status', 'Status', facets.status)}${select('publisher', 'Publisher type', facets.publisher)}${select('platform', 'Platform', facets.platform)}${select('channel', 'Channel', facets.channel)}${select('dataSource', 'Data source', facets.dataSource)}<div class="a365-flags"><span>Usage and security</span>${flag('risk', 'Has risk signals', f.risk === 'at-risk')}${flag('ownerless', 'Without owner', f.ownerless)}${flag('unmanaged', 'Unmanaged', f.unmanaged)}${flag('errors', 'Exception rate above 1%', f.errors)}</div>${Object.entries(f).some(([key, value]) => key !== 'query' && value) ? `<button class="a365-link" data-a365-clear>${icon('fa-xmark')} Clear filters</button>` : ''}</div>`;
  }
  function mapPopover() {
    if (st.pop === 'settings') return `<div class="a365-pop a365-floating" role="group" aria-label="Map settings"><strong>Settings</strong><label>Max agents per cluster <b id="a365-maxval">${st.maxPer}</b><input id="a365-max" type="range" min="4" max="100" value="${st.maxPer}"></label><small>Applies when you open a cluster. Large estates stay responsive.</small></div>`;
    if (st.pop === 'help') return `<div class="a365-pop a365-floating" role="group" aria-label="Keyboard shortcuts"><strong>Keyboard shortcuts</strong><dl><dt>+ / −</dt><dd>Zoom in or out</dd><dt>0</dt><dd>Fit to screen</dd><dt>Arrow keys</dt><dd>Pan the map</dd><dt>Esc</dt><dd>Close, or go back one level</dd></dl><small>Drag the background to pan. Select a cluster to open it, then an agent for details.</small></div>`;
    return '';
  }
  function mapPageHtml() {
    if (st.single) return `<div class="a365-mapcard single">${singleMapHtml()}</div>`;
    const view = mapWorld(), tool = (attr, glyph, name, extra = '') => `<button class="a365-tb" ${attr} aria-label="${name}" title="${name}" ${extra}>${icon(glyph)}</button>`;
    const tools = `<div class="a365-tools a365-floating" role="toolbar" aria-label="Map tools">${tool('data-a365-nothing', 'fa-arrow-pointer', 'Select', 'aria-pressed="true"')}${tool('data-a365-export', 'fa-file-export', 'Export agents shown')}${tool('data-a365-center', 'fa-crosshairs', 'Center map')}<span class="a365-tsep"></span>${tool('data-a365-zoom="in"', 'fa-plus', 'Zoom in')}${tool('data-a365-zoom="out"', 'fa-minus', 'Zoom out')}<span class="a365-tsep"></span>${tool('data-a365-fit', 'fa-expand', 'Fit to screen')}<span class="a365-tsep"></span>${tool('data-a365-pop="settings"', 'fa-gear', 'Settings', `aria-expanded="${st.pop === 'settings'}"`)}${tool('data-a365-pop="help"', 'fa-circle-question', 'Keyboard shortcuts', `aria-expanded="${st.pop === 'help'}"`)}${tool('data-a365-full', st.mapFull ? 'fa-compress' : 'fa-maximize', st.mapFull ? 'Exit full screen' : 'Full screen')}</div>`;
    const chip = st.cluster ? `<div class="a365-clusterbar a365-floating"><button class="a365-cback" data-a365-allclusters>${icon('fa-arrow-left')} All clusters</button><b style="--c:${view.ring}">${esc(st.cluster)} (${view.count})</b></div>` : '';
    const empty = view.html ? '' : `<div class="a365-empty a365-center">${icon('fa-filter-circle-xmark')}<strong>No agents match these filters</strong><span>Clear a filter to see the map again.</span></div>`;
    return `<div class="a365-mapcard ${st.mapFull ? 'full' : ''}"><div class="a365-maptabs"><span><i class="a365-tabmark"><svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">${MARKS.foundry}</svg></i> All agents</span></div>
      <div class="a365-viewport" role="region" aria-label="Agent clusters. Select a cluster to open it."><div class="a365-world" style="${worldStyle()}">${view.html}</div>${empty}
      ${st.mapFilters ? mapFilterPanel() : `<button class="a365-fbtn a365-floating" data-a365-mapfilters aria-expanded="false">Filters ${icon('fa-table-columns')}</button>`}${tools}${chip}${mapPopover()}
      <p class="a365-mapnote" aria-live="polite">${esc(view.note)}</p>${showLoader ? `<div class="a365-loading" role="status"><i class="a365-spin"></i> Loading more agents…</div>` : ''}</div></div>`;
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

  /* ---------- deleted, shadow AI, tools, settings ---------- */
  function deletedHtml() {
    const list = store.deleted();
    if (!list.length) return `<div class="a365-empty">${icon('fa-trash-can')}<strong>No deleted agents</strong><span>Agents you delete or remove in this demo session appear here, and can be restored.</span></div>`;
    return `<div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Name</th><th>Publisher type</th><th>Platform</th><th>Owner</th><th></th></tr></thead><tbody>${list.map(agent => `<tr><td><span class="a365-name">${avatar(agent)}<span><b>${esc(agent.name)}</b><small>${esc(agent.type)}</small></span></span></td><td>${esc(label(agent.publisher))}</td><td>${esc(agent.platform)}</td><td>${agent.owner ? esc(agent.owner) : '<span class="a365-noowner">No owner</span>'}</td><td><button class="a365-btn" data-a365-restore="${agent.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}>${icon('fa-rotate-left')} Restore</button></td></tr>`).join('')}</tbody></table></div><p class="a365-count">Deleted in this demo session. Restoring brings the agent back to the registry without its earlier pins.</p>`;
  }
  function shadowHtml() {
    const list = store.list({ unmanaged: true }, { key: 'risks', dir: 'desc' });
    return `<div class="a365-banner">${icon('fa-circle-info')}<span>${fmt(list.length)} agents were found outside Agent 365. They have no policy template, no risk protection and no observability data until they are brought under management.</span></div><div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Name</th><th>Platform</th><th>Owner</th><th>Risks</th><th>Last seen</th></tr></thead><tbody>${list.map(agent => `<tr><td><button class="a365-name" data-a365-open="${agent.id}">${avatar(agent)}<span><b>${esc(agent.name)}</b><small>${esc(agent.type)}</small></span></button></td><td>${esc(agent.platform)}</td><td>${agent.owner ? esc(agent.owner) : '<span class="a365-noowner">No owner</span>'}</td><td>${cell(agent, 'risks')}</td><td>${dateText(agent.modified)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function toolsHtml() {
    const list = store.tools();
    return `<div class="a365-banner">${icon('fa-circle-info')}<span>Tool data comes from agents extended with the Agent 365 SDK. Non-Microsoft tools are provided by their publishers; review what data you share with them.</span></div><div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Tool</th><th>Type</th><th>Agents using it</th><th>Calls (30 days)</th><th>Exception rate</th></tr></thead><tbody>${list.map(item => `<tr class="${item.exc > 1 ? 'flagrow' : ''}"><td><b>${esc(item.name)}</b></td><td>${esc(item.kind)}</td><td title="${esc(item.agents.join(', '))}">${item.agents.length}</td><td>${fmt(item.calls)}</td><td>${item.exc > 1 ? `<span class="a365-risk high">${icon('fa-triangle-exclamation')} ${item.exc}%</span>` : `${item.exc}%`}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function settingsHtml() {
    return `<section class="a365-set"><h2 class="a365-h2">Policy templates</h2><p class="a365-lede2">Templates bundle identity, data and threat protections so every new agent starts with the same guardrails. Sample templates, read-only.</p><div class="a365-templates">${Agent365.templates.map(item => `<article class="a365-card"><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><small>${fmt(item.appliesTo)} agents use this template</small></article>`).join('')}</div>
      <h2 class="a365-h2">Governance rules</h2><p class="a365-lede2">Rules-based management applies lifecycle policy automatically. Toggling a rule here only changes this demo session.</p><div class="a365-rules">${store.rules().map(rule => `<div class="a365-rule"><div><strong>${esc(rule.name)}</strong><span>${esc(rule.description)}</span></div><button class="a365-switch ${rule.enabled ? 'on' : ''}" role="switch" aria-checked="${rule.enabled}" aria-label="${esc(rule.name)}" data-a365-rule="${rule.id}" ${can() ? '' : `disabled title="${WRITE_NOTE}"`}><i></i></button></div>`).join('')}</div>
      <h2 class="a365-h2">Registry sync</h2><div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Platform</th><th>Status</th><th>Agents found</th><th>Last scan</th></tr></thead><tbody>${Agent365.platformsConnected.map(item => `<tr><td>${esc(item.name)}</td><td>${statusBadge(item.connected ? 'Available' : 'Not activated').replace('Available', 'Connected').replace('Not activated', 'Not connected')}</td><td>${item.agents}</td><td>${esc(item.last)}</td></tr>`).join('')}</tbody></table></div>
      <h2 class="a365-h2">Admin activity in this session</h2>${store.log().length ? `<div class="a365-tablewrap"><table class="a365-table"><thead><tr><th>Time</th><th>Agent</th><th>Action</th><th>Detail</th></tr></thead><tbody>${store.log().map(item => `<tr><td>${esc(item.time)}</td><td>${esc(item.agent)}</td><td>${esc(item.action)}</td><td>${esc(item.detail)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="a365-lede2">No actions yet. Block, approve, assign or pin an agent to see entries here.</p>'}
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
    const pinned = store.pinned(), eligible = store.list({ status: 'Available' }).filter(agent => agent.deployedTo !== 'Not deployed' && !agent.pinned).slice(0, 12);
    return `<header><div class="a365-phead"><span class="a365-ava org">${icon('fa-thumbtack')}</span><div><h2 id="a365-ptitle" tabindex="-1">Pinned agents</h2><span>Shown first in Copilot for the audience each agent is deployed to</span></div></div><button class="a365-x" data-a365-close aria-label="Close pinned agents">${icon('fa-xmark')}</button></header>
      <div class="a365-pbody"><h4>Pinned by your org (${pinned.length} of ${Agent365.MAX_PINNED})</h4>${pinned.length ? `<ol class="a365-pinlist">${pinned.map((agent, index) => `<li><span>${index + 1}</span><div><b>${esc(agent.name)}</b><small>${esc(agent.deployedTo)}</small></div><button class="a365-btn ghost" data-a365-move="up" data-id="${agent.id}" aria-label="Move ${esc(agent.name)} up" ${index === 0 || !can() ? 'disabled' : ''}>${icon('fa-arrow-up')}</button><button class="a365-btn ghost" data-a365-move="down" data-id="${agent.id}" aria-label="Move ${esc(agent.name)} down" ${index === pinned.length - 1 || !can() ? 'disabled' : ''}>${icon('fa-arrow-down')}</button><button class="a365-btn" data-a365-act="unpin" data-id="${agent.id}" ${can() ? '' : 'disabled'}>Unpin</button></li>`).join('')}</ol>` : '<p class="a365-muted">No agents are pinned by your organization.</p>'}
      <h4>Pinned by Microsoft</h4><ul class="a365-plain"><li>Researcher<b>Locked</b></li><li>Analyst<b>Locked</b></li></ul><p class="a365-muted">Users can’t unpin Microsoft-pinned or admin-pinned agents. Changes can take up to six hours to reach users.</p>
      <h4>Pin an agent</h4>${store.canPinMore() ? (eligible.length ? `<ul class="a365-plain">${eligible.map(agent => `<li><span>${esc(agent.name)}<small>${esc(agent.deployedTo)}</small></span><button class="a365-btn" data-a365-act="pin" data-id="${agent.id}" ${can() ? '' : 'disabled'}>Pin</button></li>`).join('')}</ul><p class="a365-muted">Showing the first 12 deployed agents.</p>` : '<p class="a365-muted">No deployed, available agents are left to pin.</p>') : '<p class="a365-muted">You can pin up to three agents. Unpin one to pin another. Only deployed agents that aren’t blocked can be pinned.</p>'}</div>`;
  }
  function riskPane(agent) {
    return `<header><div class="a365-phead">${avatar(agent)}<div><h2 id="a365-ptitle" tabindex="-1">Risk details</h2><span>${esc(agent.name)}</span></div></div><button class="a365-x" data-a365-close aria-label="Close risk details">${icon('fa-xmark')}</button></header><div class="a365-pbody"><p class="a365-muted">${Agent365.riskCount(agent)} signals across ${[...new Set(agent.risks.map(item => item.source))].length} platforms. Counts can trail the security portals by up to an hour.</p>${riskSections(agent)}<button class="a365-btn" data-a365-open="${agent.id}">${icon('fa-circle-info')} Open agent details</button></div>`;
  }
  function panelHtml() {
    if (!st.panel) return '';
    const inner = st.panel === 'pins' ? pinsPane() : agentSafe(agent => st.panel === 'risk' ? riskPane(agent) : agentPane(agent));
    return `<div class="a365-shade" data-a365-close></div><aside class="a365-panel" role="dialog" aria-modal="false" aria-labelledby="a365-ptitle">${inner}</aside>`;
  }
  const agentSafe = renderer => { try { return renderer(store.get(st.selected)); } catch { st.panel = null; return ''; } };

  /* ---------- dialogs ---------- */
  function dialogHtml() {
    const d = st.dialog;
    if (!d) return '';
    const wrap = (title, body, foot) => `<div class="a365-modalshade" data-a365-dialog-close></div><div class="a365-modal" role="dialog" aria-modal="true" aria-labelledby="a365-dtitle"><h2 id="a365-dtitle" tabindex="-1">${title}</h2><div class="a365-mbody">${body}</div><div class="a365-mfoot">${foot}</div></div>`;
    if (d.type === 'owner') return wrap('Assign new owner', `<p>Choose who is accountable for <b>${esc(store.get(d.id).name)}</b>.</p><label class="a365-field">Owner<select id="a365-owner">${OWNERS.map(name => `<option>${name}</option>`).join('')}</select></label>`, `<button class="a365-btn primary" data-a365-confirm>Assign owner</button><button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
    if (d.type === 'install') return wrap('Install agent', `<p>Deploy <b>${esc(store.get(d.id).name)}</b> to the people who should have it.</p><label class="a365-field">Audience<select id="a365-audience">${AUDIENCES.map(name => `<option>${name}</option>`).join('')}</select></label>`, `<button class="a365-btn primary" data-a365-confirm>Install</button><button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
    if (d.type === 'confirm') {
      const agent = store.get(d.id), copy = { block: `Members of your organization won’t be able to install or use <b>${esc(agent.name)}</b>, and it is removed from anyone who already installed it.`, delete: `<b>${esc(agent.name)}</b> is deleted from the registry. It appears under Deleted agents and can be restored in this demo.`, remove: `<b>${esc(agent.name)}</b> is removed from the registry. Other registry entries for the same agent aren’t affected.` }[d.action];
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
      `<p>Upload an agent package (.zip). The package is validated before you continue.</p>${w.uploaded ? `<div class="a365-file ok">${icon('fa-file-zipper')}<div><b>Contoso-Concierge-Agent.zip</b><small>Validated · Contoso Concierge Agent v1.0.0 · hosts: Teams, Copilot</small></div>${icon('fa-circle-check')}</div>` : `<button class="a365-btn" data-a365-wiz-upload>${icon('fa-file-arrow-up')} Choose sample package</button><p class="a365-muted">This demo offers one fictional package. No file is read from your device.</p>`}`,
      `<p>Choose who can install the agent.</p>${opt('Publish to', 'publish', ['Everyone in the organization', 'Specific users or groups', 'Just me'])}`,
      `<p>Optionally preinstall the agent for an audience. You can start with a small test group.</p>${opt('Deploy to', 'deploy', ['No one yet', ...AUDIENCES])}`,
      `<p>Apply a policy template. Default policies and protections are managed through each security platform, and might not be enabled.</p>${opt('Policy template', 'template', Agent365.templates.map(item => item.name))}`,
      `<p>Review what the agent asks to do.</p><ul class="a365-plain"><li>Read the signed-in user’s profile<b>Delegated</b></li><li>Read files the user can already access<b>Delegated</b></li><li>Post messages in Teams as the agent<b>Application</b></li></ul>`,
      `<dl class="a365-facts">${fact('Agent', 'Contoso Concierge Agent')}${fact('Publish to', esc(w.publish))}${fact('Deploy to', esc(w.deploy))}${fact('Policy template', esc(w.template))}</dl><p class="a365-muted">Finishing adds the agent to this demo registry only.</p>`
    ][w.step];
    const last = w.step === steps.length - 1;
    return wrap('Add agent', `<ol class="a365-steps">${steps.map((name, index) => `<li class="${index === w.step ? 'on' : index < w.step ? 'done' : ''}">${name}</li>`).join('')}</ol>${body}`, `<button class="a365-btn primary" data-a365-wiz-next ${w.step === 0 && !w.uploaded ? 'disabled' : ''}>${last ? 'Finish deployment' : 'Next'}</button>${w.step > 0 ? '<button class="a365-btn" data-a365-wiz-back>Back</button>' : ''}<button class="a365-btn" data-a365-dialog-close>Cancel</button>`);
  }

  /* ---------- rendering and events ---------- */
  const PAGES = { overview: overviewHtml, registry: registryHtml, map: mapPageHtml, deleted: deletedHtml, shadow: shadowHtml, tools: toolsHtml, settings: settingsHtml };
  function render(focus = '') {
    if (!root?.isConnected) return;
    popNow = st.anim; st.anim = false; showLoader = st.mapLoad; st.mapLoad = false;
    const scroller = root.querySelector('.a365-scroll'), keep = scroller && !st.resetScroll ? scroller.scrollTop : 0;
    st.resetScroll = false;
    root.className = 'a365-root';
    root.innerHTML = `${DEFS}<div class="a365">${topbarHtml()}<div class="a365-body">${navHtml()}<main class="a365-scroll" id="a365-main" tabindex="-1">${pageHeadHtml()}<div class="a365-content">${PAGES[st.page]()}</div></main></div>${panelHtml()}${dialogHtml()}${menuHtml()}<div class="a365-assist" aria-label="Help"><button data-a365-toast="Help and support isn’t part of this demo." aria-label="Help and support">${icon('fa-headset')}</button><button data-a365-toast="Feedback isn’t part of this demo." aria-label="Give feedback">${icon('fa-message')}</button></div><div class="a365-toast ${st.toast ? 'on' : ''}" role="status" aria-live="polite">${esc(st.toast)}</div></div>`;
    const next = root.querySelector('.a365-scroll'); if (next) next.scrollTop = keep;
    if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
  }
  function refreshList() { const list = root.querySelector('#a365-list'); if (!list) return; list.innerHTML = st.tab === 'registry' ? tableHtml() : requestsHtml(); }
  function toast(message) { st.toast = message; const element = root.querySelector('.a365-toast'); if (element) { element.textContent = message; element.classList.add('on'); } clearTimeout(toastTimer); toastTimer = setTimeout(() => { st.toast = ''; root?.querySelector('.a365-toast')?.classList.remove('on'); }, 4200); }
  const closeAll = () => { st.panel = null; st.dialog = null; st.menu = null; };
  function go(target) {
    closeAll(); st.single = null; st.mapNode = null; st.card = ''; st.pageNo = 0; st.resetScroll = true;
    if (['settings', 'deleted', 'shadow', 'tools', 'overview'].includes(target)) { st.page = target; return; }
    if (target === 'map') { Object.assign(st, { page: 'map', filters: {}, cluster: null, zoom: 1, pan: [0, 0], mapFilters: false, mapFull: false, pop: null, mapLoad: true, anim: true }); return; }
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
    const b = event.target.closest('button, .a365-shade, .a365-modalshade, .a365-menushade');
    if (!b || !root.contains(b)) return;
    const d = b.dataset;
    if (d.a365Toast) { toast(d.a365Toast); return; }
    if (d.a365MenuClose !== undefined) { st.menu = null; render(); return; }
    if (d.a365Menu) { st.menu = st.menu === d.a365Menu ? null : d.a365Menu; render(); return; }
    if (d.a365Setrole) { st.role = d.a365Setrole; st.menu = null; render(); toast(can() ? 'Viewing as AI Administrator.' : 'Viewing as Global Reader. Actions are disabled.'); return; }
    if (d.a365Theme !== undefined) { document.querySelector('#theme-toggle')?.click(); render('[data-a365-theme]'); return; }
    if (d.a365Navtoggle !== undefined) { st.navCollapsed = !st.navCollapsed; render('[data-a365-navtoggle]'); return; }
    if (d.a365Agents !== undefined) { st.agentsOpen = !st.agentsOpen; st.navCollapsed = false; render('[data-a365-agents]'); return; }
    if (d.a365Page) { go(d.a365Page); render('#a365-main'); return; }
    if (d.a365Go) { go(d.a365Go); render('#a365-main'); return; }
    if (d.a365Tab) { st.tab = d.a365Tab; st.pageNo = 0; render('.a365-tabs .on'); return; }
    if (d.a365Card !== undefined) { const key = d.a365Card; st.card = st.card === key || key === 'total' ? '' : key; st.filters = st.card ? { ...CARD_FILTERS[st.card] } : {}; st.pageNo = 0; render(`[data-a365-card="${key}"]`); return; }
    if (d.a365Clear !== undefined) { st.filters = {}; st.card = ''; st.pageNo = 0; st.anim = st.page === 'map'; render('#a365-search'); return; }
    if (d.a365Sort) { const key = d.a365Sort; st.sort = { key, dir: st.sort.key === key && st.sort.dir === 'asc' ? 'desc' : 'asc' }; st.pageNo = 0; render(`[data-a365-sort="${key}"]`); return; }
    if (d.a365Pg) { const last = Math.max(0, Math.ceil(store.list(st.filters).length / PAGE_SIZE) - 1); st.pageNo = d.a365Pg === 'first' ? 0 : d.a365Pg === 'last' ? last : Math.min(last, Math.max(0, st.pageNo + (d.a365Pg === 'next' ? 1 : -1))); refreshList(); return; }
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
    if (d.a365Single) { st.single = d.a365Single; st.mapNode = null; st.page = 'map'; st.panel = null; st.mapFull = false; st.resetScroll = true; render('.a365-singlehead button'); return; }
    if (d.a365BackMap !== undefined) { st.single = null; st.mapNode = null; st.anim = true; render('.a365-fbtn'); return; }
    if (d.a365Cluster) { st.cluster = d.a365Cluster; st.zoom = 1; st.pan = [0, 0]; st.anim = true; st.fitPending = true; render('.a365-cback'); return; }
    if (d.a365Allclusters !== undefined) { st.cluster = null; st.zoom = 1; st.pan = [0, 0]; st.anim = true; render(); return; }
    if (d.a365Zoom) { zoomBy(d.a365Zoom === 'in' ? .2 : -.2); return; }
    if (d.a365Fit !== undefined) { st.zoom = 1; st.pan = [0, 0]; st.fitPending = Boolean(st.cluster); if (st.cluster) refreshWorld(); applyView(); return; }
    if (d.a365Center !== undefined) { st.pan = [0, 0]; applyView(); return; }
    if (d.a365Mapfilters !== undefined) { st.mapFilters = !st.mapFilters; render(st.mapFilters ? '.a365-fpanel select' : '.a365-fbtn'); return; }
    if (d.a365Pop) { st.pop = st.pop === d.a365Pop ? null : d.a365Pop; render(); return; }
    if (d.a365Full !== undefined) { st.mapFull = !st.mapFull; render('[data-a365-full]'); return; }
    if (d.a365Restore) { try { const agent = store.restore(d.a365Restore); render(); toast(`${agent.name} restored. Recorded locally.`); } catch (error) { toast(error.message); } return; }
    if (d.a365Rule) { store.toggleRule(d.a365Rule); render(`[data-a365-rule="${d.a365Rule}"]`); toast('Rule updated for this demo session only.'); return; }
    if (d.a365WizUpload !== undefined) { st.wizard.uploaded = true; render('[data-a365-wiz-next]'); return; }
    if (d.a365WizBack !== undefined) { st.wizard.step -= 1; render('#a365-dtitle'); return; }
    if (d.a365WizNext !== undefined) {
      if (st.wizard.step < 5) { st.wizard.step += 1; render('#a365-dtitle'); return; }
      try {
        const w = st.wizard, agent = store.addAgent({ name: 'Contoso Concierge Agent', description: 'Answers employee questions in Teams and Copilot. Added from an uploaded package.', scope: w.deploy === 'No one yet' ? 'Not deployed' : w.deploy, template: w.template });
        st.dialog = null; st.page = 'registry'; st.tab = 'registry'; st.filters = {}; st.card = ''; st.pageNo = 0; st.selected = agent.id; st.panel = 'agent'; st.paneTab = 'details'; render('#a365-ptitle'); toast('Contoso Concierge Agent added to the demo registry.');
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
    if (t.dataset.a365Filter !== undefined) { st.filters = { ...st.filters, [t.dataset.a365Filter]: t.value }; st.card = ''; st.pageNo = 0; st.anim = st.page === 'map'; render(`[data-a365-filter="${t.dataset.a365Filter}"]`); }
    else if (t.dataset.a365Flag) { const key = t.dataset.a365Flag; st.filters = { ...st.filters, [key]: key === 'risk' ? (t.checked ? 'at-risk' : '') : t.checked }; st.anim = true; render(`[data-a365-flag="${key}"]`); }
    else if (t.dataset.a365Col) { st.cols[t.dataset.a365Col] = t.checked ? 1 : 0; render(`[data-a365-col="${t.dataset.a365Col}"]`); }
    else if (t.dataset.a365Wiz) { st.wizard[t.dataset.a365Wiz] = t.value; }
  }
  function onInput(event) {
    if (event.target.id === 'a365-max') { st.maxPer = Number(event.target.value); st.fitPending = true; refreshWorld(); applyView(); return; }
    if (event.target.id !== 'a365-search') return;
    st.filters = { ...st.filters, query: event.target.value }; st.pageNo = 0;
    refreshList();
  }
  function onSubmit(event) {
    if (event.target.dataset?.a365Gsearch === undefined) return;
    event.preventDefault();
    const query = new FormData(event.target).get('q').toString().trim();
    go('registry'); st.filters = query ? { query } : {}; render('#a365-search');
  }
  function onKey(event) {
    if (!root?.isConnected) return;
    if (event.key === 'Escape' && st.menu) { event.preventDefault(); st.menu = null; render(); return; }
    if (event.key === 'Escape' && (st.dialog || st.panel)) { event.preventDefault(); if (st.dialog) st.dialog = null; else st.panel = null; render(); return; }
    if (st.page === 'map' && !st.dialog && !st.panel && (event.key === 'Escape' || !event.target.closest?.('input, select, textarea'))) {
      const nudge = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[event.key];
      if (event.key === '+' || event.key === '=') { zoomBy(.2); return; }
      if (event.key === '-' || event.key === '_') { zoomBy(-.2); return; }
      if (event.key === '0') { st.zoom = 1; st.pan = [0, 0]; st.fitPending = Boolean(st.cluster); if (st.cluster) refreshWorld(); applyView(); return; }
      if (nudge && !st.single && !event.target.closest?.('button')) { event.preventDefault(); st.pan = [st.pan[0] + nudge[0], st.pan[1] + nudge[1]]; applyView(); return; }
      if (event.key === 'Escape') {
        if (st.pop) st.pop = null; else if (st.mapFilters) st.mapFilters = false; else if (st.mapFull) st.mapFull = false; else if (st.single) st.single = null; else if (st.cluster) { st.cluster = null; st.anim = true; } else return;
        event.preventDefault(); render(); return;
      }
    }
    const node = event.target.closest?.('[data-a365-node]');
    if (node && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); st.mapNode = node.dataset.a365Node; render(`[data-a365-node="${CSS.escape(node.dataset.a365Node)}"]`); }
  }
  function onPointerDown(event) {
    if (!root?.isConnected || st.page !== 'map' || st.single || event.button) return;
    const viewport = event.target.closest('.a365-viewport');
    if (!viewport || event.target.closest('button, input, select, .a365-floating')) return;
    drag = { x: event.clientX, y: event.clientY, pan: [...st.pan] }; viewport.classList.add('grab');
  }
  function onPointerMove(event) { if (!drag) return; st.pan = [drag.pan[0] + event.clientX - drag.x, drag.pan[1] + event.clientY - drag.y]; applyView(); }
  function onPointerUp() { if (!drag) return; drag = null; root?.querySelector('.a365-viewport')?.classList.remove('grab'); }
  function unmount() {
    clearTimeout(toastTimer);
    if (root) { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('input', onInput); root.removeEventListener('submit', onSubmit); root.removeEventListener('pointerdown', onPointerDown); }
    document.removeEventListener('keydown', onKey); document.removeEventListener('pointermove', onPointerMove); document.removeEventListener('pointerup', onPointerUp);
    drag = null; root = null;
  }
  function mount(element) {
    unmount(); root = element; store = Agent365.createStore(); st = fresh();
    root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('submit', onSubmit); root.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey); document.addEventListener('pointermove', onPointerMove); document.addEventListener('pointerup', onPointerUp);
    render();
  }
  return { mount, unmount };
})();
