'use strict';

const ShowcaseUI = (() => {
  let root = null;
  const view = { pillar: 'all', level: 'all' };
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const icon = name => `<i class="fa-solid ${name}" aria-hidden="true"></i>`;
  const pillarOf = id => Showcase.pillars.find(pillar => pillar.id === id);
  const incidentOf = id => (typeof SecurityData !== 'undefined' ? SecurityData.incidents : []).find(item => item.id === id);
  const catalog = (pillar, name) => (typeof SecurityData !== 'undefined' ? SecurityData.products[pillar]?.capabilities || [] : []).find(item => item[0] === name);
  const levelClass = { reel: 'reel', workspace: 'workspace', described: 'described' };
  const levelIcon = { reel: 'fa-film', workspace: 'fa-table-cells', described: 'fa-book-open' };

  function capabilityCard(c) {
    const info = catalog(c.pillar, c.name);
    const text = c.does || (info ? info[1] : '');
    const license = info ? `<span class="license-tag ${info[2] === 'License-dependent' ? 'dependent' : info[2] === 'Integrated' ? 'integrated' : ''}">${esc(info[2])}</span>` : '';
    const reels = c.reels.slice(0, 2).map(([name, target]) => `<button class="sc-link" data-reel="${target}">${icon('fa-play')}<span>${esc(name)}</span></button>`).join('');
    const incidents = c.incidents.slice(0, 3).filter(incidentOf).map(id => `<button class="sc-chip" data-incident="${id}" title="${esc(incidentOf(id).title)}">${icon('fa-triangle-exclamation')} ${id}</button>`).join('');
    const page = c.page ? `<button class="sc-link" data-reel="${c.page[1]}">${icon('fa-arrow-right')}<span>${esc(c.page[0])}</span></button>` : '';
    const note = c.level === 'described' ? '<p class="sc-note">Capability reference only. Not demonstrated with sample data.</p>' : '';
    return `<article class="sc-card ${levelClass[c.level]}"><header><h4>${esc(c.name)}</h4><span class="sc-level ${levelClass[c.level]}" title="${esc(Showcase.LEVELS[c.level])}">${icon(levelIcon[c.level])} ${esc(Showcase.LEVELS[c.level])}</span></header><p>${esc(text)}</p>${license}${note}<footer>${reels}${page}${incidents ? `<div class="sc-chips">${incidents}</div>` : ''}</footer></article>`;
  }

  function wall() {
    const cover = Showcase.coverage();
    const all = Showcase.capabilities();
    const visible = all.filter(c => (view.pillar === 'all' || c.pillar === view.pillar) && (view.level === 'all' || c.level === view.level));
    const pillarChips = [['all', 'All products'], ...Showcase.pillars.map(p => [p.id, p.name.replace('Microsoft ', '')])].map(([id, label]) => `<button class="sc-filter ${view.pillar === id ? 'on' : ''}" data-sc="pillar" data-val="${id}" aria-pressed="${view.pillar === id}">${esc(label)}</button>`).join('');
    const levelChips = [['all', 'All coverage'], ...Object.entries(Showcase.LEVELS).filter(([id]) => cover[id] > 0)].map(([id, label]) => `<button class="sc-filter ${view.level === id ? 'on' : ''}" data-sc="level" data-val="${id}" aria-pressed="${view.level === id}">${esc(label)}</button>`).join('');
    const sections = Showcase.pillars.map(pillar => {
      const cards = visible.filter(c => c.pillar === pillar.id);
      if (!cards.length) return '';
      const stat = cover.perPillar[pillar.id];
      return `<section class="sc-pillar"><div class="sc-pillar-head"><span class="sc-pillar-icon">${icon(pillar.icon)}</span><div><h3>${esc(pillar.name)}</h3><p>${esc(pillar.tagline)}</p></div><small>${stat.reel} of ${stat.total} shown in a reel</small></div><div class="sc-grid">${cards.map(capabilityCard).join('')}</div></section>`;
    }).join('');
    return `<div class="sc-root"><section class="sc-hero"><div><small>MICROSOFT 365 E7 \u00b7 SECURITY SHOWCASE</small><h1>See every capability in action</h1><p>One Contoso Monday, six chapters. Watch an attack become a story across Defender, Entra, Intune, Purview and Agent 365, or browse the capability wall and open the reel, workspace and incident behind each one.</p><div class="sc-actions"><button class="sc-primary" data-sc="start">${icon('fa-play')} Run the E7 story</button><span class="sc-scope">${icon('fa-circle-info')} Fictional sample \u00b7 E7 is an ecosystem concept, not a product</span></div></div><ol class="sc-hero-path" aria-label="Tour chapters">${Showcase.stops.map(stop => `<li>${icon(stop.icon)}<span>${esc(stop.title)}</span></li>`).join('')}</ol></section><section class="sc-stats" aria-label="Coverage">${[['all', cover.total, 'Capabilities mapped'], ['reel', cover.reel, 'Shown in a reel'], ['workspace', cover.workspace, 'Explore in a workspace'], ['described', cover.described, 'Described only']].filter(([id, n]) => id === 'all' || n > 0).map(([id, n, label]) => `<button class="${view.level === id ? 'on' : ''}" data-sc="level" data-val="${id}"><strong>${n}</strong><span>${label}</span></button>`).join('')}</section><div class="sc-filters"><div>${pillarChips}</div><div>${levelChips}</div></div>${sections || '<div class="empty-state">No capabilities match these filters.</div>'}<p class="sc-foot">Coverage describes this demo, not Microsoft product coverage. Availability depends on licensing, configuration and permissions. Reels and workspaces use fictional, local data and make no connection to a tenant.</p></div>`;
  }

  function hub() {
    const state = Showcase.tour.snapshot();
    const stops = Showcase.tour.stops;
    const path = stops.map((stop, index) => {
      const done = state.seen.includes(stop.id), now = !state.done && index === state.index;
      return `<li class="${done ? 'done' : now ? 'now' : ''}">${icon(done ? 'fa-check' : stop.icon)}<span>${esc(stop.title)}</span></li>`;
    }).join('');
    const head = `<header class="sc-tour-head"><div><small>GUIDED TOUR \u00b7 THE E7 STORY</small><h1>${state.done ? 'Monday at Contoso, complete' : 'Monday at Contoso'}</h1></div><button class="sc-ghost" data-sc="end">${icon('fa-xmark')} End tour</button></header><ol class="sc-path" aria-label="Chapters">${path}</ol>`;
    if (state.done) return `<div class="sc-root sc-tour">${head}${summary()}</div>`;
    const stop = stops[state.index];
    const proves = Showcase.capabilities().filter(c => c.reels.some(reel => reel[1] === stop.target));
    const incident = incidentOf(stop.incidents[0]);
    const first = state.index === 0 && state.seen.length === 0;
    return `<div class="sc-root sc-tour">${head}<section class="sc-stop"><div class="sc-stop-icon">${icon(stop.icon)}</div><div class="sc-stop-body"><small>CHAPTER ${state.index + 1} OF ${stops.length} \u00b7 ${esc(pillarOf(stop.pillar).name.toUpperCase())}</small><h2>${esc(stop.title)}</h2><blockquote>${esc(stop.bridge)}</blockquote><div class="sc-two"><div><h4>What you will see</h4><p>${esc(stop.say)}</p></div><div><h4>Keep in mind</h4><p>${esc(stop.boundary)}</p></div></div>${proves.length ? `<div class="sc-proves"><h4>Capabilities shown</h4><div>${proves.map(c => `<span>${esc(c.name)}</span>`).join('')}</div></div>` : ''}${incident ? `<p class="sc-after">Afterwards, find it in the queue as <button class="sc-chip" data-incident="${incident.id}">${icon('fa-triangle-exclamation')} ${incident.id}</button> ${esc(incident.title)}</p>` : ''}<div class="sc-actions"><button class="sc-primary" data-reel="${stop.target}">${icon('fa-play')} ${first ? 'Start chapter 1' : 'Play chapter ' + (state.index + 1)}</button><button class="sc-ghost" data-sc="skip">Skip this chapter</button></div><p class="sc-hint">When the reel ends, press Esc or the exit button and you will return here for the next chapter.</p></div></section></div>`;
  }

  function summary() {
    const shown = Showcase.tour.demonstrated();
    const total = Showcase.coverage().total;
    const seen = Showcase.tour.snapshot().seen.length;
    const byPillar = Showcase.pillars.map(pillar => ({ pillar, items: shown.filter(c => c.pillar === pillar.id) })).filter(group => group.items.length);
    const ids = [...new Set(Showcase.tour.incidents())];
    return `<section class="sc-summary"><div class="sc-sum-stats"><div><strong>${seen}</strong><span>chapters played</span></div><div><strong>${shown.length}</strong><span>of ${total} capabilities shown in a reel</span></div><div><strong>${ids.length}</strong><span>incidents in the queue</span></div></div>${byPillar.map(({ pillar, items }) => `<div class="sc-sum-row"><span class="sc-pillar-icon">${icon(pillar.icon)}</span><div><h4>${esc(pillar.name)}</h4><div class="sc-proves"><div>${items.map(c => `<span>${esc(c.name)}</span>`).join('')}</div></div></div></div>`).join('') || '<p class="sc-hint">No chapters were played, so nothing was demonstrated yet.</p>'}${ids.length ? `<div class="sc-sum-row"><span class="sc-pillar-icon">${icon('fa-triangle-exclamation')}</span><div><h4>Incidents from this story</h4><div class="sc-chips">${ids.map(id => `<button class="sc-chip" data-incident="${id}">${icon('fa-triangle-exclamation')} ${id} \u00b7 ${esc(incidentOf(id)?.title || '')}</button>`).join('')}</div></div></div>` : ''}<div class="sc-actions"><button class="sc-primary" data-sc="wall">${icon('fa-table-cells')} Open the capability wall</button><button class="sc-ghost" data-sc="restart">${icon('fa-rotate-right')} Restart the tour</button><button class="sc-ghost" data-view="incidents">${icon('fa-shield-halved')} Open Incidents &amp; alerts</button></div><p class="sc-foot">Fictional sample. Each reel models one configuration; it does not prove coverage of every channel, device or tenant.</p></section>`;
  }

  function draw() { if (root) root.innerHTML = Showcase.tour.isActive() ? hub() : wall(); }

  function onClick(event) {
    const button = event.target.closest('[data-sc]');
    if (!button || !root || !root.contains(button)) return;
    const action = button.dataset.sc;
    if (action === 'start' || action === 'restart') Showcase.tour.start();
    else if (action === 'end' || action === 'wall') Showcase.tour.end();
    else if (action === 'skip') Showcase.tour.skip();
    else if (action === 'pillar') view.pillar = button.dataset.val;
    else if (action === 'level') view.level = view.level === button.dataset.val ? 'all' : button.dataset.val;
    draw();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function mount(target) { unmount(); root = target; root.addEventListener('click', onClick); draw(); }
  function unmount() { if (root) root.removeEventListener('click', onClick); root = null; }
  return { mount, unmount };
})();
