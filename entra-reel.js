'use strict';

// Scripted incident stories, not a detector, policy engine, or live response service.
const EntraReel = (() => {
  const scene=(phase,title,text,system,tone,facts,event,why)=>({phase,title,text,system,tone,facts,event,why});
  const episodes=[
    {
      id:'risky-user',title:'A risky identity is detected',subtitle:'From suspicious sign-in to verified remediation',icon:'fa-user-shield',
      person:'Sarah Chen',initials:'SC',unit:'Finance',email:'sarah.chen@contoso.com',resource:'Microsoft 365',
      capabilities:['Identity Protection','Conditional Access','Session revocation','Risk remediation','Audit evidence'],
      nodeLabels:['Identity','Sign-in signal','Access control','Microsoft 365'],
      choices:[{id:'contain',title:'Contain & verify the user',text:'Request session revocation, investigate the user, and complete verified secure remediation.',recommended:true},{id:'observe',title:'Block this attempt only',text:'See why stopping one sign-in does not resolve existing sessions or user risk.'}],
      steps:[
        scene('Environment','A normal workday. An existing session.','Sarah is working in Finance. A Microsoft 365 session already exists before the suspicious event.','Contoso environment','calm',[['User risk','No active detection in this story'],['Existing session','Present'],['Policy','CA004 enabled']],'Normal access established','Start with the environment, not the alert. The earlier session matters later.'),
        scene('Signal','A new sign-in arrives from an unfamiliar network.','A second authentication attempt uses Sarah’s identity from an unrecognized device. This is a signal to investigate—not proof on its own.','Sign-in telemetry','warning',[['User','sarah.chen@contoso.com'],['Network','203.0.113.84 · fictional location'],['Device','Unrecognized']],'Unfamiliar sign-in recorded','Signals need context. The address is documentation-only; no real IP intelligence is queried.'),
        scene('Detect','Entra flags the identity for investigation.','In this scripted example, correlated leaked-credential and unfamiliar sign-in detections raise user risk and sign-in risk to High.','Entra ID Protection','danger',[['User risk','High'],['Sign-in risk','High'],['Investigation','Required']],'High-risk detections correlated','User risk describes the identity; sign-in risk describes this attempt. They are separate signals.'),
        scene('Enforce','The new access attempt is blocked.','The enabled high sign-in risk policy matches. Conditional Access prevents this attempt from obtaining access—even if MFA could otherwise be satisfied.','Conditional Access · CA004','danger',[['New sign-in','Blocked'],['New access token','Not issued for this attempt'],['Earlier session','Not revoked by this decision']],'CA004 blocks the new attempt','Blocking a new sign-in does not automatically terminate previously established sessions.'),
        scene('Your decision','The attempt stopped. Is the incident over?','The audience is the analyst now. Choose a response and follow the consequences. Sarah’s earlier session and high user risk still need attention.','Security analyst','warning',[['New attempt','Blocked'],['User risk','Still High'],['Earlier access','Needs investigation']],'Analyst response required','A successful prevention control and complete incident remediation are not the same thing.'),
        scene('Respond','','','Security analyst','warning',[],'',''),
        scene('Outcome','','','Identity operations','success',[],'','')
      ],
      paths:{
        contain:[
          scene('Respond','Contain first. Verify before restoring trust.','The analyst requests session revocation and verifies Sarah through a trusted channel. A supported secure password reset and related evidence review are required next.','Analyst + identity service','warning',[['Session revocation','Requested in simulation'],['Secure remediation','Pending verification'],['User risk','High until remediation completes']],'Session revocation requested; verification started','Existing access-token and application-session behavior varies. Revocation is not a guarantee of instantaneous logout everywhere.'),
          scene('Outcome','The identity is remediated—not just the sign-in blocked.','After the simulated verified secure reset and evidence review, user risk is marked remediated in this story. Sarah can attempt a fresh, policy-compliant authentication.','Verified remediation','success',[['New attempt','Blocked by CA004'],['User risk','Remediated in story'],['Future access','Fresh authentication required']],'Verified remediation completed; case evidence recorded','A real case also needs review of consent grants and related activity. This story does not claim that all resource sessions ended or every compromise artifact was removed.')
        ],
        observe:[
          scene('Respond','Only the new attempt has been stopped.','No additional containment or verified remediation is performed. The earlier session is not resolved by the sign-in block.','Analyst decision','warning',[['New attempt','Blocked'],['Session revocation','Not requested'],['User risk','High']],'Analyst retains block-only response','This branch demonstrates the gap between prevention and response; it does not simulate confirmed misuse of the existing session.'),
          scene('Outcome','Access was prevented. Identity risk remains open.','Conditional Access did its job, but the investigation is incomplete. High user risk and potentially relevant earlier sessions still require action.','Investigation remains open','danger',[['Prevention','Successful for this attempt'],['Identity remediation','Not completed'],['Case','Open']],'Case remains open; residual identity risk recorded','Replay and choose containment to compare the outcomes. There is no automatic risk dismissal in this branch.')
        ]
      },
      nodes:[['Normal','Expected','Ready','Session present'],['Normal','Unfamiliar attempt','Evaluating','Earlier session'],['High risk','High sign-in risk','Risk policy ready','Earlier session'],['High risk','Attempt detected','BLOCK NEW SIGN-IN','Earlier session'],['High risk','Attempt blocked','Decision needed','Session unresolved']],
      pathNodes:{contain:[['High risk','Attempt blocked','Revocation requested','Verification pending'],['Remediated','Attempt blocked','Fresh auth required','Prior access reviewed']],observe:[['High risk','Attempt blocked','No further response','Session unresolved'],['Risk still open','Attempt blocked','Block only','Earlier access unresolved']]},
      takeaway:{contain:'Detect → prevent → contain → verify → remediate. Each control has a different job.',observe:'A blocked sign-in is not the same as a remediated identity.'},
      checkpointLabel:'Complete simulated verified remediation'
    },
    {
      id:'privileged-access',title:'Privileged access is requested',subtitle:'Give the right privilege, for the right amount of time',icon:'fa-user-lock',
      person:'Priya Shah',initials:'PS',unit:'Identity Engineering',email:'priya.shah@contoso.com',resource:'Conditional Access admin',
      capabilities:['PIM eligibility','Authentication strength','Approval workflow','Time-bound activation','Audit evidence'],
      nodeLabels:['Administrator','Activation request','PIM control','Privileged role'],
      choices:[{id:'approve',title:'Approve a 60-minute window',text:'The fictional approver authorizes a justified, time-limited activation.',recommended:true},{id:'deny',title:'Deny the request',text:'No role activation occurs. Watch how eligibility remains without active privilege.'}],
      steps:[
        scene('Environment','Eligible does not mean always privileged.','Priya is eligible for Conditional Access Administrator in this isolated story. The role is not active.','Privileged Identity Management','calm',[['Role assignment','Eligible'],['Active privilege','None'],['Activation limit','60 minutes']],'Eligible assignment loaded','This episode is separate from the seeded PIM inventory; it does not alter any directory role.'),
        scene('Signal','An urgent change needs temporary privilege.','Priya requests a 60-minute activation to investigate a Conditional Access issue, with a ticket and business justification.','PIM activation request','warning',[['Requested role','Conditional Access Administrator'],['Duration','60 minutes'],['Justification','Investigate identity incident · DEMO-2481']],'Activation requested with justification','The signal is a legitimate access request, not a threat detection. Entra also governs ordinary privileged work.'),
        scene('Validate','The request must satisfy activation requirements.','The story assumes a valid eligible assignment, supported phishing-resistant MFA, and a recorded justification. Approval is still required.','PIM activation policy','calm',[['Eligibility','Validated in story'],['Authentication','Phishing-resistant MFA assumed'],['Approval','Pending']],'Eligibility and activation requirements validated','No real authentication challenge is sent. Actual PIM activation controls depend on role settings and licensing.'),
        scene('Review','A separate approver reviews the request.','Alex Morgan checks the role, duration, and business need. Priya does not approve her own request.','Alex Morgan · fictional approver','warning',[['Requester','Priya Shah'],['Approver','Alex Morgan'],['Current privilege','Still inactive']],'Approval review opened','Separation of duties prevents the requester from silently granting themselves permanent privilege.'),
        scene('Your decision','Would you approve this request?','Choose the approver’s decision. No privilege has been activated yet.','Audience as approver','warning',[['Ticket','DEMO-2481'],['Requested window','60 minutes'],['Role','Conditional Access Administrator']],'Approver decision required','Approval and activation are simulated; no real tenant role is granted.'),
        scene('Activate','','','PIM','success',[],'',''),scene('Outcome','','','PIM','success',[],'','')
      ],
      paths:{
        approve:[
          scene('Activate','Privilege is active—for 60 minutes only.','The approved role activates. Priya can perform the modeled administrative task during the window. An activation event records who, why, and for how long.','PIM activation','success',[['Role','Active'],['Activation duration','60 minutes'],['Standing privilege created','No']],'Approved role activated for 60 minutes','Pause here to show the temporary privileged state. The next step explicitly fast-forwards the story clock.'),
          scene('Outcome','The window ends. Active privilege expires.','The story clock advances 60 minutes. The active role assignment expires, while the underlying eligible assignment remains available for a future approved request.','PIM expiration','success',[['Story time','+60 minutes'],['Active role','Expired'],['Eligibility','Retained']],'Simulated 60-minute window ends; active role expires','This models assignment expiration, not instantaneous invalidation of every previously issued resource token.')
        ],
        deny:[
          scene('Activate','The request is denied. No role activates.','The approver rejects the request. Priya remains eligible but does not receive active privilege.','PIM approval workflow','warning',[['Decision','Denied'],['Active role','None'],['Eligibility','Retained']],'Activation request denied','Eligibility is not itself an active administrative permission.'),
          scene('Outcome','No unnecessary privilege was introduced.','The request and denial remain available as story evidence. A new request would need to follow the same activation controls.','Least privilege maintained','success',[['Active role','None'],['Approval record','Retained'],['Future request','Controls still required']],'Denied request closed with audit evidence','PIM supports controlled privileged work; a denied request is a valid governed outcome.')
        ]
      },
      nodes:[['Eligible','No request','Activation required','Inactive'],['Eligible','60-minute request','Requirements checking','Inactive'],['MFA assumed','Justification recorded','Approval required','Inactive'],['Requester','Approver reviewing','No self-approval','Inactive'],['Requester','Decision pending','Approval gate','Inactive']],
      pathNodes:{approve:[['Approved','Ticket recorded','60-minute activation','ACTIVE'],['Still eligible','Window elapsed','Role expired','INACTIVE']],deny:[['Still eligible','Request denied','Approval refused','INACTIVE'],['Still eligible','Denial recorded','No activation','INACTIVE']]},
      takeaway:{approve:'Replace standing privilege with justified, approved, time-limited access.',deny:'An eligible user does not receive active privilege unless activation controls are satisfied.'},
      checkpointLabel:'Fast-forward 60 minutes'
    },
    {
      id:'device-access',title:'An unmanaged device requests access',subtitle:'Use device compliance as an access decision—not just a report',icon:'fa-laptop',
      person:'Daniel Cho',initials:'DC',unit:'Finance',email:'daniel.cho@contoso.com',resource:'Contoso Finance ERP',
      capabilities:['Device identity','Intune compliance signal','Conditional Access','Compliant reauthentication'],
      nodeLabels:['Employee','Device signal','Conditional Access','Finance ERP'],
      choices:[{id:'repair',title:'Remediate & recheck compliance',text:'Restore the encryption requirement, verify device check-in, and attempt fresh access.',recommended:true},{id:'hold',title:'Leave the device noncompliant',text:'Keep the protection in place and show why successful MFA alone is insufficient.'}],
      steps:[
        scene('Environment','Finance access requires a trusted device.','Daniel accesses Finance ERP from a managed workstation. The modeled policy requires a compliant device as well as appropriate authentication.','Contoso environment','calm',[['User','Daniel Cho'],['Authentication','MFA already satisfied'],['Required device state','Compliant']],'Device-protected ERP access established','Entra evaluates access; Intune supplies the compliance state in this connected story.'),
        scene('Signal','The device drifts out of compliance.','Disk encryption is disabled on FIN-LT-014. A simulated Intune check-in reports a failed encryption requirement.','Intune device compliance','warning',[['Device','FIN-LT-014'],['Encryption','Requirement failed'],['Last check-in','Simulated current check-in']],'Encryption compliance failure reported','This is a device-health signal, not proof that the employee or device is malicious.'),
        scene('Detect','The noncompliant state reaches the access decision.','The new token request includes the recognized device identity. Its compliance state is now noncompliant.','Device signal → Entra','danger',[['Device identity','Recognized'],['Compliance','Noncompliant'],['Authentication','MFA satisfied']],'New access request carries noncompliant device state','Registered, managed, and compliant are different properties. Registration alone does not establish compliance.'),
        scene('Enforce','MFA succeeds. ERP access still does not.','CA003 requires a compliant device for this Finance application. The new access attempt is blocked because the device requirement is unmet.','Conditional Access · CA003','danger',[['MFA requirement','Satisfied'],['Device requirement','Not satisfied'],['New ERP access','Blocked']],'CA003 denies the noncompliant attempt','Multiple applicable controls must be satisfied. Passing MFA does not override device compliance.'),
        scene('Your decision','How should access be restored?','Choose whether to repair and verify the device or leave the request blocked.','Audience as endpoint analyst','warning',[['App','Contoso Finance ERP'],['New request','Blocked'],['Policy bypass','Not configured']],'Device response required','This episode deliberately does not offer a bypass that silently weakens the access policy.'),
        scene('Respond','','','Endpoint analyst','warning',[],'',''),scene('Outcome','','','Conditional Access','success',[],'','')
      ],
      paths:{
        repair:[
          scene('Respond','Repair the device, then wait for evidence.','Encryption remediation is simulated. A fresh Intune compliance evaluation is required before the new access attempt can meet the policy.','Intune remediation','warning',[['Encryption fix','Simulated'],['Compliance recheck','Pending'],['ERP access','Still blocked pending verification']],'Device remediation initiated; compliance recheck pending','Deploying a fix or enrolling a device is not evidence that compliance has already been restored.'),
          scene('Outcome','A compliant device can satisfy the policy again.','The simulated check-in verifies encryption and reports Compliant. A fresh, MFA-satisfied ERP request now meets the modeled controls.','Verified compliance + fresh access','success',[['Compliance','Compliant after check-in'],['MFA','Satisfied'],['Fresh ERP request','Granted in story']],'Compliance verified; fresh ERP request allowed','Resource permissions are assumed for Daniel. This is not a live Intune remediation or actual token grant.')
        ],
        hold:[
          scene('Respond','Keep the device requirement enforced.','No compliance remediation is completed. Daniel’s valid MFA does not change the device state.','Access policy retained','warning',[['Compliance','Noncompliant'],['MFA','Satisfied'],['Policy','Still enforced']],'Device remains noncompliant; no exception applied','Access remains blocked for this modeled new request.'),
          scene('Outcome','The application remains protected.','No new ERP access is granted from the noncompliant device. Device remediation remains an open operational task.','Access denied until compliance','warning',[['New ERP access','Blocked'],['Device remediation','Open'],['User compromise claimed','No']],'New access stays blocked; remediation task remains open','A compliant alternative device could be a valid operational path, but it is outside this episode.')
        ]
      },
      nodes:[['MFA satisfied','Compliant device','Ready','Accessible'],['MFA satisfied','Encryption failed','Awaiting request','Protected'],['MFA satisfied','NONCOMPLIANT','Device requirement','Protected'],['MFA satisfied','NONCOMPLIANT','BLOCK ACCESS','Blocked'],['MFA satisfied','NONCOMPLIANT','Decision needed','Blocked']],
      pathNodes:{repair:[['MFA satisfied','Fix pending recheck','Verification required','Still blocked'],['MFA satisfied','COMPLIANT','Controls satisfied','Fresh access allowed']],hold:[['MFA satisfied','NONCOMPLIANT','Still enforced','Blocked'],['MFA satisfied','NONCOMPLIANT','No exception','Blocked']]},
      takeaway:{repair:'Remediate → verify compliance → reevaluate new access. MFA and device health are complementary.',hold:'Entra can enforce a device requirement even when the user has passed MFA.'},
      checkpointLabel:'Complete simulated device check-in'
    },
    {
      id:'guest-review',title:'External access is no longer needed',subtitle:'Discover stale access and make the review decision visible',icon:'fa-handshake',
      person:'Avery Morgan',initials:'AM',unit:'External project partner',email:'avery.morgan@partner.example.com',resource:'Project Atlas group',
      capabilities:['External Identities','Identity Governance','Access reviews','Auto-apply review decisions','Audit evidence'],
      nodeLabels:['Guest identity','Review signal','Access review','Project Atlas group'],
      choices:[{id:'remove',title:'Deny continued project access',text:'Apply the review denial to the group membership in scope. Keep the guest directory object.',recommended:true},{id:'retain',title:'Retain access with justification',text:'Record an approved exception and leave project membership in place for follow-up review.'}],
      steps:[
        scene('Environment','Partners need access—but not forever.','Avery is a guest member of Project Atlas. The project group grants access to the collaboration resources assumed in this story.','External Identities','calm',[['Identity type','Guest'],['Group membership','Project Atlas'],['Guest account','Enabled']],'Partner collaboration access established','The episode models a group access review, not a tenant-wide guest account cleanup.'),
        scene('Signal','The sponsor reports the project has ended.','Project Atlas finishes while Avery’s group membership remains. This business signal calls for an access review, not a compromise alert.','Project sponsor signal','warning',[['Project','Completed'],['Membership','Still present'],['Compromise detected','Not claimed']],'Project completion signal recorded','Stale access is an authorization and governance problem, even without malicious activity.'),
        scene('Detect','A scheduled review surfaces the guest membership.','The configured access review includes Project Atlas guests and sends the membership to the authorized reviewer. Auto-apply decisions is assumed enabled for this group.','Identity Governance · access review','warning',[['Review scope','Project Atlas guest members'],['Reviewer','Maya Patel'],['Auto-apply','Enabled in story']],'Guest membership included in scheduled review','A real review only reaches identities and resources in its configured scope.'),
        scene('Review','The reviewer sees business context.','Maya compares the completed project, sponsor confirmation, and current access. The review does not itself disable the guest account.','Authorized reviewer','warning',[['Sponsor','No current project requirement'],['Recommendation','Remove scoped access'],['Guest account','Still enabled']],'Reviewer examines business need','A recommendation is not an applied access change. The review decision and its application are separate steps.'),
        scene('Your decision','Does this guest still need Project Atlas?','Choose the review decision. The effect applies only to the project membership under review.','Audience as access reviewer','warning',[['Resource','Project Atlas group'],['Guest','Avery Morgan'],['Decision','Pending']],'Access review decision required','Reviewers can deny stale access or retain it with a documented business justification.'),
        scene('Apply','','','Identity Governance','warning',[],'',''),scene('Outcome','','','Access governance','success',[],'','')
      ],
      paths:{
        remove:[
          scene('Apply','The denial is recorded. Apply the review result.','The fictional reviewer denies continued membership. The configured auto-apply workflow is ready to remove access in the group under review.','Review result application','warning',[['Decision','Deny'],['Group change','Pending application'],['Guest object','Retained']],'Reviewer denies continued project membership','Group removal is not the same as deleting the guest identity or ending every application session.'),
          scene('Outcome','Project membership is removed. The guest account remains.','After simulated result application, Avery no longer belongs to Project Atlas. Other memberships and active sessions are outside this review.','Scoped access removed','success',[['Project Atlas membership','Removed'],['Guest directory object','Still exists'],['Other access','Not evaluated']],'Review denial applied; scoped group membership removed','Governance can remove unnecessary entitlements without claiming all guest access across the tenant has been revoked.')
        ],
        retain:[
          scene('Apply','An exception is recorded for follow-up work.','The reviewer retains membership with the fictional justification “approved project handover.” The access remains and needs a future review.','Review exception','warning',[['Decision','Retain'],['Justification','Approved project handover'],['Membership','Unchanged']],'Access retained with reviewer justification','The exception is a deliberate business decision, not an automatic determination that access is safe.'),
          scene('Outcome','Access remains—with ownership and evidence.','The reviewer’s decision is retained, and project membership stays in place. Continued business need must be revalidated at the next review.','Governed exception','warning',[['Project Atlas membership','Retained'],['Review evidence','Recorded'],['Follow-up review','Required']],'Retained access and follow-up requirement recorded','Compare the deny branch to demonstrate how review decisions produce different scoped access outcomes.')
        ]
      },
      nodes:[['Enabled guest','Active project','Scheduled review','Member'],['Enabled guest','Project completed','Review needed','Still member'],['Enabled guest','Membership surfaced','Review in scope','Still member'],['Enabled guest','Sponsor evidence','Decision pending','Still member'],['Enabled guest','Review ready','Decision needed','Still member']],
      pathNodes:{remove:[['Guest retained','Denial recorded','Application pending','Still member'],['Guest retained','Evidence recorded','Denial applied','REMOVED']],retain:[['Guest retained','Exception recorded','Retain decision','Still member'],['Guest retained','Follow-up required','Decision recorded','MEMBERSHIP RETAINED']]},
      takeaway:{remove:'Review the business need, apply the decision, and verify the exact access removed.',retain:'Governance makes retained access an explicit, owned decision—not invisible standing access.'},
      checkpointLabel:'Apply simulated review results'
    }
  ];
  function getEpisode(id){const episode=episodes.find(e=>e.id===id);if(!episode)throw new Error('Unknown reel episode');return episode;}
  function getScene(state){
    const episode=getEpisode(state.episode);
    const result=state.step>=5&&state.choice?episode.paths[state.choice]?.[state.step-5]:episode.steps[state.step];
    if(!result)throw new Error('Invalid reel state');
    return JSON.parse(JSON.stringify(result));
  }
  function getNodes(state){const e=getEpisode(state.episode);return [...(state.step>=5?e.pathNodes[state.choice][state.step-5]:e.nodes[state.step])];}
  function clock(state,index){
    const seconds=state.episode==='privileged-access'&&state.choice==='approve'&&index===6?3675:[0,20,40,55,60,75,120][index];
    return new Date(Date.parse('2026-11-02T09:00:00Z')+seconds*1000).toISOString().slice(11,19)+' UTC';
  }
  function timeline(state){return Array.from({length:state.step+1},(_,index)=>{const s=getScene({...state,step:index});return {step:index,time:clock(state,index),system:s.system,text:s.event,tone:s.tone};});}
  function createPlayer(){
    let state={episode:'risky-user',step:0,choice:null};
    return {
      snapshot:()=>({...state}),
      select(id){getEpisode(id);state={episode:id,step:0,choice:null};},
      next(){if(state.step===4)throw new Error('Choose an analyst response first');if(state.step<6)state={...state,step:state.step+1};},
      choose(id){const e=getEpisode(state.episode);if(state.step!==4||!e.choices.some(c=>c.id===id))throw new Error('Invalid response for this scene');state={...state,choice:id,step:5};},
      back(){if(state.step>0){const step=state.step-1;state={...state,step,choice:step<=4?null:state.choice};}},
      replay(){state={episode:state.episode,step:0,choice:null};}
    };
  }
  return {episodes,getEpisode,getScene,getNodes,timeline,clock,createPlayer};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=EntraReel;