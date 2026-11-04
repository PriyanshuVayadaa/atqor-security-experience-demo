'use strict';

const DefenderData=(()=>{
  const snapshot='2026-11-02T09:42:00Z',modules={};
  const time=(age=1,index=0)=>new Date(Date.parse(snapshot)-(age-1)*86400000-(index+1)*13*60000).toISOString();
  const row=(id,unit,state,values,details={},age=1,links=[])=>({id,unit,state,values:values.map(String),age,review:!['Resolved','Completed','Healthy','Enabled','Published'].includes(state),details,links,time:time(age),timeline:[]});
  const mod=(title,icon,subtitle,columns,rows,activity=false,links=[])=>({title,icon,subtitle,columns,rows,activity,links});
  const link=(module,id)=>({module,id});

  const devices=[
    ['DEV-001','Finance','FIN-LT-042','Windows 11 Enterprise','High','Active','Sarah Chen','Encoded PowerShell investigation'],
    ['DEV-002','Engineering','ENG-WS-083','Windows 11 Enterprise','Medium','Active','Emma Wilson','Malware quarantined; no active threat confirmed'],
    ['DEV-003','Operations','OPS-LT-118','Windows 10 Enterprise','High','Active','Taylor Brooks','Encryption compliance failure; separate Intune remediation'],
    ['DEV-004','Engineering','ENG-MAC-012','macOS 15','Low','Active','Liam Patel','Sensor current; patch review scheduled'],
    ['DEV-005','Finance','FIN-SRV-008','Windows Server 2022','High','Active','Daniel Cho','Production server; changes require maintenance approval'],
    ['DEV-006','Engineering','ENG-LNX-021','Ubuntu 24.04 LTS','Medium','Active','Noah Williams','Cloud build runner; Linux feature support differs'],
    ['DEV-007','Operations','OPS-LT-031','Windows 11 Enterprise','Low','Active','Benjamin Clark','Healthy sensor; normal business activity'],
    ['DEV-008','Engineering','ENG-PAW-004','Windows 11 Enterprise','Low','Active','Priya Shah','Privileged workstation; restricted administration'],
    ['DEV-009','Operations','OPS-MAC-009','macOS 15','Medium','Inactive','Chloe Davis','Last seen Oct 27; connectivity review'],
    ['DEV-010','Finance','FIN-LT-027','Windows 11 Enterprise','Medium','Active','Aisha Khan','Browser remediation awaiting check-in']
  ];
  modules.devices=mod('Device inventory','fa-laptop','Selected onboarded endpoints, exposure and sensor state. Inventory is not a scan or the full protected endpoint aggregate.',
    ['Device','Platform','Exposure','Sensor','Primary user','Review state'],devices.map(d=>row(d[0],d[1],d[5]==='Inactive'?'Needs review':'Healthy',[d[2],d[3],d[4],d[5],d[6],d[5]==='Inactive'?'Needs review':'Healthy'],{'Device ID':d[0],'Context':d[7],'Onboarding':'Onboarded in fixture; no real sensor connected','Device group':d[1]+' managed endpoints','Last seen':time(d[5]==='Inactive'?7:1),'Response scope':'Device isolation and scans require supported platform and source-service permissions'})),false,['endpoints','vulnerabilities','investigations']);

  const incidentSpecs=[
    ['INC-2481','Finance','Critical','Multi-stage phishing and identity attack','In progress','Alex Morgan',12,1,'Sarah Chen','Mail, sign-in and OAuth signals need correlated review','DEV-001'],
    ['INC-2480','Finance','High','Suspicious PowerShell on finance endpoint','In progress','Jordan Lee',4,1,'FIN-LT-042','Encoded command, unusual parent and blocked connection','DEV-001'],
    ['INC-2476','Engineering','Medium','Malware blocked on engineering workstation','Resolved','Alex Morgan',2,3,'ENG-WS-083','Quarantined file; no additional active artifacts in sample','DEV-002'],
    ['INC-D310','Operations','High','Credential phishing campaign targeting operations','New','Unassigned',5,1,'Operations recipients','Multiple messages share a synthetic credential-harvesting domain','DEV-007'],
    ['INC-D309','Engineering','High','Suspicious cloud application consent','In progress','Priya Shah',3,2,'Contoso Build Assistant','Unexpected permissions require owner validation','DEV-008'],
    ['INC-D308','Finance','Medium','Unusual server authentication activity','New','Unassigned',2,2,'FIN-SRV-008','Authentication sequence requires service-owner context','DEV-005'],
    ['INC-D307','Engineering','Medium','Build runner network anomaly','Resolved','Noah Williams',2,5,'ENG-LNX-021','Authorized package retrieval validated','DEV-006'],
    ['INC-D306','Operations','Low','Endpoint sensor reporting gap','In progress','Taylor Brooks',1,6,'OPS-MAC-009','Device offline; no sensor tampering conclusion','DEV-009'],
    ['SIM-DEF-001','Finance','High','Suspicious file activity on FIN-LT-042','In progress','Alex Morgan',1,1,'FIN-LT-042','Demo reel case: endpoint behavior signal; automated investigation AIR-1042 running; isolation awaits approval','DEV-001'],
    ['SIM-DEF-002','Engineering','High','Defender device risk is High on ENG-WS-083','In progress','Jordan Lee',1,1,'ENG-WS-083','Demo reel case: High device risk shared with Intune; a Sync does not lower the risk','DEV-002']
  ];
  modules['defender-incidents']=mod('Defender incidents','fa-shield-halved','Correlated Defender-only investigation cases. Separate from the existing cross-workload incident queue; overlapping IDs describe the same seeded case. SIM- cases are the incidents told in the demo reels.',
    ['Incident','Case ID','Severity','Alerts','Owner','Status'],incidentSpecs.map(p=>row(p[0],p[1],p[4],[p[3],p[0],p[2],p[6],p[5],p[4]],{'Affected entity':p[8],'Evidence':p[9],'Investigation guidance':'Review related evidence and business context before containment','Disposition':p[4]==='Resolved'?'Resolved in fictional snapshot':'Investigation remains open','Source':'Defender XDR correlated fixtures'},p[7],[link('devices',p[10])])),true,['endpoints','email','identities','cloud-apps','investigations']);

  const endpointSpecs=[
    ['EDR-101','Finance','Encoded command launched by Office','High','In progress','DEV-001','INC-2480','winword.exe → powershell.exe','Network protection blocked synthetic bad destination',1],
    ['EDR-102','Engineering','Malicious file quarantined','Medium','Resolved','DEV-002','INC-2476','archive extraction → file detection','Quarantine recorded; residual investigation complete',3],
    ['EDR-103','Operations','Suspicious browser download blocked','Medium','New','DEV-007','INC-D310','browser.exe → downloaded file','Download prevented; inspect user interaction',1],
    ['EDR-104','Engineering','Unexpected application permission utility','High','In progress','DEV-008','INC-D309','administrative shell → app permission script','Script evidence retained; no malicious attribution',2],
    ['EDR-105','Finance','Unusual server process sequence','Medium','New','DEV-005','INC-D308','service host → administrative process','Validate scheduled administration',2],
    ['EDR-106','Engineering','Build runner connection reviewed','Low','Resolved','DEV-006','INC-D307','build process → package download','Approved build operation confirmed',5],
    ['EDR-107','Operations','Sensor health interruption','Low','In progress','DEV-009','INC-D306','No current telemetry','Offline state; sensor health not a live probe',6],
    ['EDR-108','Finance','Browser exploit-prevention signal','Medium','New','DEV-010','INC-2481','browser renderer → protection event','Correlate with endpoint vulnerability exposure',1]
  ];
  modules.endpoints=mod('Endpoints','fa-desktop','EDR and prevention evidence with process context. No live hunting, isolation, file removal or scan is executed.',
    ['Detection','Alert ID','Severity','Device','Process / signal','Status'],endpointSpecs.map(p=>row(p[0],p[1],p[4],[p[2],p[0],p[3],devices.find(d=>d[0]===p[5])[2],p[7],p[4]],{'Response evidence':p[8],'Detection source':'Defender for Endpoint fixture','Process detail':'Conceptual parent/child evidence; no executable payload included','Analyst guidance':'Validate process provenance, containment impact and correlated alerts'},p[9],[link('devices',p[5]),link('defender-incidents',p[6])])),true,['devices','vulnerabilities','response-actions']);

  const identitySpecs=[
    ['ID-201','Finance','Suspicious identity use after phishing','High','In progress','sarah.chen@contoso.com','INC-2481','Correlated identity signals; Entra risk data is a separate source',1],
    ['ID-202','Finance','Unusual server-account authentication','Medium','New','svc-finance-demo@contoso.com','INC-D308','Validate expected account use and supported sensor context',2],
    ['ID-203','Engineering','Application privilege anomaly','High','In progress','Contoso Build Assistant','INC-D309','App consent is cloud-app evidence; no on-prem sensor attribution',2],
    ['ID-204','Operations','Credential lure recipient activity','Medium','New','Operations demo recipient','INC-D310','Email identity evidence requires user validation',1],
    ['ID-205','Engineering','Approved build identity activity','Low','Resolved','build.operator@contoso.com','INC-D307','Expected service identity behavior validated',5],
    ['ID-206','Operations','Sensor coverage gap under review','Low','In progress','Operations identity sensor','INC-D306','Deployment-reference fixture, not a live sensor connection',6]
  ];
  modules.identities=mod('Identities','fa-user-shield','Identity-related detection context and source provenance. Full Defender for Identity deployment requires eligible licenses and supported sensors.',
    ['Identity signal','Alert ID','Identity / entity','Severity','Status'],identitySpecs.map(p=>row(p[0],p[1],p[4],[p[2],p[0],p[5],p[3],p[4]],{'Evidence':p[7],'Provenance':'Correlated Defender case evidence; source attribution preserved','Verification':'Use supported identity logs and sensors in production','Privacy':'Fictional identities and service accounts only'},p[8],[link('defender-incidents',p[6])])),true,['defender-incidents','cloud-apps','email']);

  const emailSpecs=[
    ['MAIL-301','Finance','Quarter-close document review','Credential phishing','Quarantined','sarah.chen@contoso.com','INC-2481','review@billing.example.com','Credential-harvesting link',1],
    ['MAIL-302','Operations','Updated operations schedule','Credential phishing','Quarantined','olivia.reed@contoso.com','INC-D310','updates@partner.example.com','Shared synthetic lure domain',1],
    ['MAIL-303','Operations','Account verification notice','Credential phishing','Blocked','james.walker@contoso.com','INC-D310','notify@helpdesk.example.com','Spoofed request; no link opened in dashboard',1],
    ['MAIL-304','Engineering','Build artifact package','Malware','Quarantined','emma.wilson@contoso.com','INC-2476','artifacts@build.example.com','Synthetic attachment indicator; no binary embedded',3],
    ['MAIL-305','Finance','Payment change request','Business email compromise indicator','In review','aisha.khan@contoso.com','INC-2481','accounts@vendor.example.com','Contextual review; not a verified fraudulent message',2],
    ['MAIL-306','Engineering','Application consent invitation','Suspicious consent lure','In review','priya.shah@contoso.com','INC-D309','apps@tools.example.com','App permissions require tenant-owner review',2],
    ['MAIL-307','Operations','Team handover reminder','Clean','Delivered','chloe.davis@contoso.com','INC-D310','team@contoso.com','Known benign comparator; no threat claimed',4],
    ['MAIL-308','Engineering','Dependency update digest','Clean','Delivered','noah.williams@contoso.com','INC-D307','build@contoso.com','Approved internal message',5]
  ];
  modules.email=mod('Email & collaboration','fa-envelope','Message investigation metadata, verdicts and delivery outcomes. No actual email bodies, attachments, or malicious URLs are embedded.',
    ['Subject','Message ID','Verdict','Recipient','Delivery / review'],emailSpecs.map(p=>row(p[0],p[1],p[4],[p[2],p[0],p[3],p[5],p[4]],{'Sender':p[7],'Evidence':p[8],'Protection context':'Defender for Office 365 fixture; capability depends on plan and deployment','Analyst guidance':'Review delivery history, recipients and correlated case before response'},p[9],[link('defender-incidents',p[6])])),true,['defender-incidents','campaigns','response-actions']);

  const cloudSpecs=[
    ['APP-401','Finance','Finance Reporting Connector','Consent anomaly','High','In review','INC-2481','Unfamiliar OAuth grant; permissions and publisher validation pending'],
    ['APP-402','Engineering','Contoso Build Assistant','Privilege anomaly','High','In progress','INC-D309','Unexpected app permission change; no removal performed'],
    ['APP-403','Operations','Partner File Exchange','External sharing activity','Medium','New','INC-D310','Inspect authorized partner scope; DLP and sharing controls are separate'],
    ['APP-404','Engineering','Approved Package Registry','Expected workload activity','Low','Resolved','INC-D307','Validated development service context'],
    ['APP-405','Finance','Finance ERP','High-value application','Medium','In review','INC-D308','Review service identity permissions and owner approval'],
    ['APP-406','Operations','Operations collaboration','Monitoring coverage review','Low','In progress','INC-D306','Inventory fixture only; no live cloud connector verified']
  ];
  modules['cloud-apps']=mod('Cloud apps','fa-cloud','SaaS/application governance findings. App visibility, consent controls and session controls require supported integrations and entitlements.',
    ['Application','Finding','Priority','Review state'],cloudSpecs.map(p=>row(p[0],p[1],p[5],[p[2],p[3],p[4],p[5]],{'Application ID':p[0],'Evidence':p[7],'Owner':p[1]+' app owner','Integration':'Configured-reference fixture; no connector authenticated','Response':'Review least privilege and session controls in owning service'},1,[link('defender-incidents',p[6])])),false,['identities','defender-incidents','configuration']);

  const vulnSpecs=[
    ['VUL-501','Finance','Browser security update','Critical','DEV-001','Browser build below approved baseline','High','Open','Browser update pilot'],
    ['VUL-502','Finance','Production server patch review','Critical','DEV-005','OS patch baseline gap','High','In progress','Maintenance window approval'],
    ['VUL-503','Engineering','Developer tool update','High','DEV-002','Development tool below approved version','Medium','Open','Engineering package rollout'],
    ['VUL-504','Engineering','macOS update assessment','Medium','DEV-004','Supported OS update pending','Low','In progress','Mac pilot group'],
    ['VUL-505','Operations','Endpoint browser remediation','High','DEV-007','Browser security fix available','Medium','Open','Operations remediation group'],
    ['VUL-506','Engineering','Build runner dependency baseline','High','DEV-006','Package version review','Medium','Resolved','Approved updated base image'],
    ['VUL-507','Operations','Offline device inventory gap','Medium','DEV-009','Stale vulnerability assessment','Unknown','Open','Restore device connectivity'],
    ['VUL-508','Finance','Finance browser deployment','High','DEV-010','Browser update pending check-in','Medium','In progress','Intune application deployment']
  ];
  modules.vulnerabilities=mod('Vulnerability Management','fa-bug','Selected exposure and remediation work items. Version gaps are fictional; no fabricated CVE identifier or live vulnerability scan is used.',
    ['Remediation item','Priority','Affected device','Exposure','Owner workflow','Status'],vulnSpecs.map(p=>row(p[0],p[1],p[7],[p[2],p[3],devices.find(d=>d[0]===p[4])[2],p[6],p[8],p[7]],{'Finding ID':p[0],'Version evidence':p[5],'CVE reference':'No specific CVE asserted in this fixture','Validation':'Reassess after approved update and device reporting','Licensing':'Premium vulnerability features may require additional entitlement'},1,[link('devices',p[4])])),false,['exposure','devices','endpoints']);

  modules.exposure=mod('Exposure management','fa-bullseye','Prioritized attack-path and control gaps derived from curated findings; no real attack-path graph or security guarantee.',
    ['Recommendation','Priority','Affected scope','Owner','Status'],[
      row('EXP-601','Finance','Open',['Remediate finance browser exposure','Critical','Finance endpoints','Daniel Cho','Open'],{'Rationale':'High-value identities and outdated browser baseline','Recommended action':'Validate vulnerabilities; stage an approved update'},1,[link('vulnerabilities','VUL-501')]),
      row('EXP-602','Engineering','In progress',['Review app permission privilege','High','Build assistant','Priya Shah','In progress'],{'Rationale':'Unexpected permission elevation in application finding','Recommended action':'Validate consent, publisher and least privilege'},1,[link('cloud-apps','APP-402')]),
      row('EXP-603','Operations','Open',['Improve phishing prevention coverage','High','Operations recipients','Alex Morgan','Open'],{'Rationale':'Correlated synthetic phishing campaign','Recommended action':'Review policies and user-reported messages'},1,[link('campaigns','CAMP-701')]),
      row('EXP-604','Finance','In progress',['Schedule server patch maintenance','High','FIN-SRV-008','Jordan Lee','In progress'],{'Rationale':'Production patch review; no safe automatic reboot assumed'},1,[link('vulnerabilities','VUL-502')]),
      row('EXP-605','Operations','Open',['Restore reporting on offline endpoints','Medium','OPS-MAC-009','Taylor Brooks','Open'],{'Rationale':'Telemetry gap limits exposure assessment'},1,[link('devices','DEV-009')]),
      row('EXP-606','Engineering','Resolved',['Validate build runner baseline','Low','ENG-LNX-021','Noah Williams','Resolved'],{'Rationale':'Approved update and observed workload context in fixture'},1,[link('vulnerabilities','VUL-506')])
    ],false,['vulnerabilities','configuration','threat-intelligence']);

  modules.campaigns=mod('Campaigns','fa-envelopes-bulk','Grouped message campaigns and recipient scope. Campaign grouping is an illustrative subset, not an attribution statement.',
    ['Campaign','Pattern','Recipients','Review owner','Status'],[
      row('CAMP-701','Operations','In progress',['Operations credential lure','Shared credential-harvesting pattern','38 sample aggregate','Alex Morgan','In progress'],{'Message evidence':'MAIL-302 and MAIL-303; aggregate is separate from shown messages','Attribution':'No real actor attributed'},1,[link('email','MAIL-302'),link('email','MAIL-303')]),
      row('CAMP-702','Finance','In review',['Quarter-close credential lure','Document-review pretext','12 sample aggregate','Jordan Lee','In review'],{'Message evidence':'MAIL-301 and MAIL-305','Attribution':'Synthetic campaign; investigate contextual evidence'},1,[link('email','MAIL-301')]),
      row('CAMP-703','Engineering','In review',['App consent invitation','Privilege/consent pretext','8 sample aggregate','Priya Shah','In review'],{'Message evidence':'MAIL-306','Attribution':'No publisher compromise determination'},2,[link('email','MAIL-306')]),
      row('CAMP-704','Engineering','Resolved',['Build artifact delivery','Attachment-based malware signal','4 sample aggregate','Alex Morgan','Resolved'],{'Message evidence':'MAIL-304; endpoint quarantine fixture'},3,[link('email','MAIL-304')]),
      row('CAMP-705','Operations','Resolved',['Benign partner reminders','Approved internal reminder','9 sample aggregate','Chloe Davis','Resolved'],{'Disposition':'Benign comparator; avoid treating every grouped message as malicious'},4,[link('email','MAIL-307')]),
      row('CAMP-706','Engineering','Resolved',['Dependency notifications','Expected internal build mail','16 sample aggregate','Noah Williams','Resolved'],{'Disposition':'Authorized maintenance notifications'},5,[link('email','MAIL-308')])
    ],true,['email','defender-incidents']);

  modules['threat-intelligence']=mod('Threat intelligence','fa-globe','Fictional threat-analysis briefs and preparedness recommendations. Not current Microsoft intelligence, actor attribution, or actionable indicators.',
    ['Brief','Category','Priority','Related exposure','Review state'],[
      row('TI-801','all','Published',['Credential phishing and session risk','Identity + email','High','Cross-domain evidence','Published'],{'Summary':'Correlate email and identity evidence; blocking a sign-in does not revoke prior sessions','Guidance':'Validate user context and appropriate containment'},1,[link('defender-incidents','INC-2481')]),
      row('TI-802','Finance','In review',['Office-launched command investigation','Endpoint','High','Process provenance','In review'],{'Summary':'Encoded commands require process-chain and behavior review, not command-string attribution'},1,[link('endpoints','EDR-101')]),
      row('TI-803','Engineering','Published',['OAuth privilege review','Cloud applications','High','Permission scope','Published'],{'Summary':'Inspect grant and publisher context before changing permissions'},1,[link('cloud-apps','APP-402')]),
      row('TI-804','Operations','In review',['Phishing campaign preparedness','Email protection','Medium','Recipient coverage','In review'],{'Summary':'Review campaign and recipient impact; URL samples omitted'},1,[link('campaigns','CAMP-701')]),
      row('TI-805','all','Published',['Exposure reduction playbook','Vulnerability management','Medium','Update readiness','Published'],{'Summary':'Prioritize known evidence, business criticality and safe maintenance scheduling'},1,[link('exposure','EXP-601')]),
      row('TI-806','Engineering','Published',['Expected build workload patterns','Workload context','Low','False-positive reduction','Published'],{'Summary':'Validate service ownership before escalation'},1,[link('defender-incidents','INC-D307')])
    ],false,['exposure','campaigns','endpoints']);

  const investigations=[
    ['INV-901','Finance','Phishing and identity correlation','In progress','INC-2481','Alex Morgan','Email + identity + app consent','Review prior sessions and grant scope'],
    ['INV-902','Finance','Finance endpoint investigation','Pending approval','INC-2480','Jordan Lee','Process tree + network block','Assess isolation business impact'],
    ['INV-903','Engineering','Quarantine investigation','Completed','INC-2476','Alex Morgan','File detection + investigation artifacts','No additional active artifacts in seeded result'],
    ['INV-904','Operations','Credential campaign investigation','In progress','INC-D310','Alex Morgan','Message correlation + user reports','Confirm delivery and affected recipients'],
    ['INV-905','Engineering','Consent permission review','In progress','INC-D309','Priya Shah','App permission context','Validate intended permissions with owner'],
    ['INV-906','Engineering','Build-runner investigation','Completed','INC-D307','Noah Williams','Network telemetry + owner confirmation','Expected package retrieval confirmed']
  ];
  modules.investigations=mod('Investigation & response','fa-magnifying-glass','Investigation evidence and approval checkpoints. Recommendations do not execute real response actions.',
    ['Investigation','Case','Evidence scope','Analyst','Status'],investigations.map(p=>row(p[0],p[1],p[3],[p[2],p[4],p[6],p[5],p[3]],{'Investigation ID':p[0],'Next step':p[7],'Automation':'State is seeded; no automated investigation is running','Response boundary':'Validate source-specific actions, prerequisites and permissions'},p[0]==='INV-903'?3:1,[link('defender-incidents',p[4])])),true,['response-actions','endpoints','defender-incidents']);

  modules['response-actions']=mod('Response action history','fa-list-check','Recorded sample recommendations and completed fixture actions. This table cannot isolate devices, revoke sessions, or purge email.',
    ['Recommendation / action','Entity','Owning service','Analyst','Review state'],[
      row('RESP-1001','Finance','Pending approval',['Review device isolation','FIN-LT-042','Defender for Endpoint','Jordan Lee','Pending approval'],{'Safety check':'Confirm evidence, business impact and supported device platform','Execution':'Not executed by dashboard'},1,[link('investigations','INV-902'),link('devices','DEV-001')]),
      row('RESP-1002','Finance','Pending approval',['Review session revocation','sarah.chen@contoso.com','Microsoft Entra ID','Alex Morgan','Pending approval'],{'Service distinction':'Identity response is not an endpoint isolation action','Execution':'Not executed; prior sessions require source-specific review'},1,[link('defender-incidents','INC-2481')]),
      row('RESP-1003','Engineering','Completed',['Quarantine detected file','ENG-WS-083','Defender for Endpoint','Alex Morgan','Completed'],{'Execution':'Quarantine recorded in original seeded investigation; no real file removed'},3,[link('investigations','INV-903')]),
      row('RESP-1004','Operations','In review',['Review campaign message removal','Operations mailboxes','Defender for Office 365','Alex Morgan','In review'],{'Execution':'Message purge not performed; review recipients and false positives'},1,[link('campaigns','CAMP-701')]),
      row('RESP-1005','Engineering','Pending approval',['Review application grant restriction','Contoso Build Assistant','Owning identity/app service','Priya Shah','Pending approval'],{'Execution':'No consent grant altered; validate application impact'},2,[link('cloud-apps','APP-402')]),
      row('RESP-1006','Operations','In progress',['Restore sensor reporting','OPS-MAC-009','Device owner + Defender','Taylor Brooks','In progress'],{'Execution':'Connectivity investigation; no remote command run'},6,[link('devices','DEV-009')])
    ],true,['investigations','configuration']);

  const controls=[
    ['CFG-1101','all','ASR · Block Office child processes','Enabled','Windows endpoints','Attack surface reduction','Eligible targeted Windows devices'],
    ['CFG-1102','all','EDR in block mode','Enabled','Eligible onboarded endpoints','EDR protection','Eligible licensed endpoint configuration'],
    ['CFG-1103','all','Safe Links standard protection','Enabled','Supported recipients','Email protection','Safe Links workload and policy requirements apply'],
    ['CFG-1104','Engineering','Automated investigation pilot','Enabled','Pilot device group','Automation','Approval and automation settings differ by device group'],
    ['CFG-1105','Finance','Finance remediation deployment','In review','Finance Windows endpoints','Remediation','Change approval pending; no rollout by this dashboard'],
    ['CFG-1106','Operations','Operations campaign policy tuning','Audit','Operations recipients','Policy evaluation','Audit fixture does not claim blocking'],
    ['CFG-1107','all','Sentinel workspace connector','Not connected','No configured workspace','Integration','No Sentinel telemetry or service health probe available'],
    ['CFG-1108','all','Identity sensor deployment review','Needs review','Supported identity infrastructure','Identity protection','Sensor deployment and entitlement must be validated']
  ];
  modules.configuration=mod('Setup & configuration','fa-gear','Policy and integration references with explicit licensing/deployment boundaries. No service health or configuration is verified live.',
    ['Configuration','Type','Assignment','State'],controls.map(p=>row(p[0],p[1],p[3],[p[2],p[5],p[4],p[3]],{'Configuration ID':p[0],'Prerequisites':p[6],'Change authority':'Source-specific administrator permissions','Connection mode':'Offline fixture; not a tenant service check'})),false,['devices','cloud-apps','exposure']);

  modules['defender-reports']=mod('Reports','fa-chart-column','Curated operational report definitions and fixed summaries. Report aggregates are separate from the small evidence subsets.',
    ['Report','Scope','Fixture summary','Owner','State'],[
      row('RPT-1201','all','Published',['Endpoint sensor coverage','All endpoints','98.4% fixed sample coverage','Taylor Brooks','Published'],{'Definition':'Independent aggregate, not calculated from 10 inventory rows'},1,[link('devices','DEV-009')]),
      row('RPT-1202','Finance','In review',['Finance high-priority cases','Finance','2 selected high-impact cases','Alex Morgan','In review'],{'Definition':'Selected case evidence; not full tenant incident count'},1,[link('defender-incidents','INC-2481')]),
      row('RPT-1203','Engineering','Published',['Engineering investigation outcomes','Engineering','2 completed selected investigations','Jordan Lee','Published'],{'Definition':'Seeded outcome snapshot'},1,[link('investigations','INV-903')]),
      row('RPT-1204','Operations','In review',['Operations phishing campaign','Operations','38 campaign recipient aggregate','Alex Morgan','In review'],{'Definition':'Campaign aggregate independent of message subset'},1,[link('campaigns','CAMP-701')]),
      row('RPT-1205','all','Published',['Threats blocked overview','Tenant','2,846 fixed seven-day aggregate','Alex Morgan','Published'],{'Definition':'Independent detection aggregate; not unique incidents'},1,[link('endpoints','EDR-102')]),
      row('RPT-1206','all','Published',['Vulnerability prioritization','Tenant','47 critical findings fixed aggregate','Jordan Lee','Published'],{'Definition':'Selected work items are not the full aggregate'},1,[link('vulnerabilities','VUL-501')])
    ],false,['exposure','devices','defender-incidents']);

  modules.learning=mod('Learning hub','fa-book-open','Seeded analyst readiness and runbook catalog. These are fictional training assignments, not certifications or Microsoft intelligence.',
    ['Runbook / exercise','Capability','Assigned audience','Owner','State'],[
      row('LEARN-1301','all','Published',['Cross-domain phishing triage','Defender XDR','SOC analysts','Alex Morgan','Published'],{'Exercise':'Correlate mail, identity and endpoint context','Source documentation':'https://learn.microsoft.com/en-us/defender-xdr/'},1,[link('defender-incidents','INC-2481')]),
      row('LEARN-1302','Finance','In progress',['Endpoint isolation approval exercise','Endpoint response','Finance responders','Jordan Lee','In progress'],{'Exercise':'Check business impact before recommending containment'},1,[link('response-actions','RESP-1001')]),
      row('LEARN-1303','Engineering','Published',['Application consent investigation','Cloud Apps','Application owners','Priya Shah','Published'],{'Exercise':'Review app privileges and legitimate workload context'},1,[link('cloud-apps','APP-402')]),
      row('LEARN-1304','Operations','In progress',['Campaign delivery validation','Office 365','Operations SOC','Alex Morgan','In progress'],{'Exercise':'Validate recipients, delivery and false positives'},1,[link('campaigns','CAMP-701')]),
      row('LEARN-1305','all','Published',['Vulnerability rollout planning','Vulnerability Management','Remediation owners','Taylor Brooks','Published'],{'Exercise':'Prioritize updates and maintenance approval'},1,[link('vulnerabilities','VUL-502')]),
      row('LEARN-1306','all','Published',['Advanced hunting evidence basics','Advanced hunting','SOC analysts','Noah Williams','Published'],{'Exercise':'Use the existing two local templates; arbitrary KQL is not executed'} )
    ],false,['threat-intelligence','configuration','investigations']);

  // Make the primary cases an investigation entry point, not a one-way device link.
  for(const incident of modules['defender-incidents'].rows){
    for(const [key,module]of Object.entries(modules)){
      if(key==='defender-incidents')continue;
      for(const evidence of module.rows)if(evidence.links.some(l=>l.module==='defender-incidents'&&l.id===incident.id))incident.links.push(link(key,evidence.id));
    }
  }
  for(const [key,module]of Object.entries(modules))for(const r of module.rows){
    r.module=key;r.details={'Record ID':r.id,'Business unit':r.unit==='all'?'Shared tenant record':r.unit,...r.details,'Workflow state':r.state,'Snapshot (UTC)':snapshot,'Data source':'Fictional Contoso Defender fixture; no live connection'};
    r.timeline=[{time:r.time,event:module.activity?'Sample evidence observed and retained':'Reference configuration captured in snapshot'},{time:snapshot,event:r.review?'Awaiting analyst validation or owner workflow':'Recorded sample outcome retained; no dashboard action executed'}];
  }
  function get(key){if(!modules[key])throw new Error('Unknown Defender module');return modules[key];}
  function filter(key,{unit='all',days=7,query='',state='all'}={}){const mod=get(key),phrase=query.trim().toLowerCase();return mod.rows.filter(r=>(unit==='all'||r.unit==='all'||r.unit===unit)&&(!mod.activity||r.age<=days)&&(state==='all'||r.state===state)&&(!phrase||`${r.id} ${r.unit} ${r.values.join(' ')} ${Object.values(r.details).join(' ')}`.toLowerCase().includes(phrase)));}
  return {snapshot,modules,get,filter};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=DefenderData;