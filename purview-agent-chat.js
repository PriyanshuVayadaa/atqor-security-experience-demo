'use strict';

const PurviewAgentChat=(()=>{
  const protection=typeof module!=='undefined'&&module.exports?require('./purview-agent-demo.js'):PurviewAgentDemo;
  const copy=value=>JSON.parse(JSON.stringify(value));
  function create(){
    const session=protection.createSession();let turns=[],sequence=0,attached=true,totalCalls=0;
    return {
      snapshot:()=>({...session.snapshot(),turns:copy(turns),attached,totalCalls}),
      load(id){session.reset();session.load(id);turns=[];sequence=0;attached=true;totalCalls=0;},
      update(key,value){session.update(key,value);},
      attach(text){session.attach(text);attached=true;},
      removeAttachment(){session.update('text','');session.update('label','General');attached=false;},
      submit(){
        const draft=session.snapshot();const scan=session.scan();const decision=session.apply();
        let delivery=null;if(decision!=='block'){delivery=session.deliver();totalCalls++;}
        const turn={id:++sequence,revision:draft.revision,time:new Date().toISOString(),
          prompt:protection.redact(draft.input.prompt),attachment:attached?{name:draft.input.name,preview:protection.redact(draft.input.text).slice(0,320),label:draft.input.label}:null,
          scan,decision,delivery};
        turns.push(turn);turns=turns.slice(-8);return copy(turn);
      },
      prepareRedacted(id){
        const latest=turns.at(-1),state=session.snapshot();
        if(!latest||latest.id!==Number(id)||latest.decision!=='block'||latest.revision!==state.revision)throw new Error('The draft has changed. Send the current request to check it again.');
        session.redact();
      },
      evidence:()=>session.evidence(),
      reset(){session.reset();turns=[];sequence=0;attached=true;totalCalls=0;}
    };
  }
  return {create};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PurviewAgentChat;