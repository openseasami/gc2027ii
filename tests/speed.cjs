'use strict';
const K=require('../source/core.cjs'),{native}=require('./native-oracle.cjs'),fs=require('fs'),assert=require('node:assert/strict');
const report={completion:false,passed:false,cases:[],unverified:[],limitations:['Speed stage is assumed zero; no paralysis, Tailwind, action priority or full action-order simulation. TR reverses the displayed reference comparison only.']};
for(const ability of ['Swift Swim','Chlorophyll','Sand Rush','Slush Rush','Quick Feet','Surge Surfer']){
 const s=K.DATA.species.find(s=>s.abilities.includes(ability));
 if(!s){report.unverified.push({ability,reason:'No owner in the available M-C model'});continue;}
 for(const weather of ['none','sun','rain','sand','snow'])for(const fast of [false,true]){
  const a={...K.unknownActor(s.id),ability,key:'a',side:'own',nature:fast?'Timid':'Brave',points:[0,0,0,0,0,fast?32:0],burn:ability==='Quick Feet'},b={...K.unknownActor('snorlax'),key:'b',side:'opp'},ctx={weather,terrain:ability==='Surge Surfer'?'electric':'none',actives:[a,b]};
  const expected=native(a,b,'tackle',ctx).speed,actual=K.speedRange(a,ctx);
  assert.equal(actual[0],expected,s.id+'/'+ability+'/'+weather);assert.equal(actual[1],expected);
  report.cases.push({id:s.id,ability,weather,fast,actual:actual[0],expected,passed:true});
 }
}
for(const id of ['rillaboom','floettemega','raichualola','garchompmegaz'])for(const nature of ['Serious','Timid','Brave']){
 const a={...K.unknownActor(id),side:'own',key:'a',points:[2,0,0,32,0,32],nature},b={...K.unknownActor('snorlax'),key:'b',side:'opp'},ctx={actives:[a,b]};
 if(!K.species(id).isMega)a.item='Choice Scarf';
 const expected=native(a,b,'tackle',ctx).speed,actual=K.speedRange(a,ctx);assert.deepEqual(actual,[expected,expected]);report.cases.push({id,nature,item:a.item,actual:actual[0],expected,passed:true});
}
report.passed=true;fs.writeFileSync('reference/SPEED_RESULTS.json',JSON.stringify(report,null,2)+'\n');console.log('PASS speed',report.cases.length,'independent native cases; unverified',report.unverified.length);
