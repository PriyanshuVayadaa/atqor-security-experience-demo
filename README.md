# atQor Security Experience Center

An atQor-branded, independent Microsoft Security ecosystem concept using HTML5, CSS3, JavaScript, Chart.js 4.4.8, and Font Awesome Free 6.7.2. It is not a Microsoft product, authenticated portal, or production-ready security control plane.

## Run

Open [index.html](index.html) in Microsoft Edge, Chrome, or Firefox. No installation, build, server, credentials, or network connection is required. All runtime libraries and icon fonts are included locally in [assets](assets).

## Live demo

Public GitHub Pages demo: https://priyanshuvayadaa.github.io/atqor-security-experience-demo/

This is a static, public demonstration site. It contains fictional sample records and local-only simulations; do not enter real personal, tenant, or security data. No Microsoft tenant is connected and no security response action is executed.

The dashboard opens on the executive security overview. Use the sidebar for Defender, Intune, Entra, Purview, Security Copilot, reporting, and licensing views. Direct hash links such as `index.html#intune` also work.

## Product Portals And Branding

The original white atQor logo is installed locally in [assets/atqor-logo-white.png](assets/atqor-logo-white.png). The image is copied unchanged from the supplied local asset; its surrounding whitespace is framed with CSS in the app bar.

1. Open the dashboard, then select the nine-dot workspace button to the left of the atQor logo.
2. Choose Microsoft Defender, Microsoft Entra admin center, Microsoft Intune admin center, or Microsoft Purview.
3. Use that product's left-hand menu for its home, inventory, policies, and capability references. Select the atQor logo to return to the unified overview.
4. In Purview, use **Solutions** on the narrow left rail to open or close the solution catalog. In Defender, the narrow rail provides Home, Incidents, and Hunting shortcuts.

Each product has a distinct desktop layout based on the provided screenshot references:

- **Entra:** four summary panels for risk, tenant status, organization, and administrator persona; shortcuts; license reference; expanded identity navigation.
- **Defender:** narrow shortcut rail and solution menu, home feature band, source configuration tiles, Secure Score trend, and related incidents.
- **Intune:** admin center navigation, device management introduction, Status and Spotlight panels, device inventory, apps, and endpoint security policies.
- **Purview:** blue app bar, narrow navigation rail, Solutions flyout, solution tiles, and data security summary panels.

The screenshots are design references, not imported tenant telemetry. No tenant IDs, administrator passwords, screenshots containing account details, live role assignments, or Microsoft sign-in forms are embedded. The administrator panel is explicitly a sample persona that is not signed in. App and identity configuration tables are read-only fixtures. Microsoft product names remain as workload identifiers; atQor is the dashboard brand.

Direct local product links:

