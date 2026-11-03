'use strict';

const EntraReelObserver=(()=>{
  const reel=typeof module!=='undefined'&&module.exports?require('./entra-reel.js'):EntraReel;
  const scripts={
    'risky-user':{
      label:'Risky identity',source:'Unknown sign-in',sourceIcon:'fa-globe',targetIcon:'fa-window-maximize',
      titles:['Business as usual','An unfamiliar sign-in arrives','High risk detected','Entra blocks the new attempt','What should the analyst do?'],
      captions:['Sarah already has a Microsoft 365 session.','A second device tries to use Sarah’s identity.','Identity Protection connects the warning signals.','The earlier session still needs investigation.','Blocking one attempt is not complete remediation.'],
      choices:{contain:'Contain & verify',observe:'Block this attempt only'},
      branches:{contain:[['Containment requested','Verify Sarah and complete secure remediation.'],['Identity remediated','Fresh authentication is required. Earlier access was reviewed.']],observe:[['No further containment','The earlier session and high user risk remain unresolved.'],['The case stays open','The attempt was blocked. The identity was not remediated.']]},
      checkpoint:'Verify remediation'
    },
    'privileged-access':{
      label:'Privileged access',source:'Activation request',sourceIcon:'fa-ticket',targetIcon:'fa-user-lock',
      titles:['Eligible, not privileged','Temporary access requested','Activation requirements checked','Waiting for an approver','Approve this access window?'],
      captions:['Priya has no active administrative role in this story.','The request includes a ticket and a 60-minute duration.','Eligibility, justification and strong authentication are assumed valid.','Alex reviews the request. Priya cannot self-approve.','The audience decides. No role is active yet.'],
      choices:{approve:'Approve 60 minutes',deny:'Deny activation'},
      branches:{approve:[['The role is active','Temporary privilege. No permanent role was added.'],['Time is up. Privilege expires.','The active role ends; eligibility remains.']],deny:[['No role is activated','The request is denied. Eligibility remains.'],['Least privilege preserved','No unnecessary active privilege was introduced.']]},
      checkpoint:'Jump ahead 60 min'
    },
    'device-access':{
      label:'Device protection',source:'Device health',sourceIcon:'fa-laptop',targetIcon:'fa-building-columns',
      titles:['A protected Finance application','Encryption drifts out of compliance','Intune reports noncompliance','MFA passes. Access still fails.','How should access be restored?'],
      captions:['Daniel has MFA. His device must also be compliant.','A device check-in reports a failed encryption requirement.','Entra receives the device state for a new access request.','Conditional Access enforces the compliant-device requirement.','Repair the device, or keep the access block in place.'],
      choices:{repair:'Remediate & verify',hold:'Keep access blocked'},
      branches:{repair:[['Remediation is pending','A fix alone is not proof of compliance.'],['Fresh access is allowed','A verified check-in confirms compliance; MFA is already satisfied.']],hold:[['Device still noncompliant','No exception or policy bypass is applied.'],['Finance access stays blocked','MFA does not replace a compliant device.']]},
      checkpoint:'Verify device check-in'
    },
    'guest-review':{
      label:'Guest governance',source:'Project complete',sourceIcon:'fa-flag-checkered',targetIcon:'fa-users',
      titles:['Partner collaboration is active','The project ends. Access remains.','An access review surfaces the guest','The reviewer checks business need','Does the partner still need access?'],
      captions:['Avery belongs to the Project Atlas collaboration group.','The sponsor confirms that project work has finished.','The configured review includes this guest membership.','Maya sees the completed project and existing membership.','The decision affects this project group—not every resource.'],
      choices:{remove:'Remove project access',retain:'Retain with justification'},
      branches:{remove:[['Removal is ready to apply','A denial is recorded; membership has not changed yet.'],['Project membership removed','The guest account remains. Other access was not evaluated.']],retain:[['An exception is recorded','Membership stays for approved handover work.'],['Access retained, with evidence','The business exception needs follow-up review.']]},
      checkpoint:'Apply review decision'
    }
  };
  function frame(state){
    const episode=reel.getEpisode(state.episode),script=scripts[state.episode],scene=reel.getScene(state);
    const short=state.step<5?[script.titles[state.step],script.captions[state.step]]:script.branches[state.choice][state.step-5];
    let access='pending';
    if(state.episode==='risky-user'&&state.step>=3)access='blocked';
    if(state.episode==='device-access'&&state.step>=3)access=state.step===6&&state.choice==='repair'?'allowed':'blocked';
    if(state.episode==='privileged-access')access=state.step===5&&state.choice==='approve'?'allowed':state.step>=5?'blocked':'pending';
    if(state.episode==='guest-review')access=state.step===6&&state.choice==='remove'?'blocked':'allowed';
    const source=state.step===0?(state.episode==='risky-user'?'Sign-in monitor':state.episode==='guest-review'?'Project context':script.source):script.source;
    return {title:short[0],caption:short[1],label:script.label,source,sourceIcon:script.sourceIcon,targetIcon:script.targetIcon,
      nodes:reel.getNodes(state),tone:scene.tone,access,system:scene.system,
      choices:episode.choices.map(choice=>({id:choice.id,label:script.choices[choice.id],recommended:choice.recommended})),
      nextLabel:state.step===5?(['contain','approve','repair','remove'].includes(state.choice)?script.checkpoint:'Show outcome'):state.step===6?'Compare responses':'Next scene'};
  }
  return {frame};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=EntraReelObserver;