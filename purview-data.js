'use strict';

const PurviewData=(()=>{
  const snapshot='2026-11-02T09:42:00Z';
  const at=(age,index=0)=>new Date(Date.parse(snapshot)-(age-1)*86400000-(index+1)*11*60000).toISOString();
  const record=(id,unit,state,values,details={},age=1,review=false)=>({id,unit,state,values:values.map(String),details,age,review,time:at(age),timeline:[]});
  const module=(title,icon,subtitle,columns,rows,activity=false,links=[])=>({title,icon,subtitle,columns,rows,activity,links});
  const modules={};

  const dlpSpecs=[
    ['DLP-FIN-001','Finance','Enabled','Financial information','SharePoint Online','Block external sharing','Daniel Cho','Financial identifiers and confidential financial label','Finance sites; 2,186 users','External sharing; policy tip without override'],
    ['DLP-PII-002','Operations','Enabled','Personal information','Exchange Online','Block with override','Maya Patel','Personal data sensitive-information types','Operations mailboxes; 4,018 users','External recipients; business justification recorded'],
    ['DLP-END-003','Engineering','Enabled','Confidential documents','Endpoint','Audit','Taylor Brooks','Confidential label','Onboarded Engineering Windows devices','USB and cloud upload monitoring; no block in audit'],
    ['DLP-SRC-004','Engineering','Enabled','Source code protection','Microsoft Teams','Block','Jordan Lee','Custom source-code classifier','Engineering collaboration scope','Selected external collaboration channels'],
    ['DLP-END-005','Finance','Enabled','Finance endpoint transfers','Endpoint','Block','Taylor Brooks','Financial content and restricted label','Onboarded Finance Windows devices','Restricted cloud destinations and removable media'],
    ['DLP-END-006','Operations','Enabled','Employee records on endpoints','Endpoint','Block','Maya Patel','Employee identifier classifier','Onboarded Operations Windows devices','Restricted upload destinations'],
    ['DLP-END-007','Engineering','Enabled','Developer cloud uploads','Endpoint','Block with override','Jordan Lee','Custom intellectual-property classifier','Onboarded Engineering Windows devices','Exception requires recorded justification'],
    ['DLP-AI-008','all','Simulation','AI input protection pilot','Configured AI integration','Would block','Priya Shah','Configured identifiers and restricted labels','Pilot AI integration; 250 users','Simulation only; does not enforce; chatbot is a separate local demo'],
    ['DLP-M365-009','Operations','Simulation','Medical information pilot','SharePoint Online','Would block','Maya Patel','Health-record sensitive-information types','Benefits pilot sites','Simulation only; policy tuning before rollout'],
    ['DLP-EXT-010','all','Disabled','Legacy guest sharing pilot','OneDrive','No enforcement','Alex Morgan','Confidential label','Archived pilot assignments','Disabled after migration to current sharing policies']
  ];
  modules.dlp=module('Data Loss Prevention','fa-file-shield','Policy configuration, target locations, and enforcement modes. Fixed snapshot; activity filters do not alter assignments.',
    ['Policy','Policy ID','Location','Mode','Owner','State'],dlpSpecs.map(p=>record(p[0],p[1],p[2],[p[3],p[0],p[4],p[5],p[6],p[2]],{
      'Detection conditions':p[7],'Assignments':p[8],'Action and exceptions':p[9],'Modified (UTC)':'2026-10-30 14:25 UTC','Policy owner':p[6],
      'Enforcement boundary':p[2]==='Simulation'?'Would-block results only; no block performed':p[2]==='Disabled'?'Policy off; no enforcement':'Illustrated configured action; actual workload support must be verified'
    },1,p[2]==='Simulation')),false,['dlp-alerts','classification','agent-activity']);

  const matches=[
    ['DLP-2601','Finance','New','Q4-Financials.xlsx','SharePoint Online','DLP-FIN-001',8,'Block external sharing','sarah.chen@contoso.com',1,'INC-2479'],
    ['DLP-2602','Finance','In review','Treasury-Forecast.xlsx','SharePoint Online','DLP-FIN-001',6,'Block external sharing','daniel.cho@contoso.com',1,'Finance data owner contacted'],
    ['DLP-2603','Finance','New','Payroll-Reconciliation.csv','Endpoint','DLP-END-005',4,'Block','grace.liu@contoso.com',2,'Upload to restricted destination prevented'],
    ['DLP-2604','Engineering','In review','Architecture-Notes.docx','Endpoint','DLP-END-003',5,'Audit','emma.wilson@contoso.com',1,'Audit-only event; no blocking claimed'],
    ['DLP-2605','Operations','New','Employee-Benefits.xlsx','Exchange Online','DLP-PII-002',3,'Block with override','maya.patel@contoso.com',1,'No override supplied'],
    ['DLP-2606','Engineering','Resolved','Build-Module.txt','Microsoft Teams','DLP-SRC-004',2,'Block','liam.patel@contoso.com',3,'External channel message restricted'],
    ['DLP-2607','Finance','In review','Vendor-Accounts.xlsx','Endpoint','DLP-END-005',3,'Block','aisha.khan@contoso.com',2,'Removable-media attempt blocked'],
    ['DLP-2608','Operations','Resolved','Employee-Directory.csv','Endpoint','DLP-END-006',2,'Block','james.walker@contoso.com',4,'Work-approved workflow used'],
    ['DLP-2609','Operations','In review','Partner-Onboarding.docx','Exchange Online','DLP-PII-002',2,'Override recorded','chloe.davis@contoso.com',1,'Approved partner onboarding; review pending'],
    ['DLP-2610','Engineering','Resolved','Deployment-Guide.docx','Endpoint','DLP-END-003',1,'Audit','noah.williams@contoso.com',5,'Known development activity validated'],
    ['DLP-2611','Operations','New','Regional-Contacts.csv','Exchange Online','DLP-PII-002',1,'Block with override','olivia.reed@contoso.com',1,'Recipient approval missing'],
    ['DLP-2612','Operations','Resolved','Logistics-Contacts.xlsx','Endpoint','DLP-END-006',1,'Block','benjamin.clark@contoso.com',6,'Authorized sharing location selected']
  ];
  modules['dlp-alerts']=module('DLP policy matches','fa-triangle-exclamation','Twelve selected match groups represent 38 policy matches in the fixed seven-day tenant snapshot; not confirmed data loss.',
    ['Item','Match group','Location','Matches','Policy outcome','Review state'],matches.map(p=>{
      const row=record(p[0],p[1],p[2],[p[3],p[0],p[4],p[6],p[7],p[2]],{'Policy ID':p[5],'Actor':p[8],'Evidence':p[10],
        'Detection':'Configured label or sensitive-information match; matched values are not embedded','Data owner':p[1]+' data owner','Review note':'A policy match requires context; it is not proof of data exfiltration'},p[9],p[2]!=='Resolved');
      row.links=[{module:'dlp',id:p[5]}];row.count=p[6];return row;
    }),true,['dlp','audit','classification']);

  const auditSpecs=[
    ['AUD-6101','Finance','Success','SharingSet','sarah.chen@contoso.com','Q4-Financials.xlsx','SharePoint Online',1,'External sharing requested; DLP-FIN-001 restricted recipient access','dlp-alerts','DLP-2601'],
    ['AUD-6102','Finance','Success','DlpRuleMatch','DLP policy service','Q4-Financials.xlsx','SharePoint Online',1,'Configured financial policy matched; grouped match DLP-2601','dlp-alerts','DLP-2601'],
    ['AUD-6103','Engineering','Success','SensitivityLabelApplied','emma.wilson@contoso.com','Architecture-Notes.docx','SharePoint Online',1,'Confidential engineering label applied','information','LBL-006'],
    ['AUD-6104','Operations','Success','DlpOverride','chloe.davis@contoso.com','Partner-Onboarding.docx','Exchange Online',1,'Justification recorded for partner onboarding; pending reviewer validation','dlp-alerts','DLP-2609'],
    ['AUD-6105','all','Success','eDiscoverySearch','case.reviewer@contoso.com','Finance sharing review','eDiscovery',1,'Search metadata reviewed within authorized case scope','ediscovery','CASE-401'],
    ['AUD-6106','Operations','Success','RetentionLabelApplied','Retention service','Supplier-Agreement.docx','SharePoint Online',2,'Seven-year contract retention label applied','lifecycle','RET-002'],
    ['AUD-6107','Engineering','Success','FileDownloaded','liam.patel@contoso.com','Build-Module.txt','SharePoint Online',2,'Authorized download recorded; not a malicious-intent determination','insider','IRM-702'],
    ['AUD-6108','all','Success','DlpPolicyUpdated','priya.shah@contoso.com','AI input protection pilot','Purview configuration',3,'Pilot remains simulation-only','dlp','DLP-AI-008'],
    ['AUD-6109','Finance','Failure','FileAccessDenied','guest.user@partner.example.com','Treasury-Forecast.xlsx','SharePoint Online',3,'External access denied by configured content protection','classification','ITEM-802'],
    ['AUD-6110','all','Success','AuditSearchCompleted','alex.morgan@contoso.com','External sharing activity','Audit',4,'Authorized search completed; no real export produced'],
    ['AUD-6111','Operations','Success','DispositionReviewApproved','records.reviewer@contoso.com','Closed logistics records','Records Management',6,'One review stage approved; disposition remains pending','records','REC-902'],
    ['AUD-6112','Engineering','Success','FileLabelChanged','nora.evans@contoso.com','Release-Checklist.docx','SharePoint Online',9,'Label change justification retained','information','LBL-004'],
    ['AUD-6113','all','Success','CaseAccessUpdated','case.manager@contoso.com','Project Atlas preservation','eDiscovery',12,'Case reviewer membership validated','ediscovery','CASE-402'],
    ['AUD-6114','Finance','Success','RetentionPolicyUpdated','daniel.cho@contoso.com','Finance accounting records','Purview configuration',18,'Scope reassessed; no deletion by this dashboard','lifecycle','RET-001']
  ];
  modules.audit=module('Audit','fa-file-lines','Seeded audit-style records with actor, operation, object, workload, and correlation context. These are not live Microsoft audit logs.',
    ['Timestamp (UTC)','Operation','Actor','Object','Workload','Result'],auditSpecs.map((p,i)=>{
      const row=record(p[0],p[1],p[2],[at(p[7],i),p[3],p[4],p[5],p[6],p[2]],{'Operation detail':p[8],'Correlation ID':'c027a690-6100-4d08-9341-'+String(i+1).padStart(12,'0'),'Client IP':'192.0.2.'+(20+i)+' · documentation-only','Audit access':'Authorized read-only reviewer; no service query executed'},p[7]);
      row.time=row.values[0];if(p[9])row.links=[{module:p[9],id:p[10]}];return row;
    }),true,['dlp-alerts','ediscovery','agent-activity']);

  const commSpecs=[
    ['CC-301','Finance','Pending review','External sharing language','Exchange Online','Anonymized participant 031','2','Financial policy review','Context review assigned; no violation determination'],
    ['CC-302','Engineering','In review','Source-code disclosure indicators','Microsoft Teams','Anonymized participant 044','3','Engineering IP review','Reviewer checking whether content is synthetic test code'],
    ['CC-303','Operations','Pending review','Personal-information discussion','Exchange Online','Anonymized participant 052','1','Privacy communications','Matched context hidden pending authorized review'],
    ['CC-304','Operations','Resolved','Restricted partner terms','Microsoft Teams','Anonymized participant 018','2','Partner communications','Authorized discussion; false positive recorded'],
    ['CC-305','Finance','In review','Financial disclosure indicators','Exchange Online','Anonymized participant 026','4','Financial policy review','Business context requested from approved data owner'],
    ['CC-306','Engineering','Pending review','Sensitive material in AI interaction','Configured AI integration','Anonymized participant 061','1','AI interaction review pilot','Detected after interaction capture; no inline block claimed'],
    ['CC-307','Operations','Resolved','Employee-information discussion','Microsoft Teams','Anonymized participant 037','1','Privacy communications','Authorized HR process confirmed'],
    ['CC-308','Engineering','Escalated','Repeated IP-sharing language','Microsoft Teams','Anonymized participant 049','3','Engineering IP review','Escalated to authorized case reviewer; no finding of intent']
  ];
  modules.communication=module('Communication Compliance','fa-comments','Anonymized policy-matched communications for authorized review. Detection is not a determination of misconduct.',
    ['Review item','Signal category','Channel','Participant','Messages','Review state'],commSpecs.map((p,i)=>record(p[0],p[1],p[2],[p[0],p[3],p[4],p[5],p[6],p[2]],{'Review policy':p[7],'Reviewer group':'Communication Compliance reviewers','Context':p[8],'Content privacy':'Message bodies and real identities are not embedded','Workflow':'Review contextual evidence; follow approved escalation and privacy procedures'},[1,2,1,3,4,1,6,9][i],!['Resolved'].includes(p[2]))),true,['audit','ediscovery']);

  const retentionSpecs=[
    ['RET-001','Finance','Accounting records','Exchange + SharePoint','7 years','Retain then delete','Daniel Cho','From creation; accounting content scope','Finance ledgers and in-scope finance mailboxes'],
    ['RET-002','Operations','Supplier contracts','SharePoint Online','7 years','Retain; disposition review','Maya Patel','Event-based: contract end','Contract sites; approved end-of-contract event required'],
    ['RET-003','Engineering','Engineering design history','SharePoint Online','5 years','Retain then delete','Emma Wilson','From last modification','Engineering design repositories'],
    ['RET-004','Operations','Employee business records','Exchange + SharePoint','7 years','Retain then delete','Maya Patel','Event-based: employment end','Authorized HR content scope; identities remain restricted'],
    ['RET-005','all','Teams standard retention','Microsoft Teams','3 years','Retain then delete','Alex Morgan','From message creation','Configured in-scope Teams messages'],
    ['RET-006','all','Email business retention','Exchange Online','5 years','Retain then delete','Alex Morgan','From message creation','Eligible business mailboxes; exceptions separately governed'],
    ['RET-007','Engineering','Release evidence','SharePoint Online','3 years','Retain; disposition review','Noah Williams','Event-based: release closure','Release verification packages'],
    ['RET-008','Operations','Operations incident reports','SharePoint Online','5 years','Retain then delete','Taylor Brooks','From record creation','Operational incident libraries'],
    ['RET-009','Finance','Tax working papers','SharePoint Online','10 years','Retain; disposition review','Daniel Cho','From tax period close','Approved tax evidence location'],
    ['RET-010','all','Approved AI interaction records','Supported AI locations','1 year','Retain then delete','Priya Shah','From interaction capture','Configured supported AI workload; no arbitrary agent coverage claimed'],
    ['RET-011','Operations','Customer service records','Exchange Online','3 years','Retain then delete','Chloe Davis','From message creation','Customer service mailboxes'],
    ['RET-012','Engineering','Archived build documentation','SharePoint Online','2 years','Retain then delete','Liam Patel','From last modification','Archived build-documentation sites']
  ];
  modules.lifecycle=module('Data Lifecycle Management','fa-box-archive','Twelve active retention policies and labels. Durations are fictional business settings, not legal advice.',
    ['Policy / label','Locations','Duration','End-of-period action','Owner','State'],retentionSpecs.map(p=>record(p[0],p[1],'Active',[p[2],p[3],p[4],p[5],p[6],'Active'],{'Retention ID':p[0],'Trigger':p[7],'Scope':p[8],'State':'Active in the fixture','Conflict handling':'Legal holds and other retention obligations must be considered; no deletion is executed','Last review':'2026-10-20'})),false,['records','ediscovery','audit']);

  const labels=[
    ['LBL-001','Public','all','None','All employees','Manual','No confidential business content intended'],
    ['LBL-002','General','all','None','All employees','Default for supported documents','Internal routine business content; no encryption configured'],
    ['LBL-003','Confidential – All employees','all','Employees only','All employees','Manual + policy recommendation','Configured internal encryption; verify VIEW/EXTRACT rights for supported AI'],
    ['LBL-004','Confidential – Project Atlas','Engineering','Project Atlas group','Project members','Manual','Project-scoped encryption; external rights limited to approved guests'],
    ['LBL-005','Highly Confidential – Finance','Finance','Finance protected group','Finance employees','Manual + automatic rule','Financial working papers; DLP-FIN-001 uses the label in context'],
    ['LBL-006','Confidential – Engineering','Engineering','Engineering employees','Engineering employees','Manual','Architecture and source documentation'],
    ['LBL-007','Highly Confidential – HR','Operations','HR authorized group','HR content owners','Manual + automatic rule','Employee records; strict reviewer access'],
    ['LBL-008','Confidential – Partners','Operations','Approved partner recipients','Partner project owners','Manual','Rights scoped to approved named recipients; not all guests']
  ];
  modules.information=module('Information Protection','fa-lock','Eight published sensitivity labels with protection, publication scope, and application context. Labels are fictional configuration records.',
    ['Sensitivity label','Encryption / rights','Published to','Labeling method','State'],labels.map(p=>record(p[0],p[2],'Published',[p[1],p[3],p[4],p[5],'Published'],{'Label ID':p[0],'Protection description':p[6],'Policy status':'Published to the specified group in the fictional snapshot','AI boundary':'Label-aware behavior depends on supported workload, encryption rights, policy and integration','Downgrade policy':'Justification required for supported sensitivity downgrade','Content marking':p[0]==='LBL-001'?'No marking':p[1]+' footer'})),false,['classification','dlp','agent-activity']);

  const postureSpecs=[
    ['DSPM-101','Finance','High','External exposure on finance collaboration','SharePoint Online','12 items','In progress','Daniel Cho','Review recipient access and DLP match context','Restrict unnecessary recipients; confirm policy enforcement','dlp-alerts','DLP-2601'],
    ['DSPM-102','Engineering','High','Unlabeled engineering documents','SharePoint Online','86 items','Open','Emma Wilson','Sensitive-classification signals without a matching label','Review and apply appropriate labels','classification','ITEM-807'],
    ['DSPM-103','Operations','Medium','Guest access to partner handover content','OneDrive','24 items','Open','Maya Patel','Review inherited guest links and project completion','Revalidate sharing and partner scope','classification','ITEM-809'],
    ['DSPM-104','all','High','AI input protection rollout gap','Configured AI integration','250 pilot users','In progress','Priya Shah','AI policy is simulation-only; live enforcement not claimed','Validate supported integration and pilot impact','dlp','DLP-AI-008'],
    ['DSPM-105','Operations','Medium','Employee content label gap','SharePoint Online','19 items','Open','Maya Patel','Review authorized HR classification evidence','Apply required label after content-owner validation','classification','ITEM-805'],
    ['DSPM-106','Engineering','Medium','Audit-only endpoint data movement','Endpoint','8 policy matches','In progress','Taylor Brooks','Monitor-only rule cannot prevent transfers','Review friction and pilot an appropriate enforcement action','dlp','DLP-END-003'],
    ['DSPM-107','Finance','Low','Tax evidence access review completed','SharePoint Online','6 items','Resolved','Daniel Cho','Unnecessary review-group membership removed in fixture','Continue periodic access review','classification','ITEM-812'],
    ['DSPM-108','all','Medium','Retention scope validation for AI','Supported AI locations','1 configured policy','Open','Alex Morgan','Retention depends on captured workload and supported location','Validate scope; do not assume arbitrary agent capture','lifecycle','RET-010']
  ];
  modules.dspm=module('Data Security Posture Management','fa-chart-simple','Prioritized data exposure findings and improvement work. Findings describe posture signals, not confirmed breaches.',
    ['Finding','Source','Affected scope','Priority','Owner','Status'],postureSpecs.map(p=>{const r=record(p[0],p[1],p[6],[p[3],p[4],p[5],p[2],p[7],p[6]],{'Finding ID':p[0],'Evidence summary':p[8],'Recommended action':p[9],'Assessment snapshot':snapshot,'Ownership':p[7],'Validation':'Reassess after source-side change; this dashboard performs no scan or remediation'},1,p[6]!=='Resolved');r.links=[{module:p[10],id:p[11]}];return r;}),false,['classification','dlp','agent-activity']);

  const cases=[
    ['CASE-401','Finance','Finance external sharing review','Active','Alex Morgan','12','2','2026-11-01','Review sharing and policy evidence around INC-2479','42 items in search preview; 12 selected custodians','dlp-alerts','DLP-2601'],
    ['CASE-402','Engineering','Project Atlas preservation','Active','Jordan Lee','8','3','2026-10-28','Preserve project collaboration content for authorized review','3 location-scoped holds; no tenant-wide hold','information','LBL-004'],
    ['CASE-403','Operations','Supplier contract response','Collection','Maya Patel','5','1','2026-10-24','Collect approved supplier agreement evidence','Collection scope limited to contract sites','lifecycle','RET-002'],
    ['CASE-404','all','Quarterly audit evidence request','Review','Alex Morgan','4','1','2026-10-20','Assemble authorized security-operation evidence','Review set contains 84 curated items; export approval pending','audit','AUD-6110'],
    ['CASE-405','Engineering','Engineering IP review','Active','Jordan Lee','6','1','2026-10-18','Contextual review of potential IP movement','No misconduct determination; privacy-controlled reviewer scope','insider','IRM-702'],
    ['CASE-406','Operations','Closed customer service inquiry','Closed','Chloe Davis','3','0','2026-09-30','Completed authorized request','Closure does not automatically release independently required retention','lifecycle','RET-011']
  ];
  modules.ediscovery=module('eDiscovery','fa-magnifying-glass','Fictional cases, custodians, holds, and collection/review progress. No searches, holds, exports, or legal actions are executed.',
    ['Case','Case ID','Custodians','Hold scopes','Case owner','Status'],cases.map(p=>{const r=record(p[0],p[1],p[3],[p[2],p[0],p[5],p[6],p[4],p[3]],{'Created':p[7],'Purpose':p[8],'Collection / review':p[9],'Authorized reviewers':p[4]+'; designated legal reviewer','Access boundary':'Case-specific role assignment; no legal-document contents embedded','Hold boundary':'Preservation applies only to configured sources; no global preservation claim'},1,p[3]!=='Closed');r.links=[{module:p[10],id:p[11]}];return r;}),false,['audit','records','dlp-alerts']);

  const insiderSpecs=[
    ['IRM-701','Operations','Medium','Anonymized user 018','Unusual file downloads','New',1,'5 signals','INC-2475; pre-departure policy trigger; no intent determined'],
    ['IRM-702','Engineering','High','Anonymized user 044','Potential source-file collection','In review',2,'7 signals','Project-context review requested; correlate authorized build tasks'],
    ['IRM-703','Finance','Medium','Anonymized user 026','Unusual finance sharing','New',1,'3 signals','Correlate financial DLP match with data-owner justification'],
    ['IRM-704','Engineering','Low','Anonymized user 061','Risky AI usage indicators','In review',3,'2 signals','Configured AI activity scope only; no inline enforcement implied'],
    ['IRM-705','Operations','Medium','Anonymized user 037','Endpoint transfer anomaly','In review',4,'4 signals','Review expected field-work process and authorized destination'],
    ['IRM-706','Finance','Low','Anonymized user 031','Finance access anomaly','Dismissed',5,'2 signals','Authorized quarter-close activity validated; dismissal is contextual'],
    ['IRM-707','Engineering','High','Anonymized user 049','Repeated external sharing signals','Escalated',6,'6 signals','Escalated to authorized investigator; not a conclusion of misconduct']
  ];
  modules.insider=module('Insider Risk Management','fa-user-shield','Privacy-preserving alert triage. Aliases intentionally do not map to real or fictional named employees in this dataset.',
    ['Alert','Anonymized participant','Policy signal','Risk indicator','Signals','Review state'],insiderSpecs.map(p=>record(p[0],p[1],p[5],[p[0],p[3],p[4],p[2],p[7],p[5]],{'Context':p[8],'Assigned role':'Authorized Insider Risk investigator','Privacy':'Identity reveal requires separate approved permissions and purpose; no reveal feature is present','Conclusion':'Signal only; no intent, guilt or misconduct established','Next step':'Review business context and corroborating evidence under approved workflow'},p[6],p[5]!=='Dismissed')),true,['communication','dlp-alerts','ediscovery']);

  const items=[
    ['ITEM-801','Finance','Q4-Financials.xlsx','SharePoint Online','Financial information','LBL-005','External sharing blocked','Sarah Chen',1],
    ['ITEM-802','Finance','Treasury-Forecast.xlsx','SharePoint Online','Financial information','LBL-005','Internal only','Daniel Cho',2],
    ['ITEM-803','Engineering','Architecture-Notes.docx','SharePoint Online','Engineering IP','LBL-006','Engineering group','Emma Wilson',3],
    ['ITEM-804','Operations','Employee-Benefits.xlsx','SharePoint Online','Employee information','LBL-007','HR authorized group','Maya Patel',2],
    ['ITEM-805','Operations','Benefits-Working-Copy.xlsx','SharePoint Online','Employee information',null,'Needs label review','HR content owner',1],
    ['ITEM-806','Engineering','Build-Module.txt','SharePoint Online','Source-code classifier','LBL-006','Engineering group','Liam Patel',4],
    ['ITEM-807','Engineering','Prototype-Design.docx','SharePoint Online','Engineering IP',null,'Needs label review','Nora Evans',1],
    ['ITEM-808','Finance','Vendor-Accounts.xlsx','OneDrive','Financial information','LBL-005','Internal only','Aisha Khan',3],
    ['ITEM-809','Operations','Partner-Handover.docx','OneDrive','Partner business content','LBL-008','Approved recipients','Maya Patel',1],
    ['ITEM-810','Engineering','Release-Checklist.docx','SharePoint Online','Project information','LBL-004','Project Atlas group','Noah Williams',5],
    ['ITEM-811','Operations','Public-Service-Guide.docx','SharePoint Online','General business content','LBL-001','Public approved copy','Chloe Davis',6],
    ['ITEM-812','Finance','Tax-Evidence-FY26.xlsx','SharePoint Online','Financial information','LBL-005','Tax evidence reviewers','Daniel Cho',9]
  ];
  modules.classification=module('Data classification','fa-tags','Selected content inventory, classification signals, labels and access context. No sensitive field values are embedded.',
    ['Item','Location','Classification','Sensitivity label','Access / review','Owner'],items.map(p=>{const label=labels.find(l=>l[0]===p[5]);const state=p[5]?'Labeled':'Needs label';const r=record(p[0],p[1],state,[p[2],p[3],p[4],label?.[1]||'Not labeled',p[6],p[7]],{'Item ID':p[0],'Last classification (UTC)':at(p[8]),'Classifier note':'Configured sensitive-information type or custom classifier; not an actual content scan','Contents':'Not included; metadata only','Review guidance':'Validate access, classification context and labeling with the authorized content owner'},1,!p[5]);if(p[5])r.links=[{module:'information',id:p[5]}];return r;}),false,['information','dspm','dlp-alerts']);

  const records=[
    ['REC-901','Finance','FY19 accounting evidence','Locked record','RET-001','2027-01-31','Finance records reviewer','Retention still active; no disposition permitted'],
    ['REC-902','Operations','Closed logistics records','Pending review','RET-008','2026-11-15','Operations records reviewer','First approval complete; second-stage review pending'],
    ['REC-903','Operations','Supplier agreement archive','Retained','RET-002','2031-06-30','Contracts reviewer','Contract end event verified; retention continues'],
    ['REC-904','Engineering','Release evidence package','Locked record','RET-007','2029-03-31','Engineering records reviewer','Review required at end of configured retention'],
    ['REC-905','Finance','Tax working papers FY26','Retained','RET-009','2036-10-31','Tax records reviewer','Tax evidence retention obligation remains active'],
    ['REC-906','Operations','Service correspondence batch','On hold','RET-011','Review deferred','Legal case reviewer','Disposition deferred due to independently configured preservation']
  ];
  modules.records=module('Records Management','fa-box-archive','Retention-governed records and disposition workflows. No deletion, record unlocking, or hold release is available here.',
    ['Record set','Record state','Retention reference','Next review / eligibility','Reviewer'],records.map(p=>{const r=record(p[0],p[1],p[3],[p[2],p[3],p[4],p[5],p[6]],{'Record set ID':p[0],'Disposition note':p[7],'Action authority':'Designated records reviewers; approval and legal prerequisites must be met','Review evidence':'Metadata-only fixture; no real deletion or unlock event generated'},1,p[3]==='Pending review');r.links=[{module:'lifecycle',id:p[4]}];return r;}),false,['lifecycle','ediscovery','audit']);

  const aiSpecs=[
    ['AI-501','Finance','Blocked','Configured enterprise agent','Prompt + attachment','Identifier match','Demo gateway',1,'Input stopped before modeled invocation; 0 model calls'],
    ['AI-502','Operations','Blocked','Configured enterprise agent','Attachment','Restricted sensitivity label','Demo gateway',1,'Confidential label restriction preserved; 0 model calls'],
    ['AI-503','Engineering','Allowed','Configured enterprise agent','Prompt','No configured match','Demo gateway',1,'Scripted response; no real model API called'],
    ['AI-504','Operations','Audit-only allowed','Configured enterprise agent','Prompt','Identifier match','Demo gateway',2,'Monitoring did not prevent matched input from reaching simulated agent'],
    ['AI-505','Engineering','Blocked','Configured enterprise agent','Prompt + attachment','Inspection unavailable','Demo gateway',3,'Configured gateway fails closed; no model invocation'],
    ['AI-506','Finance','Blocked','Managed browser upload','Browser upload','Financial-information match','Supported endpoint/browser policy',4,'Illustrative configured supported channel; not every browser/agent upload covered'],
    ['AI-507','Operations','In review','Supported AI interaction capture','Interaction metadata','Policy review match','Communication Compliance',5,'Review after supported capture; no inline block claimed'],
    ['AI-508','Engineering','Allowed','Configured enterprise agent','Revised request','Detected identifiers removed','Demo gateway',6,'Explicit fresh inspection and policy decision before simulated invocation']
  ];
  modules['agent-activity']=module('AI data security activity','fa-robot','Seeded AI protection observations; separate from current chatbot-session evidence. Enforcement differs by workload and integration.',
    ['Activity','Channel','Input / activity','Signal','Enforcement / review','Result'],aiSpecs.map((p,i)=>record(p[0],p[1],p[2],[p[0],p[3],p[4],p[5],p[6],p[2]],{'Context':p[8],'Actor':'Anonymized AI participant '+String(i+1).padStart(3,'0'),'Matched values':'Never embedded','Policy reference':p[6]==='Demo gateway'?'Custom pre-invocation integration pattern; isolated from tenant DLP pilot':'Configured supported workload','Integration boundary':'No universal agent interception, real Purview classifier or live alert generation is implied'},p[7],['In review','Audit-only allowed'].includes(p[2]))),true,['dlp','communication','audit']);

  for(const [key,mod]of Object.entries(modules))for(const row of mod.rows){
    row.details={'Record ID':row.id,'Business unit':row.unit==='all'?'Tenant-wide / shared':row.unit,...row.details,'Snapshot (UTC)':snapshot,'Data source':'Fictional Contoso fixture; no tenant connection'};
    row.timeline=[{time:row.time,event:mod.activity?'Sample event observed in configured workload':'Configuration or inventory captured in sample snapshot'},
      {time:snapshot,event:row.review?'Awaiting authorized contextual review in fixture':'Read-only sample retained; no action executed by dashboard'}];
    row.module=key;
  }
  function get(key){const mod=modules[key];if(!mod)throw new Error('Unknown Purview module');return mod;}
  function filter(key,{unit='all',days=7,query='',state='all'}={}){
    const mod=get(key);const phrase=query.trim().toLowerCase();
    return mod.rows.filter(r=>(unit==='all'||r.unit==='all'||r.unit===unit)&&(!mod.activity||r.age<=days)&&(state==='all'||r.state===state)&&(!phrase||`${r.id} ${r.unit} ${r.state} ${r.values.join(' ')} ${Object.values(r.details).join(' ')}`.toLowerCase().includes(phrase)));
  }
  return {snapshot,modules,get,filter};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PurviewData;