- [Microsoft Entra](index.html#entra)
- [Microsoft Defender](index.html#defender)
- [Microsoft Intune](index.html#intune)
- [Microsoft Purview](index.html#purview)

## Included Workflows

### Interactive demo visual polish

The four interactive experiences now share a scoped visual refinement layer in [demo-polish.css](demo-polish.css): consistent launch-card finish, improved action/focus states, clearer status typography, subtle depth, and responsive-safe spacing while preserving each demo's character.

- **Conditional Access**: tighter vertical rhythm, more visible policy rows, sharper state pills, and clearer outcome panels.
- **Entra Demo Reel**: stronger scene/object/status legibility while retaining the cinematic dark environment and reduced-motion behavior.
- **Purview Copilot Agent**: cohesive blue policy/block and scripted-output treatment, more readable conversation metadata, and refined welcome cards. Enforcement and privacy behavior are unchanged.
- **Intune device protection**: higher-contrast operations content and unmistakable blocked/allowed states; the underlying compliance/access and app-protection boundaries are unchanged.

Visual responsiveness was checked at 1366×768, 844×390, 390×844, and 320×568. All four roots fit the viewport; the chat and CA workspace retain their intended internal scrolling. Reduced-motion preferences remain respected.

### Populated Defender sample environment

Defender Home and its solution menu now open **15 populated modules with 104 linked, read-only sample records**:

| Module | Records | Examples |
| --- | ---: | --- |
| Device inventory | 10 | Windows, macOS and Linux assets, exposure, primary user and sensor reporting context |
| Defender incidents | 8 | Correlated cases, severity, owner, alert count and affected entities |
| Endpoints | 8 | Process-chain context, prevention signals, quarantines and sensor gaps |
| Identities | 6 | Identity-related evidence with explicit source provenance and sensor prerequisites |
| Email & collaboration | 8 | Synthetic message subjects, verdicts, recipients and delivery outcomes |
| Cloud apps | 6 | App consent, privilege, sharing and integration review findings |
| Vulnerability Management | 8 | Fictional version/baseline gaps, devices, priorities and remediation ownership |
| Exposure management | 6 | Prioritized control gaps and linked remediation work items |
| Campaigns | 6 | Grouped phishing/consent patterns and benign comparators |
| Threat intelligence | 6 | Fictional analysis briefs and preparedness guidance, not current Microsoft intelligence |
| Investigation & response | 6 | Evidence scope, analyst workflow and approval checkpoints |
| Response action history | 6 | Pending recommendations and completed fixture outcomes with owning-service boundaries |
| Setup & configuration | 8 | Policy references, assignments, deployment prerequisites and disconnected integrations |
| Reports | 6 | Operational report definitions with clearly separated fixed aggregates |
| Learning hub | 6 | Fictional analyst exercises and linked investigation examples |

Search, state filters, business-unit scoping, derived metric cards, detail blades, UTC evidence timelines, related-module shortcuts and visible-record CSV exports work throughout. Activity modules honor the reporting-period filter; inventory, configuration, exposure, intelligence, reporting definitions and learning assignments are fixed snapshots. Shared tenant records remain visible in each business-unit scope. No device isolation, scan, file deletion, email purge, session revocation, permission change or remediation is executed.

Start at **Defender incidents → INC-2481** to follow linked mail, identity, endpoint, cloud-app, investigation and response evidence. **INC-2480** links the finance endpoint detection and containment approval; **INC-2476** retains the completed quarantine story. These overlapping case IDs reference the original seeded scenarios, but the module tables do not synchronize with session-only edits in the existing cross-workload queues. Advanced hunting, Cross-workload incidents and Action center remain available as separate existing workspaces. Arbitrary KQL is never executed.

The November 2, 2026 09:42 UTC snapshot is fictional and offline. Executive counts (including protected endpoints, critical findings, blocked threats and campaign recipients) are independent fixtures, not inferred from these small record subsets. No specific real CVE, malicious URL, executable payload, actor attribution or live sensor status is asserted. Identity, endpoint, Office 365, Cloud Apps and premium vulnerability capabilities retain workload-specific licensing and deployment requirements. CSV exports identify the simulated product/scope and neutralize formula-like prefixes.

### Defender Attack Stories · Episode 01: Suspicious download

Open **Microsoft Defender → Attack response reel**, or launch the story from Defender Home. This full-screen reel is told through realistic, fictional screens: Sarah Chen's inbox, a browser download warning, a Windows security alert on FIN-LT-042, then a cut to the SOC's Defender-style portal (labeled navigation, incident tabs, attack-story graph, alert pane and evidence table). Alex opens the incident, a simulated automated investigation runs, and a "Contain and collect" playbook gathers evidence while isolation waits for analyst approval, before the single **Isolate device** response. A chapter title, subtitle-style narration, moving cursor and a story rail show where the story is happening. It is designed for desktop presentation; mobile layouts are intentionally not supported.

At the warning, the audience can **stop and report** or **continue with the fictional sample**. Stopping ends with no download, endpoint execution, or incident in that branch. The proceed branch models a suspicious endpoint behavior signal and a sample XDR incident; no real file, URL, command, or malware is present. At the second gate, the audience can **recommend isolation** or **continue investigation**. Isolation is approved and shown only inside the story, followed by recovery verification still pending. The investigation branch leaves the endpoint unisolated and exposure unresolved. Replay allows comparison of outcomes.

Controls include previous/next, play/pause, replay, scene pace, evidence details, keyboard/Escape behavior, and responsive presentation. Browser reputation, Defender for Endpoint, Defender XDR, and analyst actions are shown as separate capabilities with configuration/licensing caveats. A warning is not guaranteed for every file; endpoint detection and incident correlation depend on supported products, sensor coverage, configuration and available telemetry. Isolation is not malware removal or verified recovery. This is a fixed local narrative, not a sensor demo or connected tenant workflow; no actual download, execution, API request, isolation, removal, or tenant response occurs.

Implementation: [defender-attack-reel.js](defender-attack-reel.js), [defender-attack-reel-ui.js](defender-attack-reel-ui.js), [defender-attack-reel.css](defender-attack-reel.css), routing in [app.js](app.js), and [tests/defender-attack-reel.test.cjs](tests/defender-attack-reel.test.cjs). The full suite contains **127 passing tests**. Browser checks cover both employee and analyst branches, the in-screen choices, evidence drawer, keyboard exit, and desktop full-screen geometry.

### Product stories: Entra, Intune and Purview

Each product has a cinematic, realistic-screen story built on the same engine as the Defender reel (desktop only, fictional, offline). Launch from the product Home card or the menu entry.

- **Microsoft Entra · Sign-in story**: a sign-in with a leaked password is flagged by ID Protection, blocked by Conditional Access (error 53003), then the admin chooses *Reset password & revoke sessions*. Blocking a sign-in is not session revocation.
- **Microsoft Intune · Compliance story**: encryption drifts, the ERP blocks the laptop, the employee fixes it in Company Portal, and access returns only after Intune verifies the next check-in.
- **Microsoft Purview · Data protection story**: a Confidential file is emailed to an external partner, a DLP policy tip stops it, and an analyst resolves the alert. The rule covers the modeled email scenario only.

Implementation: [story-episodes.js](story-episodes.js) (pure model), [story-screens.js](story-screens.js) (screens, visuals, endings), [story-ui.js](story-ui.js) (player), [story-screens.css](story-screens.css), routing in [app.js](app.js), and [tests/story-episodes.test.cjs](tests/story-episodes.test.cjs).

Implementation: [defender-data.js](defender-data.js), the shared configurable [purview-modules-ui.js](purview-modules-ui.js) and [purview-modules.css](purview-modules.css), routing in [app.js](app.js), and [tests/defender-data.test.cjs](tests/defender-data.test.cjs). The shared renderer keeps Defender/Purview filters separate and uses the correct product name in details and exports. Browser checks cover every Defender module/detail/link, filtered export, time/unit/state/search filters, desktop/mobile light/dark layouts, and existing hunting/action/Purview regressions.

### Populated Purview sample environment

Every Purview solution menu and Home tile opens a populated module rather than a capability-only dialog. The environment includes **12 solutions and 111 curated records**, in addition to the separate interactive Copilot Agent chatbot:

| Solution | Records | Examples |
| --- | ---: | --- |
| Data Loss Prevention | 10 | Assigned policies, supported locations, enabled/simulation/disabled states, owners and exclusions |
| DLP policy matches | 12 | 38 grouped seven-day matches; item, policy outcome, review status and linked policy |
| Audit | 14 | Actor, operation, object, workload, UTC timestamp, correlation and linked evidence |
| Communication Compliance | 8 | Anonymized policy-matched communications with review/escalation context |
| Data Lifecycle Management | 12 | Retention duration, trigger, location, owner and end-of-period action |
| Information Protection | 8 | Published sensitivity labels, encryption rights, scope and labeling method |
| Data Security Posture Management | 8 | Exposure findings, affected scope, priority, owner and recommended action |
| eDiscovery | 6 | Cases, custodians, hold scopes, collection/review state and authorized reviewers |
| Insider Risk Management | 7 | Anonymized alerts, policy indicators, context and reviewer workflow |
| Data classification | 12 | Classified documents, locations, sensitivity labels and access-review context |
| Records Management | 6 | Record sets, retention references, disposition stages and hold constraints |
| AI data security activity | 8 | Seeded input protection, label, audit-only, inspection-failure and review examples |

Each module supports search, state filtering, business-unit scoping, inspectable detail blades, evidence timelines, related-solution shortcuts and CSV export of visible records. Activity modules also honor the selected reporting period; configuration, inventory, posture findings and cases remain point-in-time snapshots. Shared tenant records appear in each business-unit scope. Metric cards derive from the visible fixture rows, except **Source records**, which is the fixed full module size. The DLP policy-match card sums grouped matches: 38 tenant-wide, split Finance 21 / Engineering 8 / Operations 9 in the seven-day fixture. Audit and Communication Compliance include older events visible under a 30-day filter.

Detail blades link related sample evidence (for example DLP-2601 → DLP-FIN-001, classified content → its label, and records → retention references). No source-service configuration, message review decision, policy enforcement, label change, legal search, preservation, deletion or disposition is performed. Policy matches and risk findings do not establish data loss or misconduct. Communication and insider-risk participants remain anonymized and no identity-reveal action is available. The AI activity view is seeded data, separate from the current chatbot's session evidence; the AI input policy pilot explicitly remains simulation-only.

These curated records are not a full tenant inventory. Existing executive aggregates remain independent fixed demonstration values; only the 38-match grouping is deliberately reconciled. All people, domains, items, reviewer assignments, GUIDs and outcomes are fictional. Source IPs use documentation-only ranges. Counts, legal durations and status fields are illustrative, not entitlement or regulatory advice. CSV exports include simulation/scope disclaimers and neutralize formula-like leading cell values.

Implementation: [purview-data.js](purview-data.js), [purview-modules-ui.js](purview-modules-ui.js), [purview-modules.css](purview-modules.css), and [tests/purview-data.test.cjs](tests/purview-data.test.cjs). Tests validate complete coverage, schemas, linked records, fixture totals, scope/time/state/search filters, privacy boundaries and timestamps.

### Intune: device and app protection showcase

The Intune admin-center navigation and Home now also expose a complete **15-module, 120-record fictional reference catalog**, separate from the interactive scenario demo below:

| Module | Records | Examples |
| --- | ---: | --- |
| Device inventory | 8 | Windows 10/11, macOS and iOS ownership, check-in context and assignment links |
| Device compliance | 8 | Encryption, OS baseline, Defender risk, app-protection scope and offline/unknown state |
| Endpoint security | 8 | BitLocker, antivirus, firewall, ASR, EDR, macOS and account protection references |
| Configuration profiles | 8 | Settings catalog, device restrictions, app configuration, Wi-Fi and certificate assignments |
| Managed applications | 8 | Required/available assignments, platforms and deployment context |
| App protection policies | 8 | Work-data transfer, supported apps, selective-wipe boundaries and enrollment distinction |
| Windows updates | 8 | Quality/feature/driver rings, rollout deferrals, safeguards and restart context |
| Windows Autopilot | 8 | Fictional device/profile states and provisioning prerequisites; no hardware hashes |
| Intune users | 8 | Assignment principals linked to their selected primary device; identity remains in Entra |
| Assignment groups | 8 | Fictional targeting groups with overlapping aggregate membership caveats |
| Tenant administration | 8 | MDM authority, connectors, roles, service-health and entitlement references |
| Intune dashboard | 8 | Operational cards with fixed aggregates separated from selected detail subsets |
| All services | 8 | Capability, deployment prerequisite and licensing boundaries |
| Intune reports | 8 | Report definitions and result references; not live service exports |
| Troubleshooting & support | 8 | Safe diagnostic guidance; no support ticket or device command |

Every module supports local search, state filtering, business-unit scoping, inspectable detail/timelines, related-module links and CSV export of visible records. Activity views honor the selected reporting period; tenant, policy, entitlement, dashboard definition and support references are point-in-time fixtures. The existing original named endpoint examples are retained, including the Windows 10 OPS-LT-118 encryption finding. Aggregate device/compliance metrics are not inferred from the eight inventory rows.

The Device inventory, Device compliance, Endpoint security, Configuration profiles, Managed applications, App protection policies, Windows updates, Windows Autopilot, Intune users, Assignment groups, Tenant administration, Intune dashboard, All services, Intune reports and Troubleshooting & support menu destinations each open their matching module. The contextual inventory, security-policy and capabilities tabs route to populated modules as well. **Device protection demo** remains a separate, interactive three-story experience. No enrollment, policy deployment, app installation, update, group change, device action, wipe, or support request is performed. Intune evaluates compliance; Conditional Access enforcement is a separate Entra configuration for new resource requests. App protection controls supported targeted apps and does not by itself assert whole-device compliance.

Implementation: [intune-data.js](intune-data.js), the shared configurable [purview-modules-ui.js](purview-modules-ui.js), Intune routing in [app.js](app.js), and [tests/intune-data.test.cjs](tests/intune-data.test.cjs). The full suite now has **100 passing tests**.

Open **Microsoft Intune → Launch device protection** on Home, or **Device protection demo** in the Intune menu. This separate, blue full-screen experience pairs a fictional employee's laptop/phone with the protection controls behind it. The main viewport and work-action button stay pinned; detailed device messages and the operations panel scroll independently when space is limited.

Three interactive stories are included:

| Story | Try it | What the audience sees |
| --- | --- | --- |
| Unencrypted laptop | Open Finance workspace → simulate enabling BitLocker → check compliance → retry | The new app request is blocked while noncompliant. A simulated fix alone does not restore access; a successful check-in must verify the state first. |
| High-risk endpoint | Open Engineering workspace → simulate analyst remediation → check compliance → retry | Defender supplies the device-risk signal, Intune evaluates the configured risk requirement, and Entra Conditional Access enforces the compliant-device requirement. Sync alone never removes threats or lowers risk. |
| Mobile work data | Copy work Outlook content to Personal Notes → choose a protected destination → retry | Intune App Protection blocks the personal-app transfer. Supported OneNote with a work account is the simulated allowed destination; the personal destination stays restricted. No whole-device compliance assertion is made for the personal phone. |

Windows examples include a **Device online** toggle. Offline check-in cannot verify a requested fix. All work actions, simulated remediation requests, and check-ins have a two-second local loading state; real provisioning, disk encryption, risk remediation and service propagation can take much longer. Changing stories, reset, exit or navigation cancels pending timers. No actual device, sign-in, clipboard, policy assignment, inventory KPI, or baseline fixture is changed.

The scenarios assume enrolled, identified Windows devices, assigned compliance policies, effective noncompliance enforcement without a grace-period delay, appropriate integrations, satisfied MFA, and user resource permissions. All other applicable conditions are assumed satisfied. **Intune evaluates compliance; Entra Conditional Access blocks new resource requests** when configured to require that state. Existing sessions/tokens are not modeled or claimed terminated. For mobile, the supported apps and user are assumed already targeted by an applied App Protection policy. Android/iOS support, protected-app versions, identity registration, licensing and prerequisites must be verified for production. No personal content inspection, enrollment action, remote wipe, isolation, password collection, malware removal or real encryption occurs.

Use **How it works** for role boundaries and scenario prerequisites, and **View all** in Latest activity for metadata evidence and JSON export. Events retain the last 40 entries; work-action history retains eight decisions. Restart clears the current story; exit/reload/app rerender starts the default encryption story again. These scenes are independent of global period/business-unit filters and other demos.

Sources: [Intune compliance and Conditional Access](https://learn.microsoft.com/en-us/intune/intune-service/protect/device-compliance-get-started), [Intune App Protection](https://learn.microsoft.com/en-us/intune/intune-service/apps/app-protection-policy). Intune, Entra and Defender features require their corresponding entitlements and configured integrations; no blanket E7 entitlement is implied.

Implementation: [intune-device-demo.js](intune-device-demo.js), [intune-device-demo-ui.js](intune-device-demo-ui.js), [intune-device-demo.css](intune-device-demo.css), and [tests/intune-device-demo.test.cjs](tests/intune-device-demo.test.cjs). Run all regression tests with `node --test tests/*.test.cjs`.

### Purview: protect agents from sensitive inputs

Open **Microsoft Purview → Open protected chatbot** on Home, or **Solutions → Agent data protection**. This full-screen chatbot demonstrates **user types/attaches → Send → inspection → policy decision → guarded agent invocation**. It belongs to Purview's data-protection showcase, not Entra identity risk.

**Maya**, a fictional employee, chats with **Copilot Agent**, the user-named scripted demo agent—not a live Microsoft Copilot connection. The interface has a familiar conversation, editable message composer, file chip/preview, attachment button, and **Send** control. Five examples cover PII attachments, payment details, restricted labels, PII in a message, and ordinary project text. The desktop sidebar selects examples; compact screens use an example selector. Select **New conversation** to reset to the initial synthetic PII attachment.

The enterprise-style presentation uses a navy workspace sidebar, blue accents and send controls, conversation titles, readable message bubbles, TXT attachment cards, and local UTC timestamps on exchanges. Conversation output, policy-block cards, audit notices, and protection-activity status cards use matching blue tones; explicit labels and icons distinguish blocked, allowed, and audit-only results. The welcome suggestions load examples without sending. The optional **Protection activity** rail shows the request path and a local request receipt; its header toggle hides/restores it without losing conversation scroll position. Narrow screens omit the rail while keeping policy notices and evidence accessible inside the chat. The main page stays full-screen with a pinned composer and independently scrollable conversation. These presentation changes do not alter enforcement or imply a live tenant/model connection.

Click **Send** (or Enter; Shift+Enter inserts a newline). The application inspects the message and attachment together and applies the policy in one guarded operation. Enforced matches produce an in-conversation **Data protection policy / Blocked** card, showing matched categories and **Not delivered to the agent · 0 model calls for this request**. This is a message from the application's protection layer, not a refusal from an agent that already saw the data. Allowed requests get a clearly scripted Copilot Agent response. The optional desktop protection panel shows latest-request and conversation-total simulated model-call counts.

**Remove detected identifiers & review draft** updates the current draft but never automatically sends it. Review the revised message and file, then click **Send** again to trigger fresh inspection and a new decision. The previous blocked exchange stays in the conversation. Editing the input invalidates old cleanup actions. Removing identifiers does not remove a restricted label; an approved example can be selected explicitly. **Remove attachment** removes that file and its simulated label metadata; the remaining message is still inspected. No enforced-block override is offered.

**Audit-only** is a deliberate comparison: matching content is permitted to reach the simulated agent, with an explicit exposure warning. It is not protection by blocking. **Inspection unavailable** demonstrates a custom gateway configured to fail closed, including in audit-only mode. There is no user override of an enforced block or inspection failure. Changing text, policy mode, label, or service availability clears the old scan, decision, and delivery state.

Use **Attach .txt** for a synthetic, unencrypted plain-text file of at most 32 KiB, or click the attachment chip to edit its contents/label. Only .txt files are accepted; combined text and prompt length is limited to 32,768 characters. No PDF, Office, image, encrypted, or binary parsing is implemented. No upload request or model API is made. Draft content is visible in the composer/editor and held only in page memory, never browser storage or evidence exports. Conversation history masks the configured identifier patterns; other potentially sensitive text may remain visible. Exit/reload/app rerender, new conversation, or changing the selected example clears the conversation. Original local filenames are replaced with a generic test filename. The last eight exchanges are retained per conversation; total simulated calls continue counting until reset.

**Coverage & integration:** real Purview supports classification, sensitivity labels, DLP, and compliance capabilities in supported workloads and configured AI integrations. This demo instead illustrates a **custom agent application's pre-invocation enforcement integration** using local pattern/checksum examples. It does not show a universally available Purview setting that automatically blocks every agent upload. A production application must integrate supported protection services and enforce decisions consistently across ingestion routes, with proper permissions, licensing, file handling, and error/bypass controls. A browser demo is not a security boundary.

The examples recognize email addresses, US SSN-shaped and phone-shaped strings, Luhn-valid payment-card candidates, and a user-selected simulated General/Confidential/Highly Confidential label. They are **not the Purview classifier**, contextual PII recognition, OCR, automatic label discovery, or a guarantee of sensitivity detection. Names, addresses, non-US identifiers, secrets, obfuscated input, prompt injection, retrieval permissions, model output leakage, and tool authorization are not covered. Generic agent responses are scripted and never reproduce the submitted text.

**Evidence** and its JSON export contain metadata only: rule categories, sources, counts, label, mode, action, and timestamp. They exclude raw text, prompts, matches, and original filenames. These events are not actual Purview DLP alerts or Audit records. Model history is capped at eight decisions and 40 events. **Protection details / How this demo works** contains optional comparison settings (policy mode and service availability), scope boundaries, and official references. Labels can be set in the attachment preview. Chat scrolls independently while the composer stays pinned; the overall fullscreen view does not scroll.

- [Microsoft Purview protections for AI apps and agents](https://learn.microsoft.com/en-us/purview/ai-microsoft-purview)
- [Data loss prevention scope and supported actions](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp)

Implementation: [purview-agent-demo.js](purview-agent-demo.js) retains the detection/enforcement model; [purview-agent-chat.js](purview-agent-chat.js) manages conversation state; [purview-agent-chat-ui.js](purview-agent-chat-ui.js) and [purview-agent-chat.css](purview-agent-chat.css) provide the chatbot interface. [tests/purview-agent-demo.test.cjs](tests/purview-agent-demo.test.cjs) and [tests/purview-agent-chat.test.cjs](tests/purview-agent-chat.test.cjs) cover invocation gating, explicit retry, stale actions, prompt-only checks, attachment removal, labels, audit exposure, outages, text/file validation, privacy, and bounded history. The earlier pure narrative controller and its tests remain available as inactive reference code; its illustrated UI is no longer loaded.

### Audience-facing Entra Demo Reel

Open **Microsoft Entra → Entra demo reel**, or select **Launch Entra reel** on Entra Home. This is a separate presentation section: it tells unfolding stories instead of asking the audience to configure policies. The existing policy workspace and tenant-reference tables remain available and unchanged.

Four seven-scene episodes show the environment, incoming signal/request, detection or review, enforcement, an audience response decision, response execution, and outcome:

| Episode | Audience interaction | Visible outcome |
| --- | --- | --- |
| Risky identity | Contain and verify the user, or block only the new attempt | Verified remediation versus an open investigation with unresolved earlier access |
| Privileged access | Approve a justified 60-minute activation, or deny | Eligible → active → expired, or eligibility without activation |
| Device compliance | Remediate and verify a device check-in, or leave it noncompliant | Fresh ERP access after verified compliance, or continued denial despite MFA |
| Guest access review | Deny continued project membership, or retain it with justification | Removal of the scoped group membership, or a governed exception; the guest object remains |

The reel opens **full-screen by default**, fitted to the viewport with no primary-stage scrolling. It uses a third-person observer map: the employee, incoming signal, Entra control plane, and target resource remain visible while their states and connecting access paths change. The primary view has one short headline and one caption rather than explanatory paragraphs. Click any environment object or **Scene details** for optional context, complete evidence, capabilities, and limitations in a separate scrollable drawer.

Use **Play** for timed progression or **Next scene** to control pacing. Playback stops at the audience decision and the manual verification/expiration checkpoint. **Compare responses** returns to the decision and replaces branch-specific evidence. The restart button resets the current story. Controls stay pinned on screen. Blocked requests animate only up to the block marker, not into the protected resource.

The exit button or Escape returns to Entra Home; when details are open, Escape closes that drawer first. This full-viewport overlay does not request browser fullscreen. Keyboard focus stays inside the reel (or its open drawer). Playback pauses on hidden pages, navigation, or opening details. Returning preserves the scene but never silently resumes playback. Reduced-motion preferences disable animations. Global filters, editable-policy changes, and baseline tenant fixtures remain independent.

Every episode is fictional, with deterministic story-clock timestamps and compressed time. No tenant API, live detection, actual approval, authentication challenge, session revocation, device remediation, or access-review action occurs. A blocked sign-in does not revoke earlier sessions; revocation and role expiration are not promises of instantaneous termination of all resource tokens; device compliance requires a verified check-in; guest membership removal is not guest-account deletion. Licensing and configured integrations must be validated independently. This reel covers four selected stories, not all Entra capabilities.

Story data and the branching player are in [entra-reel.js](entra-reel.js); concise observer frames are in [entra-reel-observer.js](entra-reel-observer.js), presentation logic in [entra-reel-observer-ui.js](entra-reel-observer-ui.js), and viewport-scoped styles in [entra-reel-observer.css](entra-reel-observer.css). [tests/entra-reel.test.cjs](tests/entra-reel.test.cjs) and [tests/entra-reel-observer.test.cjs](tests/entra-reel-observer.test.cjs) cover all eight paths, decision gates, outcome differences, chronology, replay/back behavior, concise captions, and visual access-state accuracy. Run all suites with `node --test tests/*.test.cjs`.

### Interactive module 01: Conditional Access

Open **Microsoft Entra → Conditional Access → Policies · demo workspace**, or select **Manage demo policies** on Entra Home. This is a compact portal-style workspace, not the audience-facing Demo Reel. The original 20-policy dataset remains read-only under **Tenant reference (20)**. Other Entra modules remain populated reference views; the reel adds illustrative stories for selected capabilities but not full native admin workflows.

Select **New policy**, or click an existing policy name. The editor supports user/department/admin targeting, one explicit demo-user exclusion, target resources, location/risk/client/pilot conditions, grant controls, and On/Report-only/Off state. Grant controls are AND-combined; Block access is exclusive. New policies default to report-only. **Create & test** or **Save & test** opens a sign-in test blade using the saved configuration. Unsaved or cancelled edits do not affect decisions. Delete and reset require confirmation.

**Test sign-in** accepts custom inputs or five quick examples. Evaluation uses the actual saved workspace policies. Policy edits increment a configuration revision and mark the last result historical until retested. The before/after panel identifies input changes as well as policy creations, edits, and deletions. **Test sign-ins** retains the last eight results with original policy snapshots; **Activity** retains the last 100 local events. **Export workspace** downloads labeled JSON containing configuration, tests, and local activity.

The editable teaching model starts with **CA001, CA002, CA003, CA004, CA006, CA009, CA014, and CA019** and supports up to 40 total workspace policies. The other 12 tenant-reference policies are not evaluated. Explicit blocks and missing device requirements prevent access; unmet MFA or authentication-strength controls require additional authentication; report-only results never enforce access. A legacy client cannot satisfy modern MFA controls. “Granted” means modeled controls were satisfied, not that application permissions exist or a real token was issued. Supported user exclusions take precedence over inclusions. Emergency accounts, guest trust, service identities, platforms, session/token behavior, and service dependencies are not evaluated. Priya is assumed to be an active administrator only for the sandbox. This is **not Microsoft's What If engine**.

Workspace changes are isolated from baseline users, tenant-reference policies, sign-in logs, and aggregate metrics. No real MFA prompt, role activation, tenant API, or remediation runs. Local state survives navigation and theme changes, but reload/reset clears it. Global scope/date filters do not affect the workspace. Events use the browser's current UTC time and are not Microsoft audit records.

The editable model is in [entra-ca-workspace.js](entra-ca-workspace.js), the interface in [entra-ca-workspace-ui.js](entra-ca-workspace-ui.js), and scoped styles in [entra-ca-workspace.css](entra-ca-workspace.css). Shared personas, example inputs, and original baseline rules remain in [entra-ca-demo.js](entra-ca-demo.js). Tests in [tests/entra-ca-demo.test.cjs](tests/entra-ca-demo.test.cjs) and [tests/entra-ca-workspace.test.cjs](tests/entra-ca-workspace.test.cjs) verify all 2,304 input combinations, editable-policy behavior, exclusions, state changes, block precedence, report-only behavior, immutable historical evidence, validation, and reset. Run `node --test tests/*.test.cjs` from the project directory with Node.js. Node is only required for development tests, not dashboard use.

### Populated Entra demonstration

Entra includes 22 populated modules and 201 curated records: directory users, groups, devices, enterprise apps, app registrations, roles, PIM, MFA, authentication methods, sign-in logs, risky users, governance, access reviews, access packages, external identities, audit logs, hybrid sync, tenant details, administrator profile, named locations, Secure Score, and favorites. Conditional Access adds 20 inspectable policies (18 enabled and 2 report-only).

Each module supports search, business-unit scoping, record inspection, and filtered CSV export. Activity tables also respect the reporting period; inventory remains a point-in-time snapshot. Module metric cards are explicitly fixed tenant-wide aggregates, not counts calculated from the selected table subset. Risky users includes the full seeded population of 18 users, with one high-risk user in each business unit. Sign-in logs and risky sign-ins are separate views over the same event fixtures.

The home page retains the template and adds sign-in trends, a high-risk investigation queue, and capability shortcuts. Healthy hybrid synchronization, policy evaluation results, application permissions, role activation history, and audit events are **fictional fixtures**, not live connections or executed actions. Documentation-only IP ranges and fictional identities are used. No credentials, tenant authentication, network APIs, or production changes are introduced.

- Desktop-focused Microsoft admin portal styling: compact app bar, neutral navigation, contextual workload menus, command bars, readable data grids, and right-side detail panes.
- Executive overview tabs for posture, exposure recommendations, and workload health. Integration states are explicitly local sample sources, not fabricated live service connections.
- Advanced Hunting workbench with two documented KQL template shapes and scoped fixture results. Arbitrary query text is never evaluated; editing clears prior results.
- Action center with Pending, History, and All actions views. Demo approval or rejection requires explicit confirmation, records local review history, and never invokes a response API.
- Product policy tables with read-only policy detail panes, including Conditional Access enabled and report-only examples.
- Incident detail tabs for Overview, Evidence & response, and an in-memory Activity log. Local activity is not a service-side audit trail.
- Reporting-period and business-unit filters update sample activity metrics and scoped records. Inventory and compliance metrics represent point-in-time snapshots.
- Global search finds incidents, entities, and documented product capabilities. Incident results respect the selected scope.
- The incident queue supports text, severity, and status filtering. Investigation dialogs include evidence, recommendations, analyst assignment, and status editing.
- Product views include trends, inventory or policy tables, inspectable records, capability descriptions, and licensing boundaries.
- Security Copilot demonstrates incident summarization, threat intelligence assessment, posture recommendations, KQL assistance, and response guidance through deterministic local templates.
- CSV export contains a clear simulated-data disclaimer, scope, executive metrics, and matching curated incident records.
- Theme selection is stored locally where permitted. Mobile navigation, keyboard focus indicators, labeled controls, a skip link, and reduced-motion support are included.

## Source history

GitHub commit history provides the public source revision history. Machine-local rollback archives and scripts are intentionally excluded from the hosted repository.

## Data And Licensing Boundaries

All organizations, people, devices, incidents, scores, integration states, and counts are fictional. The fixed sample snapshot is November 2, 2026. Relative timestamps are relative to that snapshot, not the current clock.

The curated incident and inventory rows are small demonstration subsets. Aggregate KPIs are separate fixtures, not totals derived from those rows. Editing a record changes this browser session only; aggregate snapshots remain unchanged. Reloading restores the original records. Time filtering uses deterministic scaling for aggregate activity counts and sample age fields for the incident subset. Fixed configuration highlights are explicitly labeled as all-unit snapshots.

"Identity Protection Score" is an executive display label mapped to the sample Identity Secure Score, not a separate Microsoft metric. MFA coverage means registration, not enforced MFA. Microsoft Secure Score is normalized to 100 and is not a guarantee of security. DLP matches and insider risk alerts are not proof of data loss or misconduct.

The exact current Microsoft 365 E7 bundle could not be independently verified during implementation. E7 is therefore presented as the requested ecosystem concept, not a verified SKU entitlement matrix. Validate current Microsoft Product Terms, offer documentation, purchased licenses, region, capacity, and prerequisites. E5, Entra Suite, Intune Suite, premium vulnerability management, Purview workloads, Microsoft 365 Copilot, and Microsoft Security Copilot must not be treated as interchangeable entitlements.

The capability labels mean:

- **Available capability:** an actual product feature, not a promise of inclusion in every license.
- **License-dependent:** premium features, plans, capacity, or workload-specific requirements must be verified.
- **Integrated:** a capability involving multiple configured products, with prerequisites and separate entitlements where applicable.

## Structure

| File | Responsibility |
| --- | --- |
| [index.html](index.html) | Accessible application shell, navigation, global controls, and modal container |
| [styles.css](styles.css) | Design tokens, light/dark themes, responsive layouts, and motion preferences |
| [data.js](data.js) | Seeded records, product capability catalog, licensing notes, and scoped metric fixtures |
| [app.js](app.js) | Rendering, state, charts, filtering, local investigation updates, export, and scripted assistant |
| [rollback.ps1](rollback.ps1) | Verified baseline restoration with pre-rollback backup and a verification-only mode |
| [assets/chart.umd.min.js](assets/chart.umd.min.js) | Pinned local Chart.js distribution |
| [assets/fontawesome/css/all.min.css](assets/fontawesome/css/all.min.css) | Pinned Font Awesome styles; fonts are in its sibling webfonts directory |

Third-party licenses are preserved in [assets/Chart-LICENSE.md](assets/Chart-LICENSE.md) and [assets/FontAwesome-LICENSE.txt](assets/FontAwesome-LICENSE.txt). Microsoft product names and trademarks belong to their respective owners.

## Future API Integration

The fixture catalog and rendering are separated. A production integration should replace fixture reads with an authenticated service adapter, not add secrets or privileged Graph calls to this static browser client.

Recommended flow: browser -> authenticated backend-for-frontend -> Microsoft Graph and supported Microsoft security workload APIs.

1. Add Microsoft Entra authentication using a supported MSAL flow. Put application credentials or certificates in a managed backend, never in browser code. Use managed identity where supported.
2. Define explicit domain models for each source and normalize only the fields needed by the UI. Defender incidents, Intune compliance findings, Entra risk detections, and Purview alerts are different entities and must retain provenance.
3. Use documented Microsoft Graph v1.0 endpoints where available: `/security/incidents`, `/security/alerts_v2`, `/deviceManagement/managedDevices`, `/identityProtection/riskyUsers`, `/identityProtection/riskDetections`, `/auditLogs/signIns`, and `/identity/conditionalAccess/policies`. Validate each endpoint's current availability, schema, permissions, and licensing.
4. Evaluate least-privilege permissions such as `SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `DeviceManagementManagedDevices.Read.All`, `IdentityRiskyUser.Read.All`, `IdentityRiskEvent.Read.All`, `AuditLog.Read.All`, and `Policy.Read.All` against the specific endpoint and authentication mode. Obtain administrator consent only for the required scopes. Do not blanket-request this list.
5. Use supported Defender XDR hunting and Defender for Endpoint APIs for workload-specific data. Use supported Purview APIs per workload; not every portal report, case, or policy has a general Graph equivalent.
6. Map business units through verified groups, asset ownership, or authoritative organizational metadata, not client-side naming guesses. Enforce tenant and scope access on the backend, including for exported data.
7. Support pagination, throttling and `Retry-After`, caching, partial errors, stale-data indicators, cancellation, and source timestamps. Compute aggregate metrics from consistent source definitions.
8. Enforce RBAC, approval, audit trails, and concurrency controls before enabling response actions. This prototype deliberately provides no isolation, user blocking, session revocation, policy changes, or remediation API calls.
9. Integrate actual Security Copilot only through supported, licensed mechanisms. Add source grounding, prompt protections, human review, and monitoring. The local template assistant is not an API adapter or an LLM.

## Validation

Browser checks cover populated chart canvases, time and unit filters, product navigation and inventory dialogs, capability tabs, incident search and editing, global search drill-downs, scripted investigation and hunting responses, CSV payload generation, and mobile navigation. Desktop and mobile screenshots are reviewed for layout and overflow. No authenticated Microsoft tenant integration or real AI service is tested or implied.

## References

- [Microsoft Product Terms](https://www.microsoft.com/licensing/terms/)
- [Microsoft Defender XDR](https://learn.microsoft.com/en-us/defender-xdr/)
- [Microsoft Intune](https://learn.microsoft.com/en-us/intune/)
- [Microsoft Entra licensing](https://learn.microsoft.com/en-us/entra/fundamentals/licensing)
- [Microsoft Purview](https://learn.microsoft.com/en-us/purview/)
- [Microsoft Security Copilot](https://learn.microsoft.com/en-us/copilot/security/)
- [Microsoft Graph API reference](https://learn.microsoft.com/en-us/graph/api/overview)