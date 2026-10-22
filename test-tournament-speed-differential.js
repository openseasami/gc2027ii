// All 120 adoption profiles contribute intrinsic input speeds; compare modifiers,
// not species legality, Champions base stats or the opponent EV/nature prior.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),core=require('./battle-core.js');
const html=fs.readFileSync('index.html','utf8'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const profiles=JSON.parse(fs.readFileSync('ADOPTION_120_NORMALIZED.json')).species;assert.equal(profiles.length,120);
const literal=n=>vm.runInNewContext('('+html.match(new RegExp('^const '+n+'\\s*=\\s*(.*);$','m'))[1]+')');const bases=Object.fromEntries(Object.entries(literal('NATIONAL_DEX')).map(([name,d])=>[name,d.spe]));
let intrinsic=101,ability='',weather='なし',terrain='なし',tailwind=false,item='';const entry={hp:100,status:'なし',speStage:0,unburdenActive:false,itemConsumed:false};
const ctx={BattleCore:core,state:{my:[entry],myTeam:['fixture']},$:(id)=>({value:id==='myTailwind'?(tailwind?'4':'0'):id==='terrain'?terrain:'なし'}),knownBattleAbility:()=>ability,effectiveWeatherForDamage:()=>weather,rawHeldItemFor:()=>item,heldItemFor:()=>item,intrinsicBattleSpeed:()=>intrinsic,ensureBattleEntry:()=>entry,applyStage:core.stageStat,battlePokeRound:core.pokeRound};vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('function speedFieldMultiplier('),html.indexOf('function readTeam(')),ctx);
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Pikachu',level:50,ability:'Run Away',moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});battle.makeChoices('team 12','team 12');let cases=0;const failures=[];
const variants=[['','runaway','なし','','なし'],['すいすい','swiftswim','雨','raindance','なし'],['ようりょくそ','chlorophyll','晴れ','sunnyday','なし'],['サーフテール','surgesurfer','なし','','エレキ'],['はやあし','quickfeet','なし','','なし'],['かるわざ','unburden','なし','','なし']];
try{
 const pokemon=battle.p1.active[0];
 for(const profile of profiles){
  assert.ok(Number.isFinite(bases[profile.name]),'Missing speed '+profile.name);
  intrinsic=Math.floor((Math.floor((2*bases[profile.name]+31)*.5)+5+32)*1.1);pokemon.storedStats.spe=intrinsic;
  for(const [jp,id,w,wid,t]of variants){
   ability=jp;weather=w;terrain=t;pokemon.ability=id;battle.field.clearWeather();battle.field.clearTerrain();if(wid)battle.field.setWeather(wid,pokemon);if(t==='エレキ')battle.field.setTerrain('electricterrain',pokemon);
   for(const scarf of [false,true])for(const tw of [false,true])for(const par of [false,true])for(const stage of [-6,-2,-1,0,1,2,6]){
    battle.sendUpdates();item=scarf?'こだわりスカーフ':'';pokemon.setItem(scarf?'choicescarf':'');entry.itemConsumed=false;entry.unburdenActive=!scarf;entry.speStage=stage;entry.status=par?'まひ':'なし';pokemon.status=par?'par':'';pokemon.boosts.spe=stage;
    // Unburden is a volatile/history, never inferred merely from an empty slot.
    delete pokemon.volatiles.unburden;if(ability==='かるわざ')pokemon.addVolatile('unburden');
    tailwind=tw;pokemon.side.removeSideCondition('tailwind');if(tw)pokemon.side.addSideCondition('tailwind',pokemon);
    const expected=pokemon.getStat('spe'),actual=ctx.fieldSpeed('fixture','my',0);
    if(expected!==actual)failures.push({name:profile.name,ability,scarf,tw,par,stage,intrinsic,expected,actual});cases++;
   }
  }
 }
}finally{battle.destroy();}
fs.writeFileSync('TOURNAMENT_SPEED_DIFFERENTIAL_RESULTS.json',JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',profiles:profiles.length,cases,failures,scope:'Existing intrinsic input speeds for 120 profiles; rank, Choice Scarf, Tailwind, paralysis, Swift Swim, Chlorophyll, Surge Surfer, Quick Feet, Unburden. No base-stat, event-legality or full-match certification.'},null,2)+'\n');assert.equal(failures.length,0,JSON.stringify(failures.slice(0,5)));console.log(`PASS ${cases} Showdown speed comparisons across ${profiles.length} adoption profiles`);
