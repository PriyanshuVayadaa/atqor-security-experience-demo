'use strict';

// Local, deliberately limited detector examples. Not the Microsoft Purview classifier.
const PurviewAgentDemo=(()=>{
  const LIMIT=32768;
  const samples=[
    {id:'pii',title:'Customer PII upload',icon:'fa-address-card',name:'customer-onboarding-demo.txt',label:'General',prompt:'Summarize this onboarding request without including personal identifiers.',text:'FICTIONAL DEMO RECORD\nCustomer: Demo Customer\nEmail: demo.customer@example.com\nSSN: 123-45-6789\nPhone: +1 (202) 555-0148\nRequest: Please arrange a product demonstration next week.'},
    {id:'payment',title:'Payment details',icon:'fa-credit-card',name:'payment-demo.txt',label:'General',prompt:'Prepare an account update from this record.',text:'SYNTHETIC PAYMENT TEST DATA\nPayment card: 4111 1111 1111 1111\nAccount: Demo Account\nRequest: Please confirm the product subscription renewal.'},
    {id:'confidential',title:'Restricted document',icon:'fa-file-shield',name:'strategy-demo.txt',label:'Highly Confidential',prompt:'Summarize this strategy for the agent workspace.',text:'FICTIONAL STRATEGY MEMO\nProject Atlas plans to launch a new internal capability.\nNo personal identifiers are included; the simulated sensitivity label restricts this content.'},
    {id:'prompt',title:'PII in a prompt',icon:'fa-comment-dots',name:'project-notes-demo.txt',label:'General',prompt:'Use SSN 123-45-6789 and email demo.customer@example.com to find this customer.',text:'SYNTHETIC PROJECT NOTES\nPlease schedule a product demo. No personal identifiers are required.'},
    {id:'safe',title:'Business-safe content',icon:'fa-file-circle-check',name:'project-summary-demo.txt',label:'General',prompt:'Summarize this project update.',text:'SYNTHETIC PROJECT SUMMARY\nProject Atlas is on schedule.\nThe next milestone is a product demonstration.\nThe team needs a timeline review and a list of open actions.'}
  ];
  const rules=[
    {id:'email',name:'Email address',regex:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi},
    {id:'ssn',name:'US SSN-shaped identifier',regex:/\b\d{3}-\d{2}-\d{4}\b/g},
    {id:'phone',name:'US phone-shaped number',regex:/(?:\+1[\s.-]?)?(?:\(\d{3}\)|\b\d{3})[\s.-]?\d{3}[\s.-]\d{4}\b/g},
    {id:'card',name:'Payment card candidate',regex:/\b(?:\d[ -]?){12,18}\d\b/g,validate:value=>{
      const digits=value.replace(/\D/g,'');if(digits.length<13||digits.length>19||/^(\d)\1+$/.test(digits))return false;
      let sum=0;for(let i=digits.length-1,alternate=false;i>=0;i--,alternate=!alternate){let n=Number(digits[i]);if(alternate){n*=2;if(n>9)n-=9;}sum+=n;}return sum%10===0;
    }}
  ];
  const clone=value=>JSON.parse(JSON.stringify(value));
  function validateInput(input){
    if(typeof input.text!=='string'||typeof input.prompt!=='string'||!input.text.trim()&&!input.prompt.trim())throw new Error('Add synthetic text or a prompt first.');
    if(input.text.length+input.prompt.length>LIMIT)throw new Error('Keep the combined prompt and text within 32,768 characters.');
    if(!['General','Confidential','Highly Confidential'].includes(input.label))throw new Error('Invalid simulated sensitivity label.');
    if(!['enforce','audit'].includes(input.mode))throw new Error('Invalid policy mode.');
    if(!['available','unavailable'].includes(input.service))throw new Error('Invalid classifier status.');
  }
  function detect(text){
    const matches=[];
    for(const rule of rules){const regex=new RegExp(rule.regex.source,rule.regex.flags);for(const match of text.matchAll(regex)){if(rule.validate&&!rule.validate(match[0]))continue;matches.push({type:rule.id,start:match.index,end:match.index+match[0].length});}}
    return matches;
  }
  function inspect(input){
    validateInput(input);
    if(input.service==='unavailable')return {status:'unavailable',findings:[],count:0,labelBlocked:false,policyMatches:['Classification unavailable'],decision:'block',reason:'The configured custom gateway fails closed when inspection is unavailable.'};
    const findings=[];let count=0;
    for(const [source,text]of [['attachment',input.text],['prompt',input.prompt]]){
      const matches=detect(text);
      for(const rule of rules){const total=matches.filter(m=>m.type===rule.id).length;if(total){findings.push({type:rule.id,name:rule.name,source,count:total});count+=total;}}
    }
    const labelBlocked=input.label!=='General';
    const matched=count>0||labelBlocked;
    return {status:'complete',findings,count,labelBlocked,policyMatches:[...(count?['DLP-AI-001 · Block detected identifiers']:[]),...(labelBlocked?['DLP-AI-002 · Restrict labeled content']:[])],
      decision:matched?(input.mode==='enforce'?'block':'audit-allow'):'allow',
      reason:matched?(input.mode==='enforce'?'Matched the demo agent data-loss policy. Stop before model invocation.':'Audit-only records the match but does not stop delivery. Sensitive content would reach the agent in this simulation.'):'No configured detector or label rule matched. This is not a guarantee that the content is non-sensitive.'};
  }
  function redact(text){
    const matches=detect(text).sort((a,b)=>a.start-b.start||b.end-a.end),ranges=[];
    for(const match of matches){const last=ranges.at(-1);if(last&&match.start<=last.end)last.end=Math.max(last.end,match.end);else ranges.push({start:match.start,end:match.end});}
    let result='',offset=0;for(const range of ranges){result+=text.slice(offset,range.start)+'[REMOVED]';offset=range.end;}return result+text.slice(offset);
  }
  function createSession(){
    let input,stage=0,scan=null,decision=null,delivery=null,events=[],history=[],revision=0,sequence=0;
    function clearEvaluation(){stage=0;scan=null;decision=null;delivery=null;revision++;}
    function event(action,details={}){events.unshift({id:++sequence,time:new Date().toISOString(),action,...details});events=events.slice(0,40);}
    function load(id){const sample=samples.find(s=>s.id===id);if(!sample)throw new Error('Unknown document sample.');input={sample:id,name:sample.name,text:sample.text,prompt:sample.prompt,label:sample.label,mode:'enforce',service:'available'};clearEvaluation();}
    load('pii');
    return {
      snapshot:()=>clone({input,stage,scan,decision,delivery,events,history,revision}),
      load(id){load(id);event('Synthetic sample loaded');},
      update(key,value){
        if(!['text','prompt','label','mode','service'].includes(key))throw new Error('Unsupported input.');
        const next={...input,[key]:value};
        // Empty draft text is allowed, but inspection rejects a fully empty request.
        validateInput({...next,prompt:next.prompt||(!next.text?'Draft':'')});
        input=next;clearEvaluation();
      },
      attach(text){
        if(typeof text!=='string'||text.includes('\u0000'))throw new Error('Use an unencrypted plain-text .txt test file.');
        const next={...input,name:'local-test-document.txt',sample:'local',text,label:'General'};validateInput(next);input=next;clearEvaluation();event('Local test text attached');
      },
      scan(){scan=inspect(input);stage=1;decision=null;delivery=null;event('Inspection completed',{status:scan.status,detectedTypes:scan.findings.map(f=>({type:f.type,source:f.source,count:f.count})),label:input.label});return clone(scan);},
      apply(){
        if(stage!==1||!scan)throw new Error('Inspect the current request before applying a decision.');
        decision=scan.decision;stage=2;
        const record={revision,mode:input.mode,decision,detectedTypes:scan.findings.map(f=>({type:f.type,source:f.source,count:f.count})),label:input.label};
        history.unshift(record);history=history.slice(0,8);event(decision==='block'?'Request blocked before agent':decision==='audit-allow'?'Audit match recorded; delivery permitted':'Request permitted',record);return decision;
      },
      deliver(){
        if(stage!==2||!['allow','audit-allow'].includes(decision))throw new Error('No approved request is available for agent delivery.');
        // No real model is invoked and no raw text is copied into response/history/events.
        delivery={received:true,payloadCharacters:input.text.length+input.prompt.length,sensitiveMatchPresent:scan.count>0||scan.labelBlocked,response:'Scripted agent: I can help review the supplied business context and prepare next steps. No real model has been called.'};
        stage=3;event('Simulated agent invocation',{payloadCharacters:delivery.payloadCharacters,sensitiveMatchPresent:delivery.sensitiveMatchPresent});return clone(delivery);
      },
      redact(){
        if(!scan||!scan.count)throw new Error('No detected identifiers are available to remove.');
        input={...input,text:redact(input.text),prompt:redact(input.prompt)};clearEvaluation();event('Matched identifiers removed; reinspection required');
      },
      reset(){events=[];history=[];sequence=0;revision=0;load('pii');},
      evidence:()=>clone({disclaimer:'LOCAL DEMO EVIDENCE - NOT MICROSOFT PURVIEW AUDIT OR DLP OUTPUT',events,history})
    };
  }
  return {LIMIT,samples,rules:rules.map(({id,name})=>({id,name})),inspect,redact,createSession};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PurviewAgentDemo;