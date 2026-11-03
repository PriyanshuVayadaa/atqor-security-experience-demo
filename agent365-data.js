'use strict';

// Fictional Contoso agent estate for the Agent 365 demo (no tenant connection).
const Agent365Data = (() => {
  const base = {
    status: 'Available', publisher: 'Your org', platform: 'Copilot Studio', type: 'MCS DA', owner: 'Daniel Cho', channels: ['Teams'],
    version: '1.0.0', created: '2026-08-12', modified: '2026-10-20', description: '', deployedTo: 'All users', dataSources: [],
    knowledge: [], tools: [], risks: [], managed: true, sdk: false, pinned: false, pinOrder: 0,
    activity: { activeUsers: 0, sessions: 0, exceptionRate: 0, hours: 0 }, topUsers: []
  };
  const a = (id, name, o) => ({ ...base, id, name, ...o, activity: { ...base.activity, ...(o.activity || {}) } });
  const risk = (sev, title, detail, source, occ) => ({ sev, title, detail, source, occ });
  const tool = (name, kind, calls, exc) => ({ name, kind, calls, exc });

  const agents = [
    a('AG-001', 'Researcher', { publisher: 'Microsoft', platform: 'Microsoft', type: 'First-party', owner: 'Microsoft', channels: ['Copilot', 'Microsoft 365 apps'], version: '2026.10', description: 'Multi-step research across work and web sources.', dataSources: ['Work data', 'Web'], knowledge: ['Microsoft Graph', 'Web search'], activity: { activeUsers: 842, sessions: 6120, exceptionRate: .6, hours: 612 } }),
    a('AG-002', 'Analyst', { publisher: 'Microsoft', platform: 'Microsoft', type: 'First-party', owner: 'Microsoft', channels: ['Copilot'], version: '2026.10', description: 'Data analysis from uploaded files and work data.', dataSources: ['Work data'], knowledge: ['Uploaded files'], activity: { activeUsers: 517, sessions: 3380, exceptionRate: .4, hours: 288 } }),
    a('AG-003', 'Facilitator', { publisher: 'Microsoft', platform: 'Microsoft', type: 'First-party', owner: 'Microsoft', channels: ['Teams'], version: '2026.09', description: 'Keeps meetings on track with agendas and notes.', dataSources: ['Meeting data'], activity: { activeUsers: 366, sessions: 2104, exceptionRate: .3, hours: 140 } }),
    a('AG-004', 'Employee Self-Service', { publisher: 'Microsoft', platform: 'Microsoft', type: 'First-party', owner: 'Microsoft', channels: ['Teams', 'Copilot'], version: '2026.10', description: 'Answers HR and IT questions using company policy content.', dataSources: ['SharePoint'], activity: { activeUsers: 1021, sessions: 7440, exceptionRate: .5, hours: 420 }, pinned: true, pinOrder: 1 }),
    a('AG-005', 'Project Manager', { publisher: 'Microsoft', platform: 'Microsoft', type: 'First-party', owner: 'Microsoft', channels: ['Teams'], version: '2026.08', status: 'Not activated', deployedTo: 'Not deployed', description: 'Plans and tracks project work. Not yet activated for Contoso.' }),

    a('AG-006', 'Fabrikam Contract Reviewer', { publisher: 'Third party', platform: 'Other', type: 'Partner-built', owner: 'Elena Rossi', channels: ['Teams', 'Outlook'], version: '3.2.1', description: 'Partner agent that flags non-standard contract clauses.', dataSources: ['Embedded knowledge'], knowledge: ['Fabrikam clause library'], activity: { activeUsers: 64, sessions: 410, exceptionRate: 1.8, hours: 38 }, risks: [risk('Medium', 'Broad file permission requested', 'Requests Files.Read.All where site-level access would be enough.', 'Microsoft Entra', 2)] }),
    a('AG-007', 'Northwind Travel Concierge', { publisher: 'Third party', platform: 'Other', type: 'Partner-built', owner: 'Hannah Brooks', channels: ['Teams'], version: '1.9.0', description: 'Books travel inside company policy limits.', activity: { activeUsers: 143, sessions: 920, exceptionRate: .7, hours: 71 } }),
    a('AG-008', 'Adatum Spend Insights', { publisher: 'Third party', platform: 'Amazon Bedrock', type: 'Discovered', owner: null, managed: false, channels: ['Other'], version: 'n/a', modified: '2026-10-29', description: 'Discovered through registry sync. Built and run outside Agent 365.', deployedTo: 'Not deployed', risks: [risk('Low', 'No observability data', 'This agent does not report telemetry to Agent 365.', 'Agent 365', 1)] }),
    a('AG-009', 'Tailspin Recruiter', { publisher: 'Third party', platform: 'Google Vertex AI', type: 'Discovered', owner: 'Tomás Alvarez', managed: false, channels: ['Other'], version: 'n/a', modified: '2026-10-25', description: 'Candidate screening assistant discovered through registry sync.', deployedTo: 'Not deployed', risks: [risk('High', 'Personal data sent to external model endpoint', 'Candidate details are sent to an endpoint outside the registered tenant boundary.', 'Microsoft Purview', 3), risk('Low', 'No observability data', 'This agent does not report telemetry to Agent 365.', 'Agent 365', 1)] }),
    a('AG-010', 'Litware Legal Assistant', { publisher: 'Third party', platform: 'Other', type: 'Partner-built', owner: 'Elena Rossi', status: 'Blocked', channels: ['Teams'], version: '0.9.4', modified: '2026-10-18', description: 'Partner agent blocked pending a contract review.', deployedTo: 'Not deployed' }),

    a('AG-011', 'Contoso HR Policy Q&A', { type: 'MCS DA', owner: 'Priya Shah', channels: ['Teams', 'Copilot'], version: '2.4.0', description: 'Answers questions from the employee handbook.', dataSources: ['Embedded knowledge'], knowledge: ['Employee handbook (SharePoint)'], activity: { activeUsers: 688, sessions: 4290, exceptionRate: .5, hours: 190 }, pinned: true, pinOrder: 2 }),
    a('AG-012', 'IT Helpdesk Triage', { type: 'MCS CEA', owner: 'Marcus Webb', channels: ['Teams'], version: '1.7.2', description: 'Classifies tickets and suggests first-line fixes.', dataSources: ['Embedded knowledge'], activity: { activeUsers: 412, sessions: 3105, exceptionRate: 2.4, hours: 164 } }),
    a('AG-013', 'Finance Close Assistant', {
      platform: 'Microsoft Foundry', type: 'Agent instance', owner: 'Aisha Khan', sdk: true, channels: ['Teams', 'Outlook'], version: '1.3.0', description: 'Guides month-end close and reconciliation tasks. Extended with the Agent 365 SDK.',
      dataSources: ['Embedded knowledge'], knowledge: ['Close checklist', 'ERP exports'], deployedTo: 'Finance group',
      tools: [tool('Microsoft Graph', 'Connector', 2410, .3), tool('Finance ERP MCP server', 'MCP server', 1880, 3.4), tool('SharePoint', 'Connector', 960, .2), tool('Excel', 'Connector', 740, .5)],
      topUsers: [['Aisha Khan', 188], ['Daniel Cho', 143], ['Noor Haddad', 96], ['Victor Lund', 71]],
      activity: { activeUsers: 38, sessions: 1260, exceptionRate: 1.6, hours: 212 },
      risks: [risk('Medium', 'Tool exception rate above threshold', 'The Finance ERP MCP server returned errors on more than 3% of calls.', 'Microsoft Defender', 4)]
    }),
    a('AG-014', 'Procurement Approvals', { type: 'MCS BP', owner: 'Hannah Brooks', channels: ['Teams'], version: '1.1.0', description: 'Routes purchase requests to the right approver.', deployedTo: 'Procurement group', activity: { activeUsers: 52, sessions: 360, exceptionRate: .9, hours: 44 } }),
    a('AG-015', 'Sales Coach', { type: 'MCS DA', owner: 'Jordan Lee', channels: ['Teams', 'Copilot'], version: '2.0.1', description: 'Prepares account briefs and call follow-ups.', dataSources: ['Embedded knowledge'], deployedTo: 'Sales group', activity: { activeUsers: 301, sessions: 2250, exceptionRate: .4, hours: 118 } }),
    a('AG-016', 'Contract Review Agent', {
      platform: 'Microsoft Foundry', type: 'Foundry hosted', owner: 'Elena Rossi', sdk: true, channels: ['Teams'], version: '2.1.0', description: 'Compares contracts to approved playbooks. Hosted in Foundry and extended with the Agent 365 SDK.',
      dataSources: ['Embedded knowledge'], knowledge: ['Contract playbooks'], deployedTo: 'Legal group',
      tools: [tool('Microsoft Graph', 'Connector', 1320, .2), tool('Document store MCP server', 'MCP server', 1105, .6), tool('Contract repository', 'Connector', 640, 1.2)],
      topUsers: [['Elena Rossi', 160], ['Sam Okafor', 122], ['Lina Park', 80]], activity: { activeUsers: 22, sessions: 890, exceptionRate: .6, hours: 133 }
    }),
    a('AG-017', 'Customer Escalation Router', {
      platform: 'Microsoft Foundry', type: 'Agent instance', owner: 'Jordan Lee', sdk: true, channels: ['Teams', 'Outlook'], version: '1.0.4', description: 'Reads escalations and routes them to the right team. Extended with the Agent 365 SDK.',
      dataSources: ['Embedded knowledge'], deployedTo: 'Customer Success group',
      tools: [tool('Service desk MCP server', 'MCP server', 2210, 1.9), tool('Microsoft Graph', 'Connector', 1590, .2), tool('Teams', 'Connector', 1020, .1), tool('CRM connector', 'Connector', 510, 4.7)],
      topUsers: [['Jordan Lee', 211], ['Maya Singh', 184], ['Owen Price', 119], ['Dara Kim', 93]], activity: { activeUsers: 41, sessions: 1745, exceptionRate: 2.1, hours: 198 },
      risks: [risk('High', 'Agent identity used outside its assigned scope', 'The agent identity accessed a mailbox that is not part of its assigned scope.', 'Microsoft Entra', 2), risk('Medium', 'Tool exception rate above threshold', 'The CRM connector returned errors on more than 4% of calls.', 'Microsoft Defender', 6)]
    }),
    a('AG-018', 'Field Service Dispatcher', { platform: 'Agents Toolkit', type: 'Agent Toolkit', owner: 'Tomás Alvarez', channels: ['Teams'], version: '0.8.3', description: 'Assigns technicians based on skills and location.', deployedTo: 'Operations group', activity: { activeUsers: 77, sessions: 510, exceptionRate: 3.2, hours: 61 } }),

    a('AG-019', 'Q4 Forecast Helper', { publisher: 'Your users', platform: 'Agent Builder', type: 'Agent Builder', owner: 'Aisha Khan', channels: ['Copilot'], version: '1.0.0', modified: '2026-10-30', description: 'Summarizes forecast spreadsheets for the finance team.', dataSources: ['Embedded knowledge'], knowledge: ['Q4-Forecast.xlsx'], deployedTo: 'Finance group', activity: { activeUsers: 12, sessions: 84, exceptionRate: 0, hours: 9 } }),
    a('AG-020', 'Onboarding Buddy', { publisher: 'Your users', platform: 'Agent Builder', type: 'Agent Builder', owner: null, channels: ['Copilot'], version: '1.2.0', modified: '2026-07-14', description: 'Created by an employee who has since left. No owner is assigned.', dataSources: ['Embedded knowledge'], deployedTo: 'All users', activity: { activeUsers: 29, sessions: 140, exceptionRate: 0, hours: 12 }, risks: [risk('Low', 'No active owner', 'The creator account was deleted. No one is accountable for this agent.', 'Agent 365', 1)] }),
    a('AG-021', 'Meeting Notes Summarizer', { publisher: 'Your users', platform: 'Agent Builder', type: 'Agent Builder', owner: null, channels: ['Teams'], version: '1.0.0', modified: '2026-06-02', description: 'Summarizes meeting transcripts. The creator account was deleted.', deployedTo: 'All users', activity: { activeUsers: 18, sessions: 96, exceptionRate: 0, hours: 6 }, risks: [risk('Low', 'No active owner', 'The creator account was deleted. No one is accountable for this agent.', 'Agent 365', 1)] }),
    a('AG-022', 'SharePoint Policy Finder', { publisher: 'Your users', platform: 'SharePoint', type: 'SharePoint', owner: 'Marcus Webb', channels: ['SharePoint'], version: '1.0.0', description: 'Searches the policy library site.', dataSources: ['SharePoint'], deployedTo: 'Operations group', activity: { activeUsers: 44, sessions: 205, exceptionRate: .2, hours: 17 } }),
    a('AG-023', 'Legacy Expense Bot', { publisher: 'Your users', platform: 'Copilot Studio Legacy', type: 'MCS CEA', owner: null, status: 'Blocked', channels: ['Teams'], version: '0.4.1', modified: '2026-05-10', description: 'Old expense helper. Blocked after the owner left.', deployedTo: 'Not deployed' }),
    a('AG-024', 'Web Research Helper', {
      publisher: 'Your users', platform: 'Agent Builder', type: 'Agent Builder', owner: 'Tomás Alvarez', channels: ['Copilot'], version: '1.1.0', modified: '2026-10-28', description: 'Combines web search with files from the creator’s OneDrive.', dataSources: ['Web', 'Embedded knowledge'], knowledge: ['OneDrive folder', 'Web search'], deployedTo: 'All users',
      activity: { activeUsers: 71, sessions: 330, exceptionRate: 1.1, hours: 24 },
      risks: [risk('High', 'Confidential files combined with web search', 'Files labeled Confidential are available to an agent that also queries the web.', 'Microsoft Purview', 5), risk('Medium', 'Prompt injection attempts', 'Instructions hidden in web content tried to override the agent’s behavior.', 'Microsoft Defender', 3)]
    }),
    a('AG-025', 'Customer Data Explorer', {
      publisher: 'Your users', platform: 'Copilot Studio', type: 'MCS CEA', owner: 'Maya Singh', channels: ['Teams'], version: '0.7.0', modified: '2026-10-31', description: 'Lets teammates ask questions about customer records.', dataSources: ['Embedded knowledge'], knowledge: ['Customer export (CSV)'], deployedTo: 'Customer Success group',
      activity: { activeUsers: 26, sessions: 150, exceptionRate: 0, hours: 11 },
      risks: [risk('High', 'Sensitive data in embedded knowledge', 'The uploaded file contains personal data without a sensitivity label.', 'Microsoft Purview', 1), risk('Medium', 'Shared with a broad audience', 'Shared with a group that is larger than the data owner’s approved audience.', 'Microsoft Purview', 1)]
    }),
    a('AG-026', 'Intern Project Agent', { publisher: 'Your users', platform: 'Agent Builder', type: 'Agent Builder', owner: 'Sam Okafor', status: 'Draft', channels: ['Copilot'], version: '0.1.0', modified: '2026-11-01', description: 'Draft. Not shared yet.', deployedTo: 'Not deployed' }),
    a('AG-027', 'Travel Policy Bot', { publisher: 'Your users', platform: 'Copilot Studio', type: 'MCS DA', owner: 'Lina Park', status: 'Draft', channels: ['Teams'], version: '0.2.0', modified: '2026-10-27', description: 'Draft. Not shared yet.', deployedTo: 'Not deployed' }),
    a('AG-028', 'Pricing Helper', { publisher: 'Your users', platform: 'Copilot Studio', type: 'MCS DA', owner: 'Jordan Lee', status: 'Not activated', channels: ['Teams'], version: '1.0.0', modified: '2026-11-01', description: 'Shared by its creator. Waiting for admin approval to publish to the Sales organization.', deployedTo: 'Just me' })
  ];

  const requests = [
    { id: 'REQ-310', agentId: 'AG-028', requestedBy: 'Jordan Lee', date: '2026-11-01', scope: 'Sales organization (1,240 users)', note: 'Share the pricing helper with all of Sales.' },
    { id: 'REQ-309', agentId: 'AG-005', requestedBy: 'Priya Shah', date: '2026-10-30', scope: 'Program Management group (86 users)', note: 'Activate Project Manager for the PMO pilot.' },
    { id: 'REQ-307', agentId: 'AG-027', requestedBy: 'Lina Park', date: '2026-10-28', scope: 'Finance group (310 users)', note: 'Publish the travel policy bot for Finance.' }
  ];

  const connectedPlatforms = [
    { name: 'Amazon Bedrock', connected: true, agents: 1, last: 'Nov 2, 06:00 UTC' },
    { name: 'Google Vertex AI', connected: true, agents: 1, last: 'Nov 2, 06:00 UTC' },
    { name: 'Other platforms', connected: false, agents: 0, last: 'Not connected' }
  ];

  const policyTemplates = [
    { id: 'PT-1', name: 'Standard protection', description: 'Baseline identity, data and threat protections for agents that use work data.', appliesTo: 14 },
    { id: 'PT-2', name: 'Strict protection', description: 'Adds stricter data loss prevention and blocks external model endpoints.', appliesTo: 3 },
    { id: 'PT-3', name: 'Sandbox', description: 'Minimal data access for early experiments. Not for agents shared widely.', appliesTo: 4 }
  ];

  const governanceRules = [
    { id: 'GR-1', name: 'Flag ownerless agents', description: 'Show agents with no active owner on the Overview page.', enabled: true },
    { id: 'GR-2', name: 'Require approval before org-wide publishing', description: 'Creators can share with themselves; wider sharing needs an admin approval.', enabled: true },
    { id: 'GR-3', name: 'Block agents with high risk signals', description: 'Automatically block an agent when a high severity signal stays open for 7 days.', enabled: false },
    { id: 'GR-4', name: 'Apply a policy template to new agents', description: 'New agents receive Standard protection by default.', enabled: true }
  ];

  return { agents, requests, connectedPlatforms, policyTemplates, governanceRules, make: a, snapshot: '2026-11-02T09:42:00Z', admin: { name: 'Priya Shah', role: 'AI Administrator' } };
})();

if (typeof module !== 'undefined') module.exports = Agent365Data;
