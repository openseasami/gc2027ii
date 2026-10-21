#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const a=html.indexOf('function resolveEntryEvents(entries){'),b=html.indexOf('// Recorded field checkpoints',a);assert(a>=0&&b>a);
const source=html.slice(a,b);
const state={my:[{hp:100,atkStage:0}],opp:[{hp:100,atkStage:0,abilityConfirmed:true}],seenOpp:[],entryOrderCursor:0,entryOrderJournal:{}};
const field={weather:{value:'なし'},weatherTurns:{value:'0'},terrain:{value:'なし'},terrainTurns:{value:'0'}};
const activations=[];let draws=0;
const rng=Object.create(Math);rng.random=()=>{draws++;return draws%2===1?.9:.1};
const ctx={state,Math:rng,JSON,Number,Set,Array,Object,$:k=>field[k]||null,
 fieldSpeed:()=>100,uncertainEntryFieldKinds:()=>({}),resetEntryStages:()=>{},restoreBatonState:()=>{},
 applyEntryTerrain:()=>{},triggerEntryAbility:(s,i,n)=>{activations.push(n);if(n==='Sun')field.weather.value='晴れ';if(n==='Rain')field.weather.value='雨'},
 ensureBattleEntry:(s,i)=>state[s][i],abilityOf:(s,i,n)=>n==='Sun'?'ひでり':'あめふらし',showEntryFieldUncertainty:()=>{}};
vm.createContext(ctx);vm.runInContext(source,ctx);
const entrants=[{side:'my',idx:0,name:'Sun'},{side:'opp',idx:0,name:'Rain'}];
let count=0;function eq(x,y,m){assert.deepEqual(x,y,m);count++}
ctx.resolveEntryEvents(entrants);const order=[...activations],weather=field.weather.value,journal=JSON.stringify(state.entryOrderJournal);
eq(draws,2,'two rolls at initial entry');eq(activations.length,2,'both abilities activate');eq(state.entryOrderCursor,1,'cursor advanced');
// Same encounter after a rewind, but reverse the supplied order.
activations.length=0;state.entryOrderCursor=0;field.weather.value='なし';ctx.resolveEntryEvents([...entrants].reverse());
eq(activations,order,'same tie order after replay');eq(field.weather.value,weather,'same weather after replay');eq(draws,2,'no reroll for unchanged participants');eq(JSON.stringify(state.entryOrderJournal),journal,'journal retained');
// Changed entrant composition must cause a new draw.
activations.length=0;state.entryOrderCursor=0;ctx.resolveEntryEvents([{side:'my',idx:0,name:'Sun'}]);eq(draws,3,'changed composition draws anew');
console.log(`${count} entry tie replay assertions passed`);
