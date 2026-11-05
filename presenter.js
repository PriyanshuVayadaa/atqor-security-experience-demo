'use strict';

// Demo mode and presenter view. Opt-in only: nothing here runs unless the page is opened with ?demo=1.
const Presenter = (() => {
  const KEY = 'atqor-demo';
  let demo = false, popup = null, dock = null, ticker = null;
  const timer = { running: false, startedAt: 0, elapsed: 0, auto: false };
  let lastSignature = '';

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const icon = name => `<i class="fa-solid ${name}" aria-hidden="true"></i>`;

  const CSS = `
    *{box-sizing:border-box}body{margin:0;font:13px/1.45 'Segoe UI',Tahoma,sans-serif;background:#f4f6f9;color:#1f2733}
    #pv-root,.pv-dock{padding:14px}.pv-dock{position:fixed;right:14px;bottom:14px;z-index:2147483000;width:380px;max-height:86vh;overflow:auto;border:1px solid #cfd8e3;border-radius:10px;background:#f4f6f9;box-shadow:0 12px 40px #0003;color:#1f2733;font:13px/1.45 'Segoe UI',Tahoma,sans-serif}
    .pv h1,.pv h2,.pv h3,.pv h4,.pv p{margin:0}.pv header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .pv header b{font-size:15px}.pv header span{font-size:11px;padding:2px 8px;border-radius:10px;background:#dff3ec;color:#0d6a54;font-weight:600}
    .pv section{margin-bottom:12px;padding:12px 14px;border:1px solid #dbe2ec;border-radius:8px;background:#fff}
    .pv h4{margin-bottom:5px;font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:#6a7686}
    .pv button{font:inherit;cursor:pointer;border:1px solid #cdd6e2;border-radius:6px;background:#fff;color:#1f2733;padding:6px 11px}
    .pv button:hover{background:#eaf2fd;border-color:#0f6cbd}.pv button.on,.pv button.primary{background:#0f6cbd;border-color:#0f6cbd;color:#fff}
    .pv-row{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.pv-clock{font-size:28px;font-weight:600;font-variant-numeric:tabular-nums}
    .pv-timer{display:flex;align-items:center;justify-content:space-between;gap:10px}.pv-timer small{color:#6a7686;display:block}
    .pv-over .pv-clock{color:#c0392b}.pv-title{font-size:16px;font-weight:600;margin:2px 0 8px}.pv-chap{font-size:11px;font-weight:700;color:#0f6cbd;letter-spacing:.5px}
    .pv-say{margin:8px 0;padding-left:10px;border-left:3px solid #0f6cbd;font-style:italic}.pv-two p{margin-bottom:8px}
    .pv-cue{padding:7px 0;border-top:1px solid #edf0f5}.pv-cue:first-of-type{border-top:0}.pv-cue b{display:block}.pv-cue span{color:#4b5766}
    .pv-cue button{margin-top:5px;font-size:12px}.pv-foot{font-size:11.5px;color:#6a7686}.pv-hint{margin-top:8px;font-size:12px;color:#6a7686}
    .pv-warn{margin-bottom:10px;padding:7px 10px;border-radius:6px;background:#fff4d6;color:#7a5a00;font-size:12px}`;

  function init() {
    const query = new URLSearchParams(location.search).get('demo');
    try {
      if (query === '1') sessionStorage.setItem(KEY, '1');
      else if (query === '0') sessionStorage.removeItem(KEY);
      demo = sessionStorage.getItem(KEY) === '1';
    } catch { demo = query === '1'; }
    document.body.classList.toggle('demo-mode', demo);
    return demo;
  }

  const elapsed = () => timer.elapsed + (timer.running ? Date.now() - timer.startedAt : 0);
  const clock = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const startTimer = () => { if (!timer.running) { timer.running = true; timer.startedAt = Date.now(); } };
  const stopTimer = () => { if (timer.running) { timer.elapsed += Date.now() - timer.startedAt; timer.running = false; } };
  const resetTimer = () => { timer.running = false; timer.elapsed = 0; timer.auto = false; };

  function go(target) {
    const button = document.createElement('button');
    button.dataset.reel = target; button.hidden = true;
    document.body.append(button); button.click(); button.remove();
  }

  function agendaOf(snap) { return Showcase.agendas.find(item => item.id === snap.agenda) || null; }
  const minutesFor = (agenda, stop) => (agenda?.per?.[stop.id] ?? stop.minutes);

  function nowSection(snap, stop, agenda) {
    if (!snap.active) return `<section><h4>Tour</h4><p>Not started. Pick an agenda above to begin.</p><p class="pv-hint">Shortcut in the main window: <b>N</b> plays the next chapter.</p></section>`;
    if (snap.done) {
      const shown = Showcase.tour.demonstrated().length, total = Showcase.coverage().total;
      return `<section><h4>Wrap-up</h4><p class="pv-title">${snap.seen.length} chapters played</p><p>${shown} of ${total} capabilities were shown in a reel. Every reel incident is also a SIM- record in the queue.</p><p class="pv-say">Close by repeating the boundary: it is a fictional sample, and each reel models one configuration, not every channel or tenant.</p><div class="pv-row"><button class="primary" data-pv="wall">${icon('fa-table-cells')} Open capability wall</button><button data-pv="open" data-val="view:incidents">Incidents &amp; alerts</button></div></section>`;
    }
    const playing = snap.playing === stop.id;
    return `<section><div class="pv-chap">CHAPTER ${snap.index + 1} OF ${snap.total} \u00b7 ${playing ? 'ON SCREEN' : 'UP NEXT'} \u00b7 PLAN ${minutesFor(agenda, stop)} MIN</div><h2 class="pv-title">${esc(stop.title)}</h2><h4>Say first</h4><p class="pv-say">${esc(stop.bridge)}</p><div class="pv-two"><h4>What they will see</h4><p>${esc(stop.say)}</p><h4>Keep in mind</h4><p>${esc(stop.boundary)}</p></div>${playing ? '<p class="pv-hint">Press Esc in the main window when the reel ends to return to the tour.</p>' : `<div class="pv-row"><button class="primary" data-pv="play">${icon('fa-play')} Play chapter (N)</button><button data-pv="skip">Skip</button></div>`}</section>`;
  }

  function html(popupMode) {
    const snap = Showcase.tour.snapshot(), stop = Showcase.tour.current(), agenda = agendaOf(snap);
    const planned = agenda ? agenda.minutes : null;
    const over = planned !== null && elapsed() > planned * 60000;
    const agendas = Showcase.agendas.map(item => `<button class="${snap.agenda === item.id ? 'on' : ''}" data-pv="agenda" data-val="${item.id}">${esc(item.name)} \u00b7 ${item.minutes} min</button>`).join('');
    const cues = Showcase.cues.map(cue => `<div class="pv-cue"><b>${esc(cue.ask)}</b><span>${esc(cue.answer)}</span>${cue.target ? `<br><button data-pv="open" data-val="${cue.target}">${icon('fa-arrow-right')} ${esc(cue.label)}</button>` : ''}</div>`).join('');
    return `<div class="pv ${over ? 'pv-over' : ''}">${popupMode ? '' : '<div class="pv-warn">This panel is on the shared screen. Press P again to hide it, or allow pop-ups to use a separate window.</div>'}<header><b>Presenter view</b><span>Demo mode</span></header><section class="pv-timer"><div><div class="pv-clock" id="pv-clock">${clock(elapsed())}</div><small>${planned !== null ? 'planned ' + planned + ' min' : 'no agenda selected'}</small></div><div class="pv-row"><button data-pv="timer">${timer.running ? 'Pause' : 'Start'}</button><button data-pv="timer-reset">Reset</button></div></section><section><h4>Agenda</h4><div class="pv-row">${agendas}</div></section>${nowSection(snap, stop, agenda)}<section><h4>If asked\u2026</h4>${cues}</section><section class="pv-foot"><div class="pv-row"><button data-pv="reset">${icon('fa-rotate-right')} Reset demo</button><button data-pv="exit">Exit demo mode</button></div><p class="pv-hint">Keys in the main window: <b>P</b> presenter view \u00b7 <b>N</b> next chapter \u00b7 <b>Esc</b> leave a reel.</p></section></div>`;
  }

  const target = () => (popup && !popup.closed ? popup.document.getElementById('pv-root') : dock);

  function signature() {
    const snap = Showcase.tour.snapshot();
    return JSON.stringify([snap, timer.running, timer.elapsed === 0, Boolean(popup && !popup.closed)]);
  }

  function draw(force) {
    const host = target();
    if (!host) return;
    if (!timer.auto && Showcase.tour.isPlaying()) { timer.auto = true; startTimer(); }
    const sig = signature();
    if (force || sig !== lastSignature) { lastSignature = sig; host.innerHTML = html(host !== dock); }
    const clockEl = host.querySelector('#pv-clock');
    if (clockEl) clockEl.textContent = clock(elapsed());
  }

  function sync(force) { if (demo) draw(force); }

  function tick() {
    if (popup && popup.closed) popup = null;
    if (!popup && !dock) { clearInterval(ticker); ticker = null; return; }
    draw(false);
  }
  const ensureTicker = () => { if (!ticker) ticker = setInterval(tick, 1000); };

  function act(name, value) {
    const tour = Showcase.tour;
    if (name === 'agenda') { Showcase.startAgenda(value); resetTimer(); go('view:showcase'); }
    else if (name === 'play') { const stop = tour.current(); if (stop && !tour.isPlaying()) go(stop.target); }
    else if (name === 'skip') { tour.skip(); go('view:showcase'); }
    else if (name === 'timer') { timer.running ? stopTimer() : startTimer(); timer.auto = true; }
    else if (name === 'timer-reset') resetTimer();
    else if (name === 'open') go(value);
    else if (name === 'wall') { tour.end(); go('view:showcase'); }
    else if (name === 'reset') { close(); location.href = location.pathname + '?demo=1&r=' + Date.now() + '#showcase'; return; }
    else if (name === 'exit') { close(); try { sessionStorage.removeItem(KEY); } catch {} location.href = location.pathname + '?demo=0&r=' + Date.now() + '#overview'; return; }
    draw(true);
  }

  function onClick(event) {
    const button = event.target.closest('[data-pv]');
    if (button) act(button.dataset.pv, button.dataset.val);
  }

  function close() {
    if (popup && !popup.closed) popup.close();
    popup = null;
    if (dock) { dock.remove(); dock = null; }
  }

  function open() {
    if (!demo) return false;
    if (dock) { close(); return true; }
    if (popup && !popup.closed) { popup.focus(); return true; }
    popup = window.open('', 'atqor-presenter', 'popup=yes,width=440,height=820,left=40,top=40');
    if (popup) {
      popup.document.open();
      popup.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter view</title><link rel="stylesheet" href="${esc(new URL('assets/fontawesome/css/all.min.css', location.href).href)}"><style>${CSS}</style></head><body><div id="pv-root"></div></body></html>`);
      popup.document.close();
      popup.document.getElementById('pv-root').addEventListener('click', onClick);
    } else {
      popup = null;
      if (!document.getElementById('pv-style')) { const style = document.createElement('style'); style.id = 'pv-style'; style.textContent = CSS; document.head.append(style); }
      dock = document.createElement('div'); dock.className = 'pv-dock'; dock.addEventListener('click', onClick); document.body.append(dock);
    }
    ensureTicker();
    draw(true);
    return true;
  }

  function playNext() {
    const tour = Showcase.tour, stop = tour.current();
    if (demo && tour.isActive() && stop && !tour.isPlaying()) go(stop.target);
  }

  return { init, isDemo: () => demo, open, sync, playNext, close };
})();
