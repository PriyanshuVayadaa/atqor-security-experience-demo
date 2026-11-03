'use strict';

const PurviewAgentStory=(()=>{
  const model=typeof module!=='undefined'&&module.exports?require('./purview-agent-demo.js'):PurviewAgentDemo;
  const chapters=['The task','The attachment','The discovery','The decision','The outcome'];
  function create(){
    const session=model.createSession();let beat='intro',revised=false,held=false;
    const snapshot=()=>({...session.snapshot(),beat,revised,held});
    function restart(id){session.reset();if(id&&id!=='pii')session.load(id);beat='intro';revised=false;held=false;}
    return {
      snapshot,
      next(){
        if(beat==='intro'){beat='attached';return;}
        if(beat==='attached'||beat==='revised'){session.scan();beat='inspected';return;}
        if(beat==='inspected'){session.apply();beat='decision';return;}
        if(beat==='decision'&&session.snapshot().decision!=='block'){session.deliver();beat='outcome';return;}
        throw new Error('Choose a response before continuing.');
      },
      respond(action){
        const state=session.snapshot();if(beat!=='decision'||state.decision!=='block')throw new Error('A blocked decision is required.');
        if(action==='redact'){session.redact();revised=true;beat='revised';}
        else if(action==='approved'){session.load('safe');revised=true;beat='revised';}
        else if(action==='hold'){held=true;beat='outcome';}
        else throw new Error('Unknown response.');
      },
      load:restart,
      update(key,value){session.update(key,value);beat='attached';held=false;revised=false;},
      attach(text){session.attach(text);beat='attached';held=false;revised=false;},
      reset(){restart();},
      replay(){const id=session.snapshot().input.sample;restart(id==='local'?'pii':id);},
      evidence:()=>session.evidence()
    };
  }
  function frame(state){
    const {beat,scan,decision,delivery}=state;
    const topic=state.input.sample;
    let title='',caption='',eyebrow='',button='',chapter=0,tone='neutral';
    if(beat==='intro'){
      title='One quick summary.\nOne unexpected risk.';caption='Meet Maya. She wants her business agent to help with a customer request.';eyebrow='A DAY AT CONTOSO';button='Follow Maya’s request';
      if(topic==='payment'){title='A simple renewal.\nA payment detail too many.';caption='Maya wants the agent to prepare an account update.';}
      if(topic==='confidential'){title='A useful document.\nNot for every conversation.';caption='Maya has a strategy memo. Its sensitivity label matters.';}
      if(topic==='prompt'){title='The prompt is small.\nThe privacy risk isn’t.';caption='Maya pastes an identifier into her request. There is no risky file to blame.';}
      if(topic==='safe'){title='Let good work flow.\nKeep the guardrail.';caption='Maya asks the agent for a routine project summary.';}
    }
    if(beat==='attached'){chapter=1;eyebrow='THE REQUEST';title='She attaches the context.\nNot just the task.';caption='The request is held at the application’s protection layer. The agent has not received it.';button='See what the check finds';if(topic==='prompt')title='She pastes the context.\nNot just the task.';}
    if(beat==='inspected'){
      chapter=2;eyebrow='THE DISCOVERY';button='See the policy decision';
      if(scan.status==='unavailable'){title='No inspection.\nNo blind trust.';caption='The inspection service is unavailable. The configured gateway will fail closed.';tone='warning';}
      else if(scan.count||scan.labelBlocked){title=scan.labelBlocked?'The label tells\na different story.':'There’s more here\nthan the agent needs.';caption=scan.labelBlocked?'A restricted sensitivity label matches the demo policy—even without personal identifiers.':`${scan.count} identifier match(es) found across the prompt and attachment. The matched values stay hidden.`;tone='warning';}
      else{title='The check finds no\nconfigured rule match.';caption='This limited demo found no matching identifier or restricted label. It cannot prove the content is non-sensitive.';tone='safe';}
    }
    if(beat==='decision'){
      chapter=3;eyebrow='THE GUARDRAIL';
      if(decision==='block'){title='The request stops.\nThe data stays back.';caption=scan.status==='unavailable'?'Inspection failed. Restore it and recheck, or leave this request blocked.':'The agent receives nothing. Maya gets a policy tip. What should happen next?';tone='blocked';}
      else if(decision==='audit-allow'){title='Seen is not\nthe same as stopped.';caption='Audit-only records the match, but permits delivery. This is a deliberate comparison of monitoring versus enforcement.';button='Show the audit-only consequence';tone='warning';}
      else{title='The request can\ncontinue its journey.';caption='The configured input checks passed. The agent still has not been invoked.';button='Let the agent help';tone='safe';}
    }
    if(beat==='revised'){chapter=1;eyebrow='A BETTER REQUEST';title='Less personal data.\nThe same business goal.';caption='Detected identifiers were removed, or a different approved sample was selected. The new request must pass inspection again.';button='Check the revised request';tone='safe';}
    if(beat==='outcome'){
      chapter=4;eyebrow='THE OUTCOME';button='Replay this story';
      if(state.held){title='Work can wait.\nSensitive data stays back.';caption='This request remains blocked. No model invocation occurred.';tone='blocked';}
      else if(delivery.sensitiveMatchPresent){title='The agent received\nthe matched content.';caption='Audit-only allowed it. Visibility without enforcement did not prevent the exposure in this simulation.';tone='warning';}
      else{title='The work moves on.\nThe guardrail stays.';caption='The rechecked request reached the scripted agent. No real model was called.';tone='safe';}
    }
    return {title,caption,eyebrow,button,chapter,tone,showFindings:['inspected','decision','outcome'].includes(beat)&&scan,blocked:decision==='block',received:beat==='outcome'&&!!delivery,canPlay:['intro','attached','revised','inspected'].includes(beat)};
  }
  return {create,frame,chapters};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PurviewAgentStory;