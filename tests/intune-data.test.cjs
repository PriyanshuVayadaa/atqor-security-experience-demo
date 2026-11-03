'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../intune-data.js');

test('all 15 Intune modules have populated aligned records and complete metadata',()=>{
  assert.equal(Object.keys(data.modules).length,15);
  const ids=new Set();
  for(const [key,mod]of Object.entries(data.modules)){
    assert.ok(mod.title&&mod.icon&&mod.subtitle);assert.ok(mod.rows.length>=6,key);
    for(const r of mod.rows){
      assert.equal(r.module,key);assert.ok(!ids.has(r.id),r.id);ids.add(r.id);
      assert.equal(r.values.length,mod.columns.length,key+'/'+r.id);assert.ok(r.values.every(v=>typeof v==='string'));
      assert.ok(['all','Finance','Engineering','Operations'].includes(r.unit));assert.equal(typeof r.review,'boolean');
      assert.ok(Number.isInteger(r.age)&&r.age>=1);assert.ok(Object.keys(r.details).length>=6);assert.equal(r.timeline.length,2);
      assert.match(r.details['Data source'],/Fictional.*no live connection/);
    }
  }
  assert.equal(ids.size,120);
});
test('all module shortcuts and row links resolve to populated Intune evidence',()=>{
  for(const mod of Object.values(data.modules)){
    for(const key of mod.links)assert.ok(data.modules[key],key);
    for(const r of mod.rows)for(const l of r.links)assert.ok(data.modules[l.module]?.rows.some(x=>x.id===l.id),r.id+' -> '+l.module+'/'+l.id);
  }
});
test('device roster preserves the original named cross-workload examples',()=>{
  const names=data.get('devices').rows.map(r=>r.values[0]);
  for(const name of ['FIN-LT-042','ENG-WS-083','OPS-LT-118','ENG-MAC-012','MOB-IOS-206'])assert.ok(names.includes(name),name);
  assert.equal(data.get('devices').rows.find(r=>r.values[0]==='OPS-LT-118').values[1],'Windows 10 Enterprise');
  for(const user of data.get('users').rows){const device=data.get('devices').rows.find(r=>r.values[0]===user.values[2]);assert.equal(user.links[0].id,device.id);}
});
test('business-unit scopes return only shared and selected Intune records',()=>{
  for(const key of Object.keys(data.modules))for(const unit of ['Finance','Engineering','Operations']){
    const rows=data.filter(key,{unit,days:30});assert.ok(rows.length,key+'/'+unit);assert.ok(rows.every(r=>r.unit===unit||r.unit==='all'));
  }
});
test('activity reporting periods filter activity rows but not tenant reference snapshots',()=>{
  for(const [key,mod]of Object.entries(data.modules)){
    const day=data.filter(key,{days:1}),month=data.filter(key,{days:30});
    if(mod.activity){assert.ok(day.every(r=>r.age<=1));assert.ok(month.length>day.length,key);}
    else assert.deepEqual(day,month,key);
  }
});
test('search and state filters combine without mutating seeded records',()=>{
  const original=JSON.stringify(data.modules);
  assert.equal(data.filter('compliance',{query:'OPS-LT-118',state:'Noncompliant',unit:'Operations'}).length,1);
  assert.equal(data.filter('compliance',{query:'OPS-LT-118',state:'Compliant'}).length,0);
  assert.equal(data.filter('devices',{query:'no-such-device'}).length,0);
  assert.equal(JSON.stringify(data.modules),original);assert.throws(()=>data.filter('missing'));
});
test('policy and data boundaries distinguish device, app and access enforcement',()=>{
  assert.match(data.get('compliance').rows.find(r=>r.id==='CMP-003').details['Enforcement boundary'],/separately/);
  assert.match(data.get('app-protection').rows.find(r=>r.id==='MAM-006').details.Enrollment,/without enrollment/);
  assert.match(data.get('tenant').rows.find(r=>r.id==='TEN-006').details.Verification,/No live/);
  assert.match(data.get('autopilot').rows[0].details.Provisioning,/No device/);
  assert.match(data.get('support').rows[0].details['Support action'],/No request/);
});
test('all record timestamps and evidence timelines remain within the fixed snapshot',()=>{
  assert.equal(data.snapshot,'2026-11-02T09:42:00Z');
  for(const mod of Object.values(data.modules))for(const r of mod.rows){
    assert.ok(Date.parse(r.time)<=Date.parse(data.snapshot));
    assert.ok(Date.parse(r.timeline[0].time)<=Date.parse(r.timeline[1].time));
    assert.ok(r.timeline.every(e=>Date.parse(e.time)<=Date.parse(data.snapshot)));
  }
});
