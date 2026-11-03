'use strict';

// A safe, local narrative model. It does not inspect, download, or execute files.
const DefenderAttackReel=(()=>{
  const scenes={
    environment:{phase:'THE WORKDAY',title:'A normal morning.',caption:'Sarah is catching up on email at her desk when an unexpected invoice arrives.',system:'Contoso · fictional environment',tone:'calm',event:'Employee and endpoint shown in the story',why:'Establish the person, device, and monitoring context before an alert appears.',facts:[['Employee','Sarah Chen · fictional Finance user'],['Device','FIN-LT-042 · fictional Windows endpoint'],['Live connection','None · local story only']]},
    message:{phase:'THE SIGNAL',title:'An invoice she didn’t expect.',caption:'The sender is new, the deadline is Friday, and the document is one click away.',system:'Email · simulated message context',tone:'warning',event:'Unexpected document message received',why:'A suspicious message is a reason to inspect—not proof that a file is malicious.',facts:[['Sender','billing@northwind-docs.example'],['Message','Invoice revision · fictional subject'],['Message body / URL','Not embedded or active']]},
    warning:{phase:'BROWSER CHECK',title:'Sarah clicks. Her browser hesitates.',caption:'A warning appears before the download goes any further. What does she do?',system:'Browser reputation · illustrative',tone:'warning',event:'Fictional browser warning displayed',why:'Browser reputation, email protection, and endpoint protection are distinct controls. Their coverage depends on product, configuration, and policy.',facts:[['Control','Browser reputation warning · modeled'],['File','No real file is downloaded'],['Availability','Depends on supported browser and configuration']],choices:[{id:'cancel',label:'Stop and report the message',icon:'fa-shield-halved',recommended:true},{id:'continue',label:'Continue with the fictional sample',icon:'fa-arrow-right'}]},
    prevented:{phase:'PREVENTED',title:'She deletes it. Nothing ever runs.',caption:'The file is gone before it opens, and Sarah reports the message to security.',system:'Employee decision · simulated outcome',tone:'success',event:'Download cancelled before opening',why:'This is the prevention path. The reel does not claim that every warning is shown or every download is blocked.',facts:[['Download','Cancelled in the story'],['Endpoint execution','None'],['Defender incident','None created in this branch']],terminal:true,nextLabel:'Replay the other path'},
    endpoint:{phase:'ENDPOINT SIGNAL',title:'She keeps it — and opens it.',caption:'Moments later, Windows flags unusual behavior and Defender for Endpoint records the signal.',system:'Defender for Endpoint · simulated telemetry',tone:'danger',event:'Endpoint behavior signal recorded',why:'This branch assumes initial controls did not prevent the modeled activity and that supported endpoint telemetry is available. The file is never downloaded or executed by this demo.',facts:[['Device','FIN-LT-042 · fictional endpoint'],['Detection','Suspicious behavior signal · high level'],['Process details','No commands, payloads, or executable content shown']]},
    incident:{phase:'CORRELATION',title:'Meanwhile, in the security operations center…',caption:'Defender XDR turns the signal into an incident for Alex Morgan to review.',system:'Microsoft Defender XDR · modeled incident',tone:'danger',event:'SIM-DEF-001 created with one endpoint alert',why:'Incident correlation organizes signals for investigation. It does not prove impact, identify an actor, or guarantee that every alert will correlate.',facts:[['Incident','SIM-DEF-001 · fictional'],['Source','One Defender for Endpoint signal'],['Severity','High · illustrative only']]},
    decision:{phase:'ANALYST DECISION',title:'Alex has to make the call.',caption:'The evidence points to FIN-LT-042. Isolating it limits the damage while the investigation continues.',system:'Security operations · audience choice',tone:'warning',event:'Analyst response decision required',why:'Containment decisions depend on evidence, device role, business impact, permission, and the organization’s approval process.',facts:[['Device','FIN-LT-042 · Finance workstation'],['Current state','Investigation open · not isolated'],['Action authority','Simulation only']],choices:[{id:'isolate',label:'Recommend isolation',icon:'fa-link-slash',recommended:true},{id:'investigate',label:'Continue investigation',icon:'fa-magnifying-glass'}]},
    isolation:{phase:'RESPONSE',title:'Alex isolates the laptop.',caption:'It is cut off from the network, but recovery and scope checks are still ahead.',system:'Defender for Endpoint · response modeled',tone:'warning',event:'Analyst-approved isolation modeled',why:'Device isolation availability and impact depend on supported platforms, connectivity, licensing, permissions, and approval. The dashboard does not contact a device.',facts:[['Approval','Recorded in the fictional story'],['Device state','Isolated · simulated only'],['Recovery','Not complete; investigation remains open']]},
    verified:{phase:'FOLLOW-UP',title:'Contained, but not cleaned up.',caption:'Evidence is preserved and the case stays open until recovery is verified.',system:'Security operations · modeled follow-up',tone:'success',event:'Evidence retained; recovery verification pending',why:'Isolation is not malware removal, reimaging, or proof of recovery. Confirm scope and device health before restoring service.',facts:[['Isolation','Simulated state retained'],['Malware removal','Not performed or claimed'],['Incident','Open pending recovery verification']],terminal:true,nextLabel:'Replay the other response'},
    investigation:{phase:'INVESTIGATION',title:'Alex keeps digging.',caption:'The laptop stays connected while the evidence is reviewed, and the risk is still open.',system:'Security operations · investigation open',tone:'warning',event:'Evidence review selected; device not isolated',why:'Investigation without containment may preserve availability but leaves the modeled exposure unresolved. This is a deliberate comparison, not a recommendation for every incident.',facts:[['Isolation','Not applied'],['Device exposure','Unresolved in story'],['Incident','Open · analyst follow-up required']],terminal:true,nextLabel:'Compare response choices'}
  };
  const person='Sarah Chen',device='FIN-LT-042';
  function fresh(){return {step:0,downloadChoice:null,responseChoice:null};}
  function path(state){
    const result=['environment','message','warning'];
    if(state.downloadChoice===null)return result;
    if(state.downloadChoice==='cancel')return [...result,'prevented'];
    result.push('endpoint','incident','decision');
    if(state.responseChoice==='isolate')result.push('isolation','verified');
    else if(state.responseChoice==='investigate')result.push('investigation');
    return result;
  }
  function validate(state){if(!state||!Number.isInteger(state.step)||state.step<0||state.step>=path(state).length)throw new Error('Invalid attack reel state');}
  function createPlayer(){let state=fresh();const snapshot=()=>({...state});return {
    snapshot,
    scene(){validate(state);const id=path(state)[state.step];return {id,...scenes[id],nodes:getNodes(id,state)};},
    scenes(){return path(state).map(id=>({id,...scenes[id]}));},
    choose(id){validate(state);const current=path(state)[state.step];if(current==='warning'&&['cancel','continue'].includes(id)){state.downloadChoice=id;state.responseChoice=null;state.step++;return snapshot();}if(current==='decision'&&['isolate','investigate'].includes(id)){state.responseChoice=id;state.step++;return snapshot();}throw new Error('That choice is not available in this scene');},
    next(){validate(state);const current=path(state)[state.step];if(scenes[current].choices)throw new Error('Choose a response before advancing');if(state.step<path(state).length-1)state.step++;return snapshot();},
    back(){validate(state);if(state.step===0)return snapshot();state.step--;const current=path(state)[state.step];if(current==='warning'){state.downloadChoice=null;state.responseChoice=null;}if(current==='decision')state.responseChoice=null;return snapshot();},
    replay(){state=fresh();return snapshot();}
  };}
  function getScene(state){validate(state);const id=path(state)[state.step];return {id,index:state.step,total:path(state).length,...scenes[id],nodes:getNodes(id,state)};}
  function getNodes(id,state){
    const defaults=['WORKING','MESSAGE RECEIVED','MONITORING','STANDBY','AVAILABLE'];
    if(id==='prevented')return ['PROTECTED','CANCELLED','NO ALERT','NO INCIDENT','SAFE PATH'];
    if(id==='endpoint')return ['REVIEWING','SAMPLE OPENED','SIGNAL RECORDED','COLLECTING','ANALYST NOTIFIED'];
    if(id==='incident'||id==='decision')return ['WAITING','SIGNAL LINKED','ALERT CORRELATED','INCIDENT OPEN','REVIEW REQUIRED'];
    if(id==='isolation')return ['NOTIFIED','SIGNAL LINKED','RESPONSE APPROVED','ISOLATION MODELED','ANALYST ACTION'];
    if(id==='verified')return ['FOLLOW-UP','EVIDENCE HELD','INCIDENT OPEN','CONTAINED · SIMULATED','RECOVERY PENDING'];
    if(id==='investigation')return ['FOLLOW-UP','SIGNAL LINKED','INVESTIGATION OPEN','NOT ISOLATED','EXPOSURE UNRESOLVED'];
    if(id==='warning')return ['REVIEWING','WARNING SHOWN','MONITORING','NO FILE ACCESS','CHOOSE PATH'];
    if(id==='message')return ['AT WORK','UNEXPECTED MESSAGE','MONITORING','NO FILE ACCESS','AWARENESS'];
    if(id==='environment')return defaults;
    return defaults;
  }
  function timeline(state){validate(state);return path(state).slice(0,state.step+1).map((id,index)=>({step:index,time:`09:${String(12+index*3).padStart(2,'0')}:00 UTC`,event:scenes[id].event,system:scenes[id].system}));}
  return {createPlayer,getScene,getNodes,timeline,scenes:Object.keys(scenes)};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=DefenderAttackReel;
