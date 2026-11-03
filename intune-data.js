'use strict';

const IntuneData=(()=>{
  const snapshot='2026-11-02T09:42:00Z',modules={};
  const link=(module,id)=>({module,id});
  const row=(id,unit,state,values,details={},age=1,links=[])=>({id,unit,state,values:values.map(String),details,age,review:!['Healthy','Compliant','Succeeded','Installed','Enabled','Ready','Published','Completed','Available'].includes(state),links,time:new Date(Date.parse(snapshot)-(age-1)*86400000-19*60000).toISOString(),timeline:[]});
  const mod=(title,icon,subtitle,columns,rows,activity=false,links=[])=>({title,icon,subtitle,columns,rows,activity,links});

  const devices=[
    ['DEV-001','Finance','FIN-LT-042','Windows 11 Enterprise','Compliant','Corporate','Priya Nair','BitLocker enabled; last check-in current',1],
    ['DEV-002','Engineering','ENG-WS-083','Windows 11 Enterprise','Compliant','Corporate','Emma Wilson','Defender risk low; security baseline applied',1],
    ['DEV-003','Operations','OPS-LT-118','Windows 10 Enterprise','Noncompliant','Corporate','Taylor Brooks','BitLocker not enabled; check-in required',2],
    ['DEV-004','Engineering','ENG-MAC-012','macOS 15','Compliant','Corporate','Liam Patel','FileVault reported enabled',1],
    ['DEV-005','Operations','MOB-IOS-206','iOS 26','Compliant','Personally owned','Chloe Davis','App protection active; device enrollment not asserted',1],
    ['DEV-006','Finance','FIN-LT-027','Windows 11 Enterprise','Noncompliant','Corporate','Aisha Khan','Quality update overdue; user restart pending',4],
    ['DEV-007','Engineering','ENG-LT-094','Windows 11 Enterprise','Compliant','Corporate','Noah Williams','Autopilot provisioned; primary user assigned',3],
    ['DEV-008','Operations','OPS-MAC-009','macOS 15','Unknown','Corporate','Olivia Reed','Offline since Oct 27; current compliance cannot be verified',7]
  ];
  modules.devices=mod('Device inventory','fa-laptop','Selected managed device records across supported platforms and ownership models. The dashboard does not connect to Intune or execute remote actions.',
    ['Device','Platform','Compliance','Ownership','Primary user','Check-in context'],devices.map(d=>row(d[0],d[1],d[4],[d[2],d[3],d[4],d[5],d[6],d[7]],{'Device ID':d[0],'Management authority':'Intune fixture; no MDM channel connected','Enrollment context':d[5]==='Personally owned'?'App protection scenario; enrollment not asserted':'Corporate enrolled-device example','Security note':d[7]},d[8],[link('compliance','CMP-'+d[0].slice(-3))])),true,['compliance','endpoint-security','applications','autopilot']);

  const compliance=[
    ['CMP-001','Finance','FIN-LT-042','Compliant','Encryption','BitLocker enabled; recovery key escrow modeled',1,'DEV-001'],
    ['CMP-002','Engineering','ENG-WS-083','Compliant','Device risk','Defender for Endpoint signal: low',1,'DEV-002'],
    ['CMP-003','Operations','OPS-LT-118','Noncompliant','Encryption','BitLocker required; setting not detected',2,'DEV-003'],
    ['CMP-004','Engineering','ENG-MAC-012','Compliant','FileVault','Encryption reported by managed macOS inventory',1,'DEV-004'],
    ['CMP-005','Operations','MOB-IOS-206','Compliant','App protection','Supported app policy; not a whole-device assertion',1,'DEV-005'],
    ['CMP-006','Finance','FIN-LT-027','Noncompliant','OS version','Minimum quality update baseline not met',4,'DEV-006'],
    ['CMP-007','Engineering','ENG-LT-094','Compliant','Secure boot','Windows compliance policy evaluated successfully',3,'DEV-007'],
    ['CMP-008','Operations','OPS-MAC-009','Unknown','Check-in age','Offline; fresh compliance evaluation unavailable',7,'DEV-008']
  ];
  modules.compliance=mod('Device compliance','fa-circle-check','Compliance policy results with the contributing setting and evaluation boundary. Intune evaluates; Conditional Access enforcement is a separate configured Entra decision.',
    ['Device','Policy result','Failed / evaluated setting','Evidence','Access context'],compliance.map(c=>row(c[0],c[1],c[3],[c[2],c[3],c[4],c[5],c[3]==='Compliant'?'Eligible if access policy requires it':'Access decision depends on separate policy'],{'Evaluation':'Sample compliance result; no live check-in','Enforcement boundary':'Entra Conditional Access separately evaluates new resource requests','Remediation':'No policy sync or device fix is initiated'},c[6],[link('devices',c[7])])),true,['devices','endpoint-security','configuration-profiles']);

  const endpoint=[
    ['ES-001','Finance','Windows Disk Encryption','BitLocker','Enabled','Finance Windows devices','Recovery key escrow required'],
    ['ES-002','Engineering','Windows Defender Antivirus','Antivirus','Enabled','Engineering Windows devices','Cloud protection and tamper protection settings'],
    ['ES-003','Operations','Windows Firewall baseline','Firewall','Enabled','Corporate Windows devices','Domain/private/public profile requirements'],
    ['ES-004','Engineering','Attack Surface Reduction pilot','Attack surface reduction','In review','Engineering pilot group','Rule actions and exclusions require validation'],
    ['ES-005','Finance','Endpoint Detection and Response','EDR onboarding','Enabled','Eligible Windows endpoints','Defender integration prerequisites apply'],
    ['ES-006','Operations','macOS FileVault baseline','Disk encryption','Enabled','Corporate macOS devices','Platform-specific reporting and key escrow'],
    ['ES-007','Engineering','Local administrator reduction','Account protection','In review','Developer workstations','Application compatibility review pending'],
    ['ES-008','all','Security baseline release 2026-Q4','Security baseline','Published','Targeted Windows 11 devices','Assignment ring staged; not every tenant device']
  ];
  modules['endpoint-security']=mod('Endpoint security','fa-shield-halved','Endpoint security policy references for encryption, antivirus, firewall, EDR, attack-surface reduction and account protection. Assignments are sample metadata, not deployed policy.',
    ['Policy','Policy type','Assignment','State','Configuration evidence'],endpoint.map(e=>row(e[0],e[1],e[4],[e[2],e[3],e[5],e[4],e[6]],{'Owner':e[1]==='all'?'Endpoint engineering':e[1]+' endpoint team','Deployment status':'Fictional assignment; no device received a policy from this UI','Platform support':'Settings, editions and reporting vary by platform'},1,[link('devices',e[1]==='Finance'?'DEV-001':e[1]==='Engineering'?'DEV-002':e[1]==='Operations'?'DEV-003':'DEV-007')])),false,['compliance','configuration-profiles','devices']);

  const profiles=[
    ['PRO-001','Finance','Windows Finance security settings','Settings catalog','Windows 11','Succeeded','BitLocker, firewall and password baseline'],
    ['PRO-002','Engineering','Engineering browser configuration','Settings catalog','Windows 11','Succeeded','Browser security and extension controls'],
    ['PRO-003','Operations','Operations device restrictions','Device restrictions','Windows 10/11','In progress','Assignment conflicts under review'],
    ['PRO-004','Engineering','macOS platform restrictions','Device restrictions','macOS','Succeeded','FileVault and password settings'],
    ['PRO-005','Operations','Mobile managed app configuration','App configuration','iOS / Android','Succeeded','Outlook work-account configuration'],
    ['PRO-006','Finance','Finance Wi-Fi configuration','Wi-Fi profile','Windows / iOS','In progress','Certificate trust-chain check pending'],
    ['PRO-007','Engineering','Developer certificate profile','Certificate','Windows / macOS','In review','Renewal owner validation required'],
    ['PRO-008','all','Corporate security baseline','Baseline','Windows 11','Published','Pilot then broad-ring assignment plan']
  ];
  modules['configuration-profiles']=mod('Configuration profiles','fa-sliders','Settings catalog, device restrictions, app configuration, Wi-Fi and certificate profile assignments. A reported success is a fictional snapshot, not a live device receipt.',
    ['Profile','Type','Platform','Assignment state','Configured purpose'],profiles.map(p=>row(p[0],p[1],p[5],[p[2],p[3],p[4],p[5],p[6]],{'Assignment group':p[1]==='all'?'Managed Windows pilot and staged rings':p[1]+' managed devices','Last modified':'2026-10-28 by sample profile owner','Deployment boundary':'No profile is sent to a device by this prototype'},p[5]==='In progress'?3:1,[link('groups','GRP-'+(p[1]==='Finance'?'001':p[1]==='Engineering'?'002':p[1]==='Operations'?'003':'008'))])),false,['endpoint-security','groups','devices']);

  const apps=[
    ['APP-001','all','Microsoft 365 Apps','Windows','Required','Available','Monthly Enterprise channel'],
    ['APP-002','Finance','Microsoft Outlook','iOS / Android','Required','Available','Managed account and app-protection assignment'],
    ['APP-003','Engineering','Microsoft Edge','Windows / mobile','Required','Available','Managed configuration profile linked'],
    ['APP-004','Operations','Microsoft Teams','Windows / iOS / Android','Available','Available','Work account sign-in required'],
    ['APP-005','Engineering','Visual Studio Code','Windows','Required','In progress','Developer workstation assignment'],
    ['APP-006','Finance','Finance reporting client','Windows','Available','In review','Business owner approval pending'],
    ['APP-007','Operations','OneNote Work','iOS / Android','Available','Available','Approved protected destination for work data'],
    ['APP-008','Engineering','Build tools bundle','Windows','Required','In progress','Dependency and restart window coordination']
  ];
  modules.applications=mod('Managed applications','fa-window-maximize','Selected app assignments, platform and deployment state. Availability is a fixture, not a catalog query or install action.',
    ['Application','Platform','Assignment','Install state','Release context'],apps.map(a=>row(a[0],a[1],a[5],[a[2],a[3],a[4],a[5],a[6]],{'App type':'Managed application deployment reference','Assignment intent':a[4]+' assignment to '+a[1]+' users or devices','Install boundary':'No app is downloaded or installed by this dashboard','Policy relationship':a[2]==='Microsoft Outlook'||a[2]==='OneNote Work'?'See the separate App protection module':'See related configuration profile'},a[5]==='In progress'?2:1,[link('app-protection',a[2]==='Microsoft Outlook'?'MAM-002':'MAM-007'),link('groups',a[1]==='Finance'?'GRP-001':a[1]==='Engineering'?'GRP-002':a[1]==='Operations'?'GRP-003':'GRP-008')])),true,['app-protection','groups','configuration-profiles']);

  const mam=[
    ['MAM-001','Finance','Finance data protection','iOS / Android','Block personal save','Enabled','Managed Outlook and Office apps'],
    ['MAM-002','Operations','Outlook work-data protection','iOS / Android','Block unmanaged transfer','Enabled','Work account required; app-level controls'],
    ['MAM-003','Engineering','Developer app protection','iOS / Android','Require app PIN','Enabled','Selected supported apps'],
    ['MAM-004','all','Mobile browser protection','iOS / Android','Restrict web transfer','Enabled','Managed Edge integration'],
    ['MAM-005','Finance','Finance app selective wipe','iOS / Android','Admin selective wipe','In review','No wipe action is performed by the demo'],
    ['MAM-006','Operations','Personal enrollment exemption','Personally owned','App-level only','Enabled','Does not assert device enrollment/compliance'],
    ['MAM-007','Operations','Approved work-data destination','iOS / Android','Allow protected app transfer','Enabled','OneNote Work alternative in showcase'],
    ['MAM-008','Engineering','Mobile sharing exception','iOS / Android','Review required','In review','Owner validation before exception']
  ];
  modules['app-protection']=mod('App protection policies','fa-mobile-screen-button','Mobile Application Management examples for supported apps, with or without device enrollment. App protection is distinct from full device compliance.',
    ['Policy','Platform / scope','Data transfer control','State','Targeted apps'],mam.map(m=>row(m[0],m[1],m[5],[m[2],m[3],m[4],m[5],m[6]],{'Data boundary':'Work data controls apply to supported targeted applications, not every personal app','Enrollment':'Policy may apply without enrollment; no whole-device compliance assertion','Execution':'No app restriction, selective wipe, clipboard or device action is executed'},1,[link('applications',m[0]==='MAM-007'?'APP-007':'APP-002')])),false,['applications','groups','users']);

  const update=[
    ['UPD-001','Engineering','Windows 11 quality ring - Pilot','Quality update','7 days','12 devices','On schedule'],
    ['UPD-002','Finance','Windows 11 quality ring - Broad','Quality update','14 days','2,140 devices','In progress'],
    ['UPD-003','Operations','Windows 10 servicing ring','Quality update','14 days','3,960 devices','Needs review'],
    ['UPD-004','Engineering','Windows 11 feature update 25H2','Feature update','30 days','480 devices','In progress'],
    ['UPD-005','Finance','Driver update pilot','Driver update','7 days','24 devices','In review'],
    ['UPD-006','Operations','Restart notification policy','User experience','3 days','4,018 devices','Enabled'],
    ['UPD-007','Engineering','Expedited security update','Expedited quality','24 hours','6 devices','Completed'],
    ['UPD-008','all','Update safeguard hold review','Safeguard','Manual review','Selected devices','Open']
  ];
  modules['update-rings']=mod('Windows updates','fa-arrows-rotate','Quality, feature, driver and expedited update policy references with staged rollout context. Windows Autopatch and third-party patching are separate capabilities.',
    ['Update policy','Type','Deferral / deadline','Target size','Status'],update.map(u=>row(u[0],u[1],u[6],[u[2],u[3],u[4],u[5],u[6]],{'Rollout approach':'Pilot and broad deployment rings; aggregate target size is independent of listed sample devices','Safeguard':'Review known compatibility holds before broad deployment','Action boundary':'No update is approved, scheduled, or installed by this dashboard'},u[6]==='Completed'?4:1,[link('devices',u[1]==='Finance'?'DEV-006':u[1]==='Engineering'?'DEV-007':'DEV-003')])),true,['devices','configuration-profiles','reports']);

  const autopilot=[
    ['AUTO-001','Finance','FIN-NEW-017','Assigned','User-driven','Finance secured workstation'],
    ['AUTO-002','Engineering','ENG-NEW-022','Assigned','Pre-provisioned','Developer workstation profile'],
    ['AUTO-003','Operations','OPS-NEW-014','In progress','User-driven','Operations standard profile'],
    ['AUTO-004','Engineering','ENG-NEW-023','Ready','Self-deploying','Shared engineering device'],
    ['AUTO-005','Finance','FIN-NEW-018','Needs review','User-driven','Hardware hash owner verification pending'],
    ['AUTO-006','Operations','OPS-NEW-015','Assigned','User-driven','Operations frontline profile'],
    ['AUTO-007','Engineering','ENG-NEW-024','In progress','Pre-provisioned','Application install dependency review'],
    ['AUTO-008','all','Profile compliance check','Ready','Deployment profile','Signed-in account and enrollment prerequisites']
  ];
  modules.autopilot=mod('Windows Autopilot','fa-laptop-file','Fictional registration and deployment profile references. No hardware hashes, OOBE workflow, device enrollment or provisioning is performed.',
    ['Registration / device','Deployment profile','Deployment mode','State','Provisioning note'],autopilot.map(a=>row(a[0],a[1],a[3],[a[2],a[5],a[4],a[3],a[1]==='all'?'Prerequisite checklist':'Profile assignment reference'],{'Provisioning':'No device registration or profile assignment is performed','Prerequisites':'Supported Windows edition, OEM registration, network, Entra and Intune entitlements','Hardware identifiers':'Real serials and hardware hashes are intentionally omitted'},a[3]==='Ready'?1:2,[link('groups',a[1]==='Finance'?'GRP-001':a[1]==='Engineering'?'GRP-002':a[1]==='Operations'?'GRP-003':'GRP-008')])),false,['devices','groups','configuration-profiles']);

  const users=[
    ['USR-001','Finance','Priya Nair','Device user','FIN-LT-042','Standard user'],
    ['USR-002','Engineering','Emma Wilson','Device user','ENG-WS-083','Developer'],
    ['USR-003','Operations','Taylor Brooks','Device user','OPS-LT-118','Operations staff'],
    ['USR-004','Engineering','Liam Patel','Device user','ENG-MAC-012','Engineering staff'],
    ['USR-005','Operations','Chloe Davis','App protection user','MOB-IOS-206','Personally owned mobile'],
    ['USR-006','Finance','Aisha Khan','Device user','FIN-LT-027','Finance staff'],
    ['USR-007','Engineering','Noah Williams','Device user','ENG-LT-094','Developer'],
    ['USR-008','Operations','Olivia Reed','Device user','OPS-MAC-009','Check-in pending']
  ];
  modules.users=mod('Intune users','fa-users','Selected Intune assignment principals and primary device associations. User profile and identity governance remain in Microsoft Entra.',
    ['User','Assignment role','Primary device','Department context','Assignment state'],users.map(u=>row(u[0],u[1],'Assigned',[u[2],u[3],u[4],u[5],'Assigned'],{'Identity authority':'Microsoft Entra; this is a fictional Intune assignment view','Enrollment relationship':'Device assignment association only; user sign-in is not tested','Privacy':'Fictional display identity; no personal identifiers'},1,[link('devices',devices.find(d=>d[2]===u[4])[0])])),false,['devices','groups','app-protection']);

  const groups=[
    ['GRP-001','Finance','Finance Managed Windows','Assigned','2,140','Compliance and security profiles'],
    ['GRP-002','Engineering','Engineering Workstations','Assigned','3,860','Endpoint security and developer apps'],
    ['GRP-003','Operations','Operations Managed Devices','Assigned','4,018','Shared device and mobile policies'],
    ['GRP-004','Finance','Finance Mobile Apps','Assigned','286','App protection for managed apps'],
    ['GRP-005','Engineering','Developer Pilot Ring','Assigned','480','Feature update pilot and ASR'],
    ['GRP-006','Operations','Operations Update Broad','Assigned','3,960','Windows servicing cohort'],
    ['GRP-007','all','Intune All Devices','Dynamic','12,612','Tenant aggregate; groups may overlap'],
    ['GRP-008','all','Corporate Autopilot Pilot','Assigned','64','Staged device provisioning']
  ];
  modules.groups=mod('Assignment groups','fa-people-group','Fictional user/device targeting groups. Membership totals are aggregate references and may overlap; no group membership changes are made.',
    ['Group','Membership type','Population','Assignment purpose','State'],groups.map(g=>row(g[0],g[1],g[3],[g[2],g[3],g[4],g[5],g[3]],{'Assignment model':g[3]==='Dynamic'?'Membership is evaluated by an Entra dynamic rule in production':'Static sample assignment; no live group membership','Population note':'Illustrative aggregate; not a count of rows in this module','Owner':g[1]==='all'?'Endpoint engineering':g[1]+' IT'},1,[link('configuration-profiles',g[1]==='Finance'?'PRO-001':g[1]==='Engineering'?'PRO-002':g[1]==='Operations'?'PRO-003':'PRO-008')])),false,['users','configuration-profiles','applications']);

  const tenant=[
    ['TEN-001','Enrollment','MDM authority','Microsoft Intune','Configured in fixture','Tenant-level enrollment reference'],
    ['TEN-002','Enrollment','Windows automatic enrollment','Selected user scope','Enabled','Requires Entra and enrollment prerequisites'],
    ['TEN-003','Connector','Microsoft Defender for Endpoint','Connected in sample','Configured','No live connector or health check'],
    ['TEN-004','Connector','Apple push notification service','Renewal review','Needs review','Certificate expiry tracking example'],
    ['TEN-005','Connector','VPP / Apps and Books','Not connected','Not configured','Apple token and location prerequisites'],
    ['TEN-006','Tenant status','Service health','Unavailable offline','Unknown','No Microsoft service status was queried'],
    ['TEN-007','Role scope','Intune Administrator','Eligible assignment reference','Configured','Role activation is managed in Entra PIM'],
    ['TEN-008','Licensing','Microsoft Intune entitlement','Not assessed','Review required','Validate purchased plan and workload features']
  ];
  modules.tenant=mod('Tenant administration','fa-building','Tenant, connector, authority, role and license reference checks. Every status is a fixed fixture; no tenant authentication or service health query is available.',
    ['Area','Setting','Configured reference','State','Operational note'],tenant.map(t=>row(t[0],'all',t[4],[t[1],t[2],t[3],t[4],t[5]],{'Source service':'Intune/Entra configuration reference','Verification':'No live tenant API, connector health probe or licensing validation','Change boundary':'This interface cannot modify tenant settings'})),false,['all-services','devices','groups']);

  const dashboard=[
    ['DASH-001','all','Managed endpoint coverage','12,612 devices','Fixed sample aggregate','Inventory subset is not the aggregate'],
    ['DASH-002','all','Compliance posture','96.2% compliant','Fixed sample aggregate','479 devices reported noncompliant in aggregate'],
    ['DASH-003','all','Windows encryption','98.1% enabled','Eligible Windows population','Not derived from the eight device examples'],
    ['DASH-004','Finance','Finance compliance review','2 selected findings','Curated sample','See device compliance cases'],
    ['DASH-005','Engineering','Update deployment','Pilot progressing','Curated sample','Check update ring timeline'],
    ['DASH-006','Operations','Encryption follow-up','OPS-LT-118','Curated sample','Separate device-protection scenario'],
    ['DASH-007','all','App protection readiness','8 policy references','Point-in-time','Assignments require supported apps and licensing'],
    ['DASH-008','all','Service connectivity','Not verified','Offline fixture','No Intune service is connected']
  ];
  modules.dashboard=mod('Intune dashboard','fa-table-cells-large','Operational highlights for the selected sample scope. Tenant aggregates are independent of curated detail rows.',
    ['Dashboard card','Scope','Displayed sample','Basis','Interpretation'],dashboard.map(d=>row(d[0],d[1],d[4],[d[2],d[1],d[3],d[4],d[5]],{'Reporting snapshot':snapshot,'Aggregation':'Fixed aggregate or selected demo subset as stated','Live telemetry':'None; this page does not query Intune'})),false,['devices','compliance','update-rings','reports']);

  const services=[
    ['SVC-001','Device Management','Enrollment and inventory','Available capability','Enrollment, supported platforms and licensing apply'],
    ['SVC-002','Compliance','Device compliance policies','Configured reference','Conditional Access enforcement requires separate Entra configuration'],
    ['SVC-003','Endpoint security','Encryption, firewall and EDR policy','Configured reference','Settings depend on OS edition and Defender integration'],
    ['SVC-004','Apps','App deployment and configuration','Available capability','Platform, app type and assignment filters apply'],
    ['SVC-005','Mobile application management','App protection policies','Available capability','Supported apps; may operate without device enrollment'],
    ['SVC-006','Windows Autopilot','Cloud-driven provisioning','Available capability','Supported editions, OEM registration and entitlements apply'],
    ['SVC-007','Windows updates','Quality and feature update rings','Available capability','Autopatch and third-party updates have separate prerequisites'],
    ['SVC-008','Remote help and privilege','Intune Suite capabilities','License-dependent','Separate suite entitlement; not asserted as included']
  ];
  modules['all-services']=mod('All services','fa-list','Intune service capability guide with realistic deployment examples and entitlement boundaries. This is not a tenant service inventory.',
    ['Capability area','Service','Reference state','Prerequisites / scope'],services.map(s=>row(s[0],'all',s[3],[s[1],s[2],s[3],s[4]],{'Service health':'Not queried','Entitlement':'Validate workload-specific plan and region','Deployment':'Reference only; no service or policy provisioned'})),false,['devices','endpoint-security','app-protection','autopilot']);

  const reports=[
    ['RPT-001','all','Compliance by platform','96.2% aggregate compliant','Published','Tenant aggregate, not sample row ratio'],
    ['RPT-002','Finance','Encryption compliance trend','BitLocker remediation open','In review','Selected compliance evidence'],
    ['RPT-003','Engineering','Windows quality update status','Pilot on schedule','Published','Update ring fixture'],
    ['RPT-004','Operations','Noncompliant device follow-up','2 selected records','In progress','OPS-LT-118 and offline device evidence'],
    ['RPT-005','all','Application assignment overview','8 selected deployments','Published','Small sample subset'],
    ['RPT-006','all','Autopilot deployment readiness','64 devices in pilot aggregate','In review','Not a live enrollment report'],
    ['RPT-007','all','Endpoint security policy status','8 selected references','Published','Assignments are not a device receipt'],
    ['RPT-008','all','Service connection readiness','2 integrations need review','In review','Fixed offline sample statuses']
  ];
  modules.reports=mod('Intune reports','fa-chart-column','Curated report definitions and outcomes. Fixed aggregates are separate from selected records and are not recalculated by the dashboard.',
    ['Report','Scope','Sample result','State','Metric interpretation'],reports.map(r=>row(r[0],r[1],r[4],[r[2],r[1],r[3],r[4],r[5]],{'Snapshot':snapshot,'Report source':'Fictional Intune fixture; no service export','Data boundary':'Tenant totals and curated sample subsets are explicitly distinguished'})),false,['dashboard','compliance','devices','update-rings']);

  const support=[
    ['SUP-001','Finance','BitLocker compliance not detected','Device check-in and escrow validation','Open'],
    ['SUP-002','Operations','Windows update deadline exceeded','Review servicing ring and restart window','In progress'],
    ['SUP-003','Engineering','Developer app install pending','Check assignment filters and dependencies','In review'],
    ['SUP-004','Operations','macOS device has stale status','Restore connectivity; do not infer compliance','Open'],
    ['SUP-005','all','Apple push certificate renewal','Validate owner and renewal window','Needs review'],
    ['SUP-006','all','Conditional Access device block','Check Intune state and separate Entra policy','Available documentation'],
    ['SUP-007','all','Autopilot registration checklist','Verify supported device and OEM registration','Available documentation'],
    ['SUP-008','all','Application protection transfer','Confirm supported app and targeted policy','Available documentation']
  ];
  modules.support=mod('Troubleshooting & support','fa-screwdriver-wrench','Common fictional operational support cases with safe diagnostic direction. No support ticket is submitted and no device command is issued.',
    ['Support reference','Issue','Diagnostic next step','State'],support.map(s=>row(s[0],s[1],s[4],[s[2],s[0],s[3],s[4]],{'Guidance':s[3],'Support action':'No request submitted; no endpoint command executed','Escalation':'Use the organization-approved Microsoft support channel when applicable'})),false,['devices','compliance','tenant','all-services']);

  const expected=Object.keys(modules);
  for(const [key,module]of Object.entries(modules))for(const r of module.rows){
    r.module=key;r.details={'Record ID':r.id,'Business unit':r.unit==='all'?'Shared tenant record':r.unit,...r.details,'Workflow state':r.state,'Snapshot (UTC)':snapshot,'Data source':'Fictional Contoso Intune fixture; no live connection'};
    r.timeline=[{time:r.time,event:module.activity?'Sample device or deployment evidence observed':'Reference configuration captured in fixed snapshot'},{time:snapshot,event:r.review?'Owner review, remediation, or verification remains pending':'Sample status retained; no dashboard action executed'}];
  }
  function get(key){if(!modules[key])throw new Error('Unknown Intune module');return modules[key];}
  function filter(key,{unit='all',days=7,query='',state='all'}={}){const m=get(key),phrase=query.trim().toLowerCase();return m.rows.filter(r=>(unit==='all'||r.unit==='all'||r.unit===unit)&&(!m.activity||r.age<=days)&&(state==='all'||r.state===state)&&(!phrase||`${r.id} ${r.unit} ${r.values.join(' ')} ${Object.values(r.details).join(' ')}`.toLowerCase().includes(phrase)));}
  return {snapshot,modules,get,filter};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=IntuneData;
