// Actual commit/entry adapters vs native Showdown for both ordinary switch orders.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const part=(a,z)=>{const i=html.indexOf(a),j=html.indexOf(z,i+a.length);assert(i>=0&&j>i);return html.slice(i,j)};
const source=part('function commitTurnActions(){','function stageText(')+part('function resolveEntryEvents(entries){','// Recorded field checkpoints')+part('function triggerEntryAbility(side,idx,name){','function triggerInitialEntryAbilities(){')+part('function sortTurnSimulationEvents(events){','\nfunction ');
function native(mySpeed,tr){const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});try{
 b.setPlayer('p1',{team:[{species:'Rillaboom',ability:'Overgrow',level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']},{species:'Blaziken',ability:'Blaze',level:50,moves:['splash']}]});
 b.setPlayer('p2',{team:[{species:'Garchomp',ability:'Sand Veil',level:50,moves:['splash']},{species:'Eevee',ability:'Run Away',level:50,moves:['splash']},{species:'Incineroar',ability:'Intimidate',level:50,moves:['splash']}]});b.makeChoices('team 123','team 123');b.p1.active[0].storedStats.spe=mySpeed;b.p2.active[0].storedStats.spe=100;for(const s of b.sides)s.active[0].updateSpeed();if(tr)b.field.addPseudoWeather('trickroom',b.p1.active[0]);b.makeChoices('switch 3, move 1','switch 3, move 1');return {incoming:b.p1.active[0].boosts.atk,ally:b.p1.active[1].boosts.atk};
 }finally{b.destroy();}}
for(const mySpeed of [80,120])for(const tr of [false,true]){
 const fields={weather:{value:'なし'},weatherTurns:{value:'0'},terrain:{value:'なし'},terrainTurns:{value:'0'},trTurns:{value:tr?'3':'0'}};
 const make=()=>({hp:100,atkStage:0,actionHistory:[],abilityConfirmed:true});const state={myTeam:['Rillaboom','Eevee','Blaziken'],oppTeam:['Garchomp','Eevee','Incineroar'],myActive:[0,1],oppActive:[0,1],turnStartMyActive:[0,1],turnStartOppActive:[0,1],my:[make(),make(),make()],opp:[make(),make(),make()],seenOpp:[0,1]};state.my[0].currentTurnAction={kind:'switch',to:'Blaziken'};state.opp[0].currentTurnAction={kind:'switch',to:'Incineroar'};
 const ctx={state,Math,JSON,Number,Array,Set,Object,battleTurnNumber:3,$:id=>fields[id]||null,
 recordedTurnEvents:()=>[{side:'my',idx:0,actor:'Rillaboom',priority:7,speed:mySpeed,action:state.my[0].currentTurnAction},{side:'opp',idx:0,actor:'Garchomp',priority:7,speed:100,action:state.opp[0].currentTurnAction}],
 ensureBattleEntry:(s,i)=>state[s][i],resetEntryStages:(s,i)=>{state[s][i].atkStage=0},restoreBatonState:()=>{},applySwitchOutAbility:()=>{},
 fieldSpeed:n=>({Blaziken:100,Incineroar:120})[n]||90,abilityOf:(s,i,n)=>n==='Incineroar'?'いかく':'',possibleAbility:()=>false,
 applyEntryTerrain:()=>{},activateTerrainSeedsForActive:()=>{},receiveIntimidate:(s,i)=>state[s][i].atkStage--,
 uncertainEntryFieldKinds:()=>({}),showEntryFieldUncertainty:()=>{}};vm.createContext(ctx);vm.runInContext(source,ctx);ctx.commitTurnActions();const ref=native(mySpeed,tr);assert.equal(state.my[2].atkStage,ref.incoming,JSON.stringify({mySpeed,tr,ref}));assert.equal(state.my[1].atkStage,ref.ally);assert.equal(state.my[0].atkStage,0,'outgoing stay resets after receiving earlier Intimidate');assert.equal(state.myActive[0],2);assert.equal(state.oppActive[0],2);
 if(mySpeed===80&&!tr){
  vm.runInContext(part('function uncertainEntryFieldKinds(entries){','function showEntryFieldUncertainty(){'),ctx);ctx.ENTRY_TERRAIN_BY_MON={};ctx.abilityOf=(s,i,n)=>n==='Sun'?'ひでり':n==='Rain'?'あめふらし':'';
  state.myTeam=['Rillaboom','Eevee','Sun'];state.oppTeam=['Garchomp','Eevee','Rain'];state.myActive=[0,1];state.oppActive=[0,1];state.my[0].currentTurnAction={kind:'switch',to:'Sun'};state.opp[0].currentTurnAction={kind:'switch',to:'Rain'};ctx.commitTurnActions();
  assert.equal(fields.weather.value,'なし','competing setters with opponent prior must remain unknown');assert.equal(fields.weatherTurns.value,'0');assert.equal(JSON.stringify(state.entryFieldUncertainty.weather),JSON.stringify(['晴れ','雨'].sort()));
 }
}
console.log('PASS real ordinary-switch commit + entry adapters vs Showdown: faster/slower and normal/TR; Intimidate sees correct occupants');
