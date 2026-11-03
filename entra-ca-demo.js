'use strict';

// Small, deterministic teaching model. Never calls Microsoft or changes baseline fixtures.
const EntraCADemo = (() => {
  const people = [
    { id: 'sarah', name: 'Sarah Chen', email: 'sarah.chen@contoso.com', unit: 'Finance', admin: false },
    { id: 'marcus', name: 'Marcus Hill', email: 'marcus.hill@contoso.com', unit: 'Engineering', admin: false },
    { id: 'priya', name: 'Priya Shah', email: 'priya.shah@contoso.com', unit: 'Engineering', admin: true },
    { id: 'maya', name: 'Maya Patel', email: 'maya.patel@contoso.com', unit: 'Operations', admin: false }
  ];
  const fields = [
    { key: 'user', label: 'Identity', options: people.map(p => [p.id, `${p.name} · ${p.unit}${p.admin ? ' · Administrator' : ''}`]) },
    { key: 'app', label: 'Target application', options: [['m365', 'Microsoft 365'], ['erp', 'Contoso Finance ERP'], ['source', 'GitHub Enterprise SSO'], ['admin', 'Microsoft Admin Portals']] },
    { key: 'device', label: 'Device state', options: [['compliant', 'Managed & compliant'], ['unmanaged', 'Unmanaged / not compliant']] },
    { key: 'location', label: 'Network location', options: [['external', 'Outside trusted locations'], ['trusted', 'Contoso corporate egress']] },
    { key: 'risk', label: 'Sign-in risk', options: [['none', 'No detected sign-in risk'], ['medium', 'Medium'], ['high', 'High']] },
    { key: 'auth', label: 'Authentication already satisfied', options: [['password', 'Password only'], ['mfa', 'Authenticator MFA'], ['phishing', 'Phishing-resistant MFA (passkey / WHfB)']] },
    { key: 'client', label: 'Client type', options: [['modern', 'Modern authentication'], ['legacy', 'Legacy authentication attempt']] },
    { key: 'pilot', label: 'CA019 pilot membership', options: [['no', 'Not in pilot'], ['yes', 'In phishing-resistant MFA pilot']] }
  ];
  const base = { user: 'sarah', app: 'm365', device: 'unmanaged', location: 'external', risk: 'high', auth: 'password', client: 'modern', pilot: 'no' };
  const scenarios = [
    { id: 'risk', title: 'Block a risky sign-in', icon: 'fa-user-shield', description: 'Sarah attempts access from an unfamiliar network. High sign-in risk takes precedence over MFA.', expected: 'Blocked', input: { ...base }, tip: 'After evaluating, change risk to “No detected sign-in risk” and authentication to “Authenticator MFA”. Evaluate again. This changes hypothetical inputs; it does not remediate Sarah’s seeded user risk.' },
    { id: 'stepup', title: 'Require step-up MFA', icon: 'fa-mobile-screen-button', description: 'Marcus uses a password outside the corporate network. Discover the missing access requirement.', expected: 'Additional authentication required', input: { ...base, user: 'marcus', device: 'compliant', risk: 'none' }, tip: 'Evaluate once, then select “Authenticator MFA” and evaluate again. Compare the two decisions.' },
    { id: 'device', title: 'Protect financial data', icon: 'fa-laptop', description: 'Sarah has MFA, but an unmanaged device cannot meet the finance application’s device requirement.', expected: 'Blocked', input: { ...base, app: 'erp', risk: 'none', auth: 'mfa' }, tip: 'Evaluate the unmanaged device, change it to “Managed & compliant”, and evaluate again. In production, enrollment alone does not establish compliance.' },
    { id: 'admin', title: 'Secure administrator access', icon: 'fa-user-lock', description: 'Priya uses a compliant workstation and phishing-resistant MFA for an administrative session.', expected: 'Granted', input: { ...base, user: 'priya', app: 'admin', device: 'compliant', risk: 'none', auth: 'phishing' }, tip: 'Evaluate, then downgrade authentication to “Authenticator MFA”. Ordinary MFA does not satisfy the modeled administrator authentication strength.' },
    { id: 'report', title: 'Test before enforcing', icon: 'fa-eye', description: 'A report-only pilot flags missing phishing-resistant MFA without changing the enforced decision.', expected: 'Granted', input: { ...base, user: 'marcus', device: 'compliant', location: 'trusted', risk: 'none', pilot: 'yes' }, tip: 'Evaluate and inspect CA019. It would require stronger authentication if enabled, but does not enforce it. Switch to a passkey and compare.' }
  ];
  const policyIds = ['CA001', 'CA002', 'CA003', 'CA004', 'CA006', 'CA009', 'CA014', 'CA019'];
  function validate(input) {
    for (const field of fields) {
      if (!field.options.some(([value]) => value === input[field.key])) throw new Error(`Invalid ${field.label}`);
    }
  }
  function label(key, value) { return fields.find(f => f.key === key)?.options.find(([id]) => id === value)?.[1] || value; }
  function evaluate(input) {
    validate(input);
    const user = people.find(p => p.id === input.user);
    // A legacy attempt cannot satisfy modern MFA controls, regardless of the select value.
    const mfa = input.client === 'modern' && ['mfa', 'phishing'].includes(input.auth);
    const strong = input.client === 'modern' && input.auth === 'phishing';
    const compliant = input.device === 'compliant';
    const policies = [];
    function add(id, applies, matched, unmet = [], block = false, reportOnly = false) {
      const failures = applies ? unmet : [];
      policies.push({ id, applies, reportOnly, unmet: failures, hardBlock: applies && block,
        status: !applies ? 'Not applicable' : reportOnly ? (failures.length ? 'Would require stronger authentication' : 'Would satisfy') : block ? 'Block' : failures.length ? (failures.includes('Compliant device') ? 'Device requirement not met' : 'Authentication required') : 'Satisfied',
        reason: applies ? matched : `Outside modeled conditions for ${id}.`,
        requirements: failures.length ? failures.join(' + ') : applies && block ? 'Block access' : applies ? 'All modeled requirements satisfied' : 'No requirement for this context' });
    }
    add('CA001', user.admin, 'Administrator persona requires phishing-resistant MFA.', strong ? [] : ['Phishing-resistant MFA']);
    add('CA002', input.client === 'legacy', 'Legacy client detected; block overrides grant requirements.', [], true);
    add('CA003', ['Finance','Engineering'].includes(user.unit) && ['erp','source'].includes(input.app), 'Finance or Engineering identity accessing finance ERP or source control requires a compliant device.', compliant ? [] : ['Compliant device']);
    add('CA004', input.risk === 'high', 'High sign-in risk matches the enabled block policy. MFA cannot override this block.', [], true);
    add('CA006', input.location === 'external', 'Sign-in originates outside trusted locations; MFA is required.', mfa ? [] : ['MFA']);
    add('CA009', user.admin && input.app === 'admin', 'Administrator accessing admin portals must satisfy BOTH device compliance and phishing-resistant MFA.', [...(compliant ? [] : ['Compliant device']), ...(strong ? [] : ['Phishing-resistant MFA'])]);
    add('CA014', input.risk === 'medium', 'Medium sign-in risk requires MFA; satisfying it is not the same as dismissing user risk.', mfa ? [] : ['MFA']);
    add('CA019', input.pilot === 'yes', 'Pilot membership evaluates phishing-resistant MFA in report-only mode; never enforces access.', strong ? [] : ['Phishing-resistant MFA'], false, true);
    const enforced = policies.filter(p => p.applies && !p.reportOnly);
    const blocked = enforced.filter(p => p.hardBlock || p.unmet.includes('Compliant device'));
    const pending = enforced.filter(p => p.unmet.some(item => item.includes('MFA')));
    const outcome = blocked.length ? 'Blocked' : pending.length ? 'Additional authentication required' : 'Granted';
    return { outcome, tone: blocked.length ? 'blocked' : pending.length ? 'challenge' : 'granted', policies,
      matched: enforced.length,
      decisive: (blocked.length ? blocked : pending).map(p => p.id),
      explanation: blocked.length ? `${blocked.map(p => p.id).join(', ')} prevents access in this model. Satisfying another policy does not bypass a block or missing device requirement.` : pending.length ? 'Access is not granted yet. Complete the required authentication strength, then reevaluate. No real challenge is sent.' : 'All applicable enabled controls in the eight-policy teaching model are satisfied. This is not a real token grant or proof of application authorization.',
      reportOnly: policies.filter(p => p.applies && p.reportOnly).map(p => `${p.id}: ${p.status}. Not enforced.`) };
  }
  function createSession() {
    let input = { ...base }, scenario = 'risk', runs = [], sequence = 0, events = [];
    const snapshot = () => JSON.parse(JSON.stringify({ input, scenario, runs, sequence, events }));
    function record(action, detail) {
      events.unshift({ id: `CA-DEMO-${String(events.length + 1).padStart(3, '0')}`, time: new Date().toISOString(), action, detail, actor: 'Local presenter (not authenticated)' });
    }
    return {
      snapshot,
      setInput(key, value) {
        if (!fields.some(f => f.key === key)) throw new Error('Unknown scenario input');
        const next = { ...input, [key]: value }; validate(next); input = next;
      },
      load(id) {
        const preset = scenarios.find(s => s.id === id); if (!preset) throw new Error('Unknown scenario');
        scenario = id; input = { ...preset.input }; record('Scenario loaded', preset.title);
      },
      run() {
        const result = evaluate(input);
        const run = { id: ++sequence, input: { ...input }, result, time: new Date().toISOString() };
        runs.unshift(run); runs = runs.slice(0, 8);
        record('Access evaluated', `Run ${run.id} · ${people.find(p => p.id === input.user).email} · ${result.outcome}${result.decisive.length ? ' · '+result.decisive.join(', ') : ''}`);
        return JSON.parse(JSON.stringify(run));
      },
      reset() { input = { ...base }; scenario = 'risk'; runs = []; events = []; sequence = 0; }
    };
  }
  return { people, fields, scenarios, policyIds, label, evaluate, createSession };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = EntraCADemo;