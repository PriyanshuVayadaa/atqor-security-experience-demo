'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../defender-data.js');

test('15 Defender modules contain 104 aligned inspectable records',()=>{
  assert.equal(Object.keys(data.modules).length,15);
  const ids=new Set();
  for(const [key,mod]of Object.entries(data.modules)){
    assert.ok(mod.title&&mod.icon&&mod.subtitle);assert.ok(mod.rows.length>=6,key);
    for(const r of mod.rows){
      assert.equal(r.module,key);assert.ok(!ids.has(r.id),r.id);ids.add(r.id);
      assert.equal(r.values.length,mod.columns.length,key+'/'+r.id);assert.ok(r.values.every(v=>typeof v==='string'));
      assert.ok(['all','Finance','Engineering','Operations'].includes(r.unit));assert.equal(typeof r.review,'boolean');
      assert.ok(Number.isInteger(r.age)&&r.age>=1);assert.ok(Object.keys(r.details).length>=6);
      assert.match(r.details['Data source'],/Fictional.*no live connection/);
    }
  }
  assert.equal(ids.size,104);
});
test('every Defender related solution and record cross-link resolves',()=>{
  for(const mod of Object.values(data.modules)){
    for(const key of mod.links)assert.ok(data.modules[key],key);
    for(const r of mod.rows)for(const link of r.links)assert.ok(data.modules[link.module]?.rows.some(x=>x.id===link.id),r.id+' -> '+link.id);
  }
});
test('core cases expose their linked endpoint, identity, mail, cloud app and response evidence',()=>{
  const incident=data.get('defender-incidents').rows.find(r=>r.id==='INC-2481');
  for(const key of ['devices','email','identities','cloud-apps','investigations','response-actions'])assert.ok(incident.links.some(l=>l.module===key),key);
  const endpoint=data.get('defender-incidents').rows.find(r=>r.id==='INC-2480');
  assert.ok(endpoint.links.some(l=>l.id==='EDR-101'));assert.ok(endpoint.links.some(l=>l.id==='INV-902'));
});
test('business-unit filters contain only shared and selected records across every module',()=>{
  for(const key of Object.keys(data.modules))for(const unit of ['Finance','Engineering','Operations']){
    const rows=data.filter(key,{unit,days:30});assert.ok(rows.length,key+'/'+unit);assert.ok(rows.every(r=>r.unit===unit||r.unit==='all'));
  }
});
test('activity age filters differ from snapshot inventories and configurations',()=>{
  for(const [key,mod]of Object.entries(data.modules)){
    const day=data.filter(key,{days:1}),month=data.filter(key,{days:30});
    if(mod.activity){assert.ok(day.every(r=>r.age===1));assert.ok(month.length>day.length,key);}
    else assert.deepEqual(day,month,key);
  }
});
test('search, state and unit combine without altering Defender fixtures',()=>{
  const original=JSON.stringify(data.modules);
  assert.equal(data.filter('endpoints',{query:'  EDR-101  ',state:'In progress',unit:'Finance'}).length,1);
  assert.equal(data.filter('endpoints',{query:'EDR-101',state:'Resolved'}).length,0);
  assert.equal(data.filter('endpoints',{query:'EDR-101',unit:'Engineering'}).length,0);
  assert.equal(data.filter('devices',{query:'does-not-exist'}).length,0);
  assert.equal(original,JSON.stringify(data.modules));assert.throws(()=>data.get('missing'));
});
test('timestamps and evidence timelines stay within the fixed snapshot',()=>{
  assert.equal(data.snapshot,'2026-11-02T09:42:00Z');
  for(const mod of Object.values(data.modules))for(const r of mod.rows){
    assert.ok(Date.parse(r.time)<=Date.parse(data.snapshot));assert.equal(r.timeline.length,2);
    assert.ok(Date.parse(r.timeline[0].time)<=Date.parse(r.timeline[1].time));
    for(const event of r.timeline)assert.ok(Date.parse(event.time)<=Date.parse(data.snapshot));
  }
});
test('exposure does not invent CVEs and response records explicitly avoid dashboard execution',()=>{
  for(const r of data.get('vulnerabilities').rows)assert.equal(r.details['CVE reference'],'No specific CVE asserted in this fixture');
  for(const r of data.get('response-actions').rows)assert.match(r.details.Execution,/Not executed|not executed|no real|not performed|No consent|no remote/);
  assert.equal(data.get('configuration').rows.find(r=>r.id==='CFG-1107').state,'Not connected');
  assert.match(data.get('defender-reports').rows.find(r=>r.id==='RPT-1201').details.Definition,/Independent aggregate/);
});