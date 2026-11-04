'use strict';

// Capability coverage map and guided tour model. Presentation only: nothing here calls a Microsoft service.
const Showcase = (() => {
  const R = {
    attack: ['Defender attack response reel', 'defender:attack-reel'],
    entraReel: ['Entra demo reel', 'entra:demo-reel'],
    entraStory: ['Entra story \u00b7 The sign-in from nowhere', 'entra:story'],
    intuneLab: ['Intune device protection reel', 'intune:device-protection'],
    intuneStory: ['Intune story \u00b7 The laptop that wasn\u2019t ready', 'intune:story'],
    purviewLab: ['Purview agent protection demo', 'purview:agent-protection'],
    purviewStory: ['Purview story \u00b7 The file that almost left', 'purview:story'],
    agent: ['Agent 365 story \u00b7 The agent nobody owned', 'view:agent365-story'],
    agentHr: ['Agent 365 story \u00b7 The salary question', 'view:agent365-story-hr']
  };
  const P = (label, target) => [label, target];
  const cap = (name, opts = {}) => ({ name, reels: opts.reels || [], incidents: opts.incidents || [], page: opts.page || null, does: opts.does || '' });

  const pillars = [
    { id: 'defender', name: 'Microsoft Defender', icon: 'fa-shield-halved', tagline: 'Detect, investigate and respond.', capabilities: [
      cap('Microsoft Defender XDR', { reels: [R.attack], incidents: ['SIM-DEF-001', 'INC-2481'], page: P('Defender incidents', 'defender:defender-incidents') }),
      cap('Defender for Endpoint', { reels: [R.attack], incidents: ['SIM-DEF-001', 'SIM-DEF-002'], page: P('Endpoints', 'defender:endpoints') }),
      cap('Defender for Office 365', { incidents: ['INC-2481'], page: P('Email & collaboration', 'defender:email') }),
      cap('Defender for Identity', { page: P('Identities', 'defender:identities') }),
      cap('Defender for Cloud Apps', { page: P('Cloud apps', 'defender:cloud-apps') }),
      cap('Microsoft Defender Vulnerability Management', { page: P('Vulnerability Management', 'defender:vulnerabilities') }),
      cap('Threat Analytics & Advanced Hunting', { page: P('Advanced hunting', 'view:hunting') }),
      cap('Incident Management & Secure Score', { incidents: ['SIM-DEF-001'], page: P('Incidents & alerts', 'view:incidents') })
    ] },
    { id: 'intune', name: 'Microsoft Intune', icon: 'fa-laptop', tagline: 'Manage endpoints and keep access compliant.', capabilities: [
      cap('Device Management & Inventory', { page: P('Device inventory', 'intune:devices') }),
      cap('Device Compliance', { reels: [R.intuneStory, R.intuneLab], incidents: ['SIM-INT-001', 'SIM-INT-002'], page: P('Device compliance', 'intune:compliance') }),
      cap('Configuration Profiles', { page: P('Configuration profiles', 'intune:configuration-profiles') }),
      cap('Endpoint Security Policies', { page: P('Endpoint security', 'intune:endpoint-security') }),
      cap('Application Protection & MAM', { reels: [R.intuneLab], incidents: ['SIM-INT-003'], page: P('App protection policies', 'intune:app-protection') }),
      cap('Windows Autopilot', { page: P('Windows Autopilot', 'intune:autopilot') }),
      cap('Patch Management', { page: P('Windows updates', 'intune:update-rings') }),
      cap('Defender Integration & Compliance Reporting', { reels: [R.intuneLab], incidents: ['SIM-DEF-002'], page: P('Intune reports', 'intune:reports') })
    ] },
    { id: 'entra', name: 'Microsoft Entra', icon: 'fa-fingerprint', tagline: 'Secure every identity and access decision.', capabilities: [
      cap('Microsoft Entra ID & SSO', { page: P('Users', 'entra:users') }),
      cap('MFA & Passwordless Authentication', { page: P('Authentication methods', 'entra:authentication') }),
      cap('Conditional Access', { reels: [R.entraStory, R.entraReel, R.intuneStory], incidents: ['SIM-ENT-001', 'SIM-INT-001'] }),
      cap('Identity Protection', { reels: [R.entraStory, R.entraReel], incidents: ['SIM-ENT-001'], page: P('Users at high risk', 'entra:risky-users') }),
      cap('Privileged Identity Management (PIM)', { reels: [R.entraReel], incidents: ['SIM-ENT-002'], page: P('Privileged Identity Management', 'entra:pim') }),
      cap('Identity Governance & Access Reviews', { reels: [R.entraReel], incidents: ['SIM-ENT-003'], page: P('Access reviews', 'entra:access-reviews') }),
      cap('Entitlement Management', { page: P('Entitlement management', 'entra:entitlements') }),
      cap('External Identities', { reels: [R.entraReel], incidents: ['SIM-ENT-003'], page: P('External identities', 'entra:external') })
    ] },
    { id: 'purview', name: 'Microsoft Purview', icon: 'fa-eye', tagline: 'Understand and protect your data.', capabilities: [
      cap('Information Protection & Sensitivity Labels', { reels: [R.purviewStory, R.purviewLab], incidents: ['SIM-PUR-001', 'SIM-PUR-004'], page: P('Information Protection', 'purview:information') }),
      cap('Data Loss Prevention (DLP)', { reels: [R.purviewStory, R.purviewLab], incidents: ['SIM-PUR-001', 'SIM-PUR-002', 'SIM-PUR-003', 'SIM-PUR-004', 'SIM-PUR-005'], page: P('DLP policy matches', 'purview:dlp-alerts') }),
      cap('Insider Risk Management', { incidents: ['INC-2475'], page: P('Insider Risk Management', 'purview:insider') }),
      cap('Data Lifecycle & Records Management', { page: P('Data Lifecycle Management', 'purview:lifecycle') }),
      cap('eDiscovery & Audit', { page: P('eDiscovery', 'purview:ediscovery') }),
      cap('Communication Compliance', { page: P('Communication Compliance', 'purview:communication') }),
      cap('Data Security Posture Management', { page: P('Data Security Posture Management', 'purview:dspm') }),
      cap('Data Classification & Adaptive Protection', { page: P('Data classification', 'purview:classification') })
    ] },
    { id: 'agent365', name: 'Agent 365', icon: 'fa-robot', tagline: 'Govern the AI agents in your organization.', capabilities: [
      cap('Agent registry & inventory', { does: 'See every agent, its publisher, owner and state in one registry.', page: P('Agent 365 registry', 'view:agent365') }),
      cap('Agent map & shadow AI discovery', { does: 'Visualize agents by cluster and surface agents nobody registered.', page: P('Agent map', 'view:agent365') }),
      cap('Ownership & lifecycle', { does: 'Find agents that lost their owner and assign one.', reels: [R.agent], incidents: ['SIM-AGT-001'] }),
      cap('Agent risk signals', { does: 'Bring Purview and Agent 365 signals together for each agent.', reels: [R.agent], incidents: ['SIM-AGT-001'] }),
      cap('Agent access & policy protection', { does: 'Limit what an agent can retrieve and alert when a request is denied.', reels: [R.agentHr], incidents: ['SIM-AGT-002'] }),
      cap('Block and governance actions', { does: 'Block, unblock, pin and review agents as an AI administrator.', reels: [R.agent], incidents: ['SIM-AGT-001'], page: P('Agent 365 registry', 'view:agent365') })
    ] },
    { id: 'copilot', name: 'Security Copilot', icon: 'fa-wand-magic-sparkles', tagline: 'Scripted assistant for investigations.', capabilities: [
      cap('Incident summaries & response guidance', { does: 'Summarize a sample incident and outline response steps. Responses are scripted, not generated.', incidents: ['INC-2481'], page: P('Security Copilot', 'view:copilot') }),
      cap('Hunting query suggestions', { does: 'Suggest advanced hunting queries for the sample dataset. Scripted, not a live model.', page: P('Security Copilot', 'view:copilot') })
    ] }
  ];

  const level = c => c.reels.length ? 'reel' : c.page ? 'workspace' : 'described';
  const LEVELS = { reel: 'Shown in a reel', workspace: 'Explore in a workspace', described: 'Described only' };

  const capabilities = () => pillars.flatMap(pillar => pillar.capabilities.map(c => ({ ...c, pillar: pillar.id, level: level(c) })));
  const coverage = () => {
    const all = capabilities();
    const by = key => ({ reel: all.filter(c => c[key] === 'reel').length, workspace: all.filter(c => c[key] === 'workspace').length, described: all.filter(c => c[key] === 'described').length });
    const perPillar = Object.fromEntries(pillars.map(p => [p.id, { total: p.capabilities.length, ...Object.fromEntries(Object.keys(LEVELS).map(l => [l, all.filter(c => c.pillar === p.id && c.level === l).length])) }]));
    return { total: all.length, ...by('level'), perPillar };
  };

  const stops = [
    { id: 'attack', pillar: 'defender', icon: 'fa-shield-halved', title: 'A suspicious download', target: R.attack[1], incidents: ['SIM-DEF-001'], bridge: 'Monday morning at Contoso Finance. An unexpected invoice lands in Sarah Chen\u2019s inbox.', say: 'One endpoint signal becomes a Defender XDR incident, and an analyst decides whether to isolate the laptop.', boundary: 'Isolation limits spread; it is not malware removal. The branch where Sarah cancels the download creates no incident.' },
    { id: 'identity', pillar: 'entra', icon: 'fa-fingerprint', title: 'The sign-in from nowhere', target: R.entraStory[1], incidents: ['SIM-ENT-001'], bridge: 'Phishing often leads to stolen credentials. A sign-in for Sarah\u2019s account now arrives from an unfamiliar network.', say: 'Identity Protection raises risk, Conditional Access blocks the new attempt, and the admin still has to deal with the earlier session.', boundary: 'Blocking a sign-in does not revoke earlier sessions. Risk detections need Entra ID P2.' },
    { id: 'device', pillar: 'intune', icon: 'fa-laptop', title: 'The laptop that wasn\u2019t ready', target: R.intuneStory[1], incidents: ['SIM-INT-001'], bridge: 'Identity is only half of trust. Daniel Cho\u2019s laptop drifts out of compliance overnight.', say: 'Intune reports the device state, Conditional Access enforces it, and access returns only after a verified check-in.', boundary: 'A fix request is not verified compliance until the device checks in.' },
    { id: 'data', pillar: 'purview', icon: 'fa-eye', title: 'The file that almost left', target: R.purviewStory[1], incidents: ['SIM-PUR-001'], bridge: 'Trusted people on trusted devices can still send data the wrong way. Aisha Khan tries to share a Confidential file.', say: 'The label drives a DLP rule, the send is blocked, and an analyst closes the alert with a reminder.', boundary: 'The rule covers the modeled email scenario only. A blocked attempt does not prove no other channel was used.' },
    { id: 'agent', pillar: 'agent365', icon: 'fa-robot', title: 'The agent nobody owned', target: R.agent[1], incidents: ['SIM-AGT-001'], bridge: 'Now the newest identities: AI agents. Maya built one, shared it, and then left the company.', say: 'Agent 365 shows risk signals and ownership gaps, and an AI administrator can block the agent while follow-ups proceed.', boundary: 'Blocking stops use; it does not fix the data, apply a label or assign an owner.' },
    { id: 'agent-hr', pillar: 'agent365', icon: 'fa-ban', title: 'The salary question', target: R.agentHr[1], incidents: ['SIM-AGT-002'], bridge: 'Agents can be asked for things people are not allowed to see. Daniel asks the HR agent about a colleague\u2019s pay.', say: 'The agent\u2019s lookup is denied before any data is returned, an alert reaches the admin, and a human closes the loop.', boundary: 'A blocked attempt is not evidence of misconduct, and this models one configuration.' }
  ];

  const reelTargets = new Set([...Object.values(R).map(r => r[1])]);
  const reelFor = (view, section) => {
    const target = view === 'agent365-story' || view === 'agent365-story-hr' ? 'view:' + view : section ? view + ':' + section : '';
    return reelTargets.has(target) ? target : null;
  };

  function createTour(list = stops) {
    const state = { active: false, index: 0, seen: [], playing: null };
    const current = () => state.active && state.index < list.length ? list[state.index] : null;
    const snapshot = () => ({ active: state.active, index: state.index, seen: [...state.seen], playing: state.playing, done: state.active && state.index >= list.length, total: list.length });
    return {
      stops: list,
      start() { state.active = true; state.index = 0; state.seen = []; state.playing = null; return snapshot(); },
      end() { state.active = false; state.playing = null; return snapshot(); },
      isActive: () => state.active,
      isPlaying: () => state.playing !== null,
      current,
      enter(target) { const stop = current(); if (stop && stop.target === target) state.playing = stop.id; return snapshot(); },
      leave() {
        const stop = list.find(item => item.id === state.playing);
        if (!stop) return null;
        if (!state.seen.includes(stop.id)) state.seen.push(stop.id);
        state.playing = null; state.index += 1;
        return stop;
      },
      skip() { const stop = current(); if (stop) state.index += 1; return snapshot(); },
      snapshot,
      demonstrated() {
        const seenTargets = new Set(list.filter(stop => state.seen.includes(stop.id)).map(stop => stop.target));
        return capabilities().filter(c => c.reels.some(reel => seenTargets.has(reel[1])));
      },
      incidents() { return list.filter(stop => state.seen.includes(stop.id)).flatMap(stop => stop.incidents); }
    };
  }

  const tour = createTour();
  return { pillars, stops, LEVELS, capabilities, coverage, reelFor, createTour, tour };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Showcase;
