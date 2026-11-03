'use strict';

// Scenario-only state. Never executes remote actions, scans, or a token request.
const IntuneDeviceDemo=(()=>{
  const scenarios=[
    {id:'encryption',name:'An unencrypted laptop',icon:'fa-laptop',device:'FIN-LT-042',platform:'Windows 11 Enterprise',user:'Sarah Chen',initials:'SC',unit:'Finance',kind:'device',app:'Finance workspace',action:'Open Finance workspace',
      issue:'Disk encryption is not enabled',signal:'Intune compliance',rule:'Windows · Require BitLocker',requirement:'BitLocker encryption must be enabled',fix:'Simulate enabling BitLocker',fixTitle:'Encryption remediation requested',
      fixNote:'The demo assumes TPM readiness, a supported Windows edition, correct policy targeting, and recovery-key escrow were verified. No encryption or key operation runs.',
      success:'BitLocker enabled · verified at check-in',subtitle:'A valid user signs in. The laptop does not meet the device requirement.'},
    {id:'risk',name:'A high-risk endpoint',icon:'fa-shield-virus',device:'ENG-WS-083',platform:'Windows 11 Enterprise',user:'Marcus Hill',initials:'MH',unit:'Engineering',kind:'device',app:'Engineering workspace',action:'Open Engineering workspace',
      issue:'Defender device risk is High',signal:'Defender for Endpoint → Intune',rule:'Windows · Device risk must be Low or below',requirement:'Connected Defender risk signal must be Low or below',fix:'Simulate analyst remediation',fixTitle:'Security investigation and remediation requested',
      fixNote:'A security analyst must investigate and remediate in Defender for Endpoint. Intune consumes the updated risk signal; a Sync action does not remove malware or lower device risk.',
      success:'Defender risk Low · verified at check-in',subtitle:'An identity can be trusted while the device it is using still carries risk.'},
    {id:'mobile',name:'Work data in a personal app',icon:'fa-mobile-screen-button',device:'Maya’s personal iPhone',platform:'iOS · supported managed app',user:'Maya Chen',initials:'MC',unit:'Customer success',kind:'app',app:'Outlook · Work account',action:'Copy to Personal Notes',
      issue:'Work content cannot be pasted into a personal app',signal:'Intune App Protection',rule:'Mobile · Transfer work data to policy-managed apps only',requirement:'Work content may move only to a supported policy-managed destination',fix:'Choose a protected destination',fixTitle:'OneNote work context selected',
      fixNote:'A fictional Intune App Protection policy is already assigned and applied to this user and the supported apps. The approved alternative is OneNote with the work account. No device enrollment, personal-data inspection, or policy bypass is implied.',
      success:'OneNote · Work account is policy-managed',subtitle:'The user can read work email. App protection stops work content crossing into a personal app.'}
  ];
  const clone=value=>JSON.parse(JSON.stringify(value));
  function get(id){const scenario=scenarios.find(s=>s.id===id);if(!scenario)throw new Error('Unknown device story.');return scenario;}
  function create(){
    let id='encryption',online=true,fixed=false,verified=false,attempts=[],events=[],seq=0;
    function event(action,source){events.unshift({id:++seq,time:new Date().toISOString(),action,source});events=events.slice(0,40);}
    function snapshot(){const scenario=get(id);return clone({id,online,fixed,verified,attempts,events,
      status:scenario.kind==='app'?'App policy active':verified?'Compliant':'Noncompliant',
      last:attempts.at(-1)||null});}
    function select(next){get(next);id=next;online=true;fixed=false;verified=false;attempts=[];events=[];seq=0;}
    return {
      snapshot,select,
      setOnline(value){if(typeof value!=='boolean')throw new Error('Invalid connectivity state.');online=value;event(value?'Device reconnected':'Device taken offline','Story controls');},
      attempt(){
        const scenario=get(id),offline=scenario.kind==='device'&&!online,allowed=scenario.kind==='app'?fixed:verified&&!offline;
        const result={id:attempts.length?attempts.at(-1).id+1:1,time:new Date().toISOString(),allowed,
          title:allowed?(scenario.kind==='app'?'Work content stays in a protected app':'Your work app is ready'):(scenario.kind==='app'?'Your organization’s data can’t be pasted here':'Your device needs attention'),
          reason:allowed?(scenario.kind==='app'?'The simulated copy is allowed into OneNote with the work account. Personal Notes remains restricted.':'Intune reports Compliant. A fresh request satisfies the modeled Entra Conditional Access device requirement.'):(scenario.kind==='app'?'The applied Intune app protection policy blocks transfer from work Outlook to this personal destination.':scenario.issue+'. Entra Conditional Access blocks this new access attempt.'),
          enforcer:scenario.kind==='app'?'Intune App Protection':'Microsoft Entra Conditional Access',
          target:scenario.kind==='app'?(fixed?'OneNote · Work account':'Personal Notes'):scenario.app};
        if(offline){result.title='Your device is offline';result.reason='A fresh work-app request cannot complete while this device is offline. No new Conditional Access evaluation or compliance evidence is claimed.';result.enforcer='Device connectivity';}
        attempts.push(result);attempts=attempts.slice(-8);event((allowed?'Allowed: ':'Blocked: ')+result.target,result.enforcer);return clone(result);
      },
      remediate(){
        const scenario=get(id);
        if(fixed)throw new Error('The simulated fix has already been requested.');
        if(!attempts.some(a=>!a.allowed))throw new Error('Try the work action first to see the protection decision.');
        fixed=true;event(scenario.fixTitle,scenario.kind==='app'?'User chooses approved app':scenario.id==='risk'?'Defender analyst · simulated':'Endpoint administrator · simulated');
      },
      checkIn(){
        const scenario=get(id);if(scenario.kind==='app')throw new Error('This app-protection story does not use a device-compliance check-in.');
        if(!online){event('Check-in unavailable · device offline','Intune');return {success:false,compliant:verified,message:'Device offline. No new compliance evidence received.'};}
        verified=fixed;event(verified?'Check-in verified compliant state':'Check-in still reports noncompliance',scenario.signal);return {success:true,compliant:verified,message:verified?'Updated compliance verified. Retry the work app.':'Device checked in, but the requirement is still not satisfied.'};
      },
      reset(){select(id);},
      evidence:()=>clone({disclaimer:'SIMULATED INTUNE SCENARIO - NOT LIVE DEVICE ACTIONS OR SERVICE AUDIT',scenario:id,events,attempts})
    };
  }
  return {scenarios,get,create};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=IntuneDeviceDemo;