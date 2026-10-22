const fs=require('node:fs'),assert=require('node:assert/strict'),rank=require('./rank-effects.js');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const version=require(require.resolve('pokemon-showdown/package.json',{paths:[__dirname,__dirname+'/work/oracle']})).version;
assert.equal(version,'0.11.10');
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Pikachu',ability:'Static',moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});
battle.makeChoices('team 12','team 12');
const map={atkStage:'atk',defStage:'def',spaStage:'spa',spdStage:'spd',speStage:'spe',accStage:'accuracy',evaStage:'evasion'};
let cases=0;const failures=[];
try{
 for(const ability of ['Static','Contrary','Simple','Klutz','Unburden'])for(const room of [false,true])for(const stage of [-6,-2,-1,0,1,6]){
  const target=battle.p1.active[0];battle.field.removePseudoWeather('magicroom');
  target.ability=ps.toID(ability);for(const key of Object.values(map))target.boosts[key]=0;
  if(room)battle.field.addPseudoWeather('magicroom',battle.p2.active[0]);
  target.setItem('whiteherb');
  const stages={atkStage:stage,defStage:2,accStage:stage,evaStage:-stage};
  for(const [key,value]of Object.entries(stages))target.boosts[map[key]]=value;
  const expected={...stages},reset=rank.whiteHerb(stages),active=!room&&ability!=='Klutz';
  if(active)for(const key of Object.keys(reset))expected[key]=0;
  const consumed=active&&Object.keys(reset).length>0;
  battle.eachEvent('Update');
  if(Object.keys(stages).some(key=>target.boosts[map[key]]!==expected[key])||!target.item!==consumed)failures.push({ability,room,stage,expected,actual:{...target.boosts},item:target.item});
  cases++;
 }
}finally{battle.destroy();}
fs.writeFileSync(__dirname+'/ITEM_DIFFERENTIAL_RESULTS.json',JSON.stringify({oracle:'pokemon-showdown',version,entryPoint:'Battle.eachEvent(Update)',cases,failures,complete:false,completion:false,limitations:['General Gen 9 White Herb item update event, not full match or Champions-specific timing']},null,2)+'\n');
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,3)));
console.log(`PASS ${cases} real Showdown White Herb/Simple/Contrary/Klutz/Magic Room differential cases`);
