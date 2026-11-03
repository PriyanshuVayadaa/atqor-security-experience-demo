'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../purview-data.js');

test('all twelve Purview fixture modules are populated with aligned, inspectable records',()=>{
  assert.equal(Object.keys(data.modules).length,12);
  const allIds=new Set();
  for(const [key,mod]of Object.entries(data.modules)){
    assert.ok(mod.title&&mod.icon&&mod.subtitle);assert.ok(mod.rows.length>=6,key);
    for(const row of mod.rows){
      assert.equal(row.module,key);assert.ok(!allIds.has(row.id),row.id);allIds.add(row.id);
      assert.equal(row.values.length,mod.columns.length,`${key}/${row.id}`);assert.ok(row.values.every(v=>typeof v==='string'));
      assert.ok(['all','Finance','Engineering','Operations'].includes(row.unit));assert.ok(Number.isInteger(row.age)&&row.age>=1);
      assert.ok(Object.keys(row.details).length>=6);assert.ok(row.timeline.length>=2);assert.ok(Date.parse(row.time)<=Date.parse(data.snapshot));
    }
  }
});

test('every related module and linked record resolves',()=>{
  for(const mod of Object.values(data.modules)){
    for(const key of mod.links)assert.ok(data.modules[key],key);
    for(const row of mod.rows)for(const link of row.links||[])assert.ok(data.modules[link.module]?.rows.some(r=>r.id===link.id),`${row.id} -> ${link.module}/${link.id}`);
  }
});

test('DLP seven-day match groups reconcile to the fixed 38-match aggregate and business units',()=>{
  const rows=data.filter('dlp-alerts',{days:7});
  assert.equal(rows.reduce((n,r)=>n+r.count,0),38);
  for(const [unit,count]of [['Finance',21],['Engineering',8],['Operations',9]])assert.equal(data.filter('dlp-alerts',{unit,days:7}).reduce((n,r)=>n+r.count,0),count);
});

test('simulation and disabled DLP policies do not claim enforced blocks',()=>{
  const pilot=data.modules.dlp.rows.find(r=>r.id==='DLP-AI-008');assert.equal(pilot.state,'Simulation');assert.match(pilot.details['Enforcement boundary'],/no block/);
  const disabled=data.modules.dlp.rows.find(r=>r.id==='DLP-EXT-010');assert.equal(disabled.state,'Disabled');assert.match(disabled.details['Enforcement boundary'],/no enforcement/);
  assert.equal(data.modules.dlp.rows.filter(r=>r.values[2]==='Endpoint'&&r.state==='Enabled').length,4);
});

test('business-unit scoping returns only the selected unit and shared records',()=>{
  for(const key of Object.keys(data.modules))for(const unit of ['Finance','Engineering','Operations']){
    const records=data.filter(key,{unit,days:30});assert.ok(records.length>0,`${key}/${unit}`);
    assert.ok(records.every(row=>row.unit===unit||row.unit==='all'));
  }
});

test('activity periods filter event ages while configuration and inventory remain fixed',()=>{
  for(const [key,mod]of Object.entries(data.modules)){
    const one=data.filter(key,{days:1}),month=data.filter(key,{days:30});
    if(mod.activity){assert.ok(one.every(r=>r.age<=1));assert.ok(month.length>one.length,key);}
    else assert.deepEqual(one,month,key);
  }
  assert.ok(data.filter('audit',{days:30}).length>data.filter('audit',{days:7}).length);
});

test('search and state filters combine without modifying original fixture arrays',()=>{
  const before=JSON.stringify(data.modules);
  assert.equal(data.filter('dlp-alerts',{query:'Q4-Financials',state:'New'}).length,1);
  assert.equal(data.filter('dlp-alerts',{query:'Q4-Financials',state:'Resolved'}).length,0);
  assert.equal(data.filter('classification',{query:'No-such-record'}).length,0);
  assert.equal(data.filter('dlp',{query:'  DLP-AI-008  ',state:'Simulation'}).length,1);
  assert.equal(JSON.stringify(data.modules),before);
  assert.throws(()=>data.filter('unknown'));
});

test('privacy-sensitive review views contain aliases, not named message contents or participant identity mappings',()=>{
  for(const row of data.modules.insider.rows){assert.match(row.values[1],/^Anonymized user/);assert.match(row.details.Privacy,/no reveal/);}
  for(const row of data.modules.communication.rows){assert.match(row.values[3],/^Anonymized participant/);assert.match(row.details['Content privacy'],/not embedded/);}
  for(const row of data.modules['agent-activity'].rows)assert.equal(row.details['Matched values'],'Never embedded');
});

test('eight labels and twelve active retention references exist independently of snapshot subsets',()=>{
  assert.equal(data.modules.information.rows.length,8);assert.ok(data.modules.information.rows.every(r=>r.state==='Published'));
  assert.equal(data.modules.lifecycle.rows.length,12);assert.ok(data.modules.lifecycle.rows.every(r=>r.state==='Active'));
  assert.equal(data.modules.records.rows.length,6);
});

test('audit records and evidence timeline events occur at or before snapshot',()=>{
  for(const mod of Object.values(data.modules))for(const row of mod.rows){
    for(const event of row.timeline)assert.ok(Date.parse(event.time)<=Date.parse(data.snapshot));
    assert.ok(Date.parse(row.timeline[0].time)<=Date.parse(row.timeline[1].time));
  }
  for(const row of data.modules.audit.rows)assert.equal(row.values[0],row.time);
});