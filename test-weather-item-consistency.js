const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function fn(name){const a=html.indexOf('function '+name+'(');assert(a>=0);let depth=0;for(let i=html.indexOf('{',a);i<html.length;i++){if(html[i]==='{')depth++;if(html[i]==='}'&&!--depth)return html.slice(a,i+1);}throw Error(name);}
let suppressed=false,weather='雨',ability='あめうけざら',item='';
const ctx={state:{my:[{hp:100}],opp:[],myActive:[0],oppActive:[]},savedMyProfiles:[{hp:0}],BATTLE_DATA:{TEST:{hp:100,types:['ノーマル']}},
 activeKnownAbilityEntries:()=>suppressed?[{ability:'ノーてんき'}]:[],$:id=>({value:id==='weather'?weather:id==='terrain'?'なし':'0'}),knownBattleAbility:()=>ability,
 effectiveBattleName:()=> 'TEST',abilityOf:()=>ability,heldItemFor:()=>item,calcRealHP:()=>160,isGroundedPokemon:()=>false};
vm.createContext(ctx);vm.runInContext(fn('effectiveWeatherForDamage')+fn('speedFieldMultiplier')+fn('estimatedEndTurnResidual'),ctx);
let scenarios=0;
for(const [ab,w] of [['すいすい','雨'],['ようりょくそ','晴れ'],['すなかき','砂'],['ゆきかき','雪']]){
 ability=ab;weather=w;suppressed=false;assert.equal(ctx.speedFieldMultiplier('TEST','my',0),2);suppressed=true;assert.equal(ctx.speedFieldMultiplier('TEST','my',0),1);scenarios++;
}
for(const [ab,w,key]of [['あめうけざら','雨','heal'],['かんそうはだ','雨','heal'],['アイスボディ','雪','heal'],['サンパワー','晴れ','damage']]){
 ability=ab;weather=w;suppressed=false;assert.ok(ctx.estimatedEndTurnResidual({name:'TEST',idx:0,d:{}})[key]>0);
 suppressed=true;assert.equal(ctx.estimatedEndTurnResidual({name:'TEST',idx:0,d:{}})[key],0);scenarios++;
}
weather='砂';ability='';suppressed=false;item='ぼうじんゴーグル';assert.equal(ctx.estimatedEndTurnResidual({name:'TEST',idx:0,d:{}}).damage,0);
item='';assert.equal(ctx.estimatedEndTurnResidual({name:'TEST',idx:0,d:{}}).damage,10);scenarios++;
console.log(`PASS ${scenarios} shared weather suppression and active-item residual scenarios`);

ctx.abilityBypassed=()=>false;ctx.abilityMoveTraits=()=>({});
vm.runInContext(fn('sharedAbilityDamageModifiers'),ctx);
for(const [ab,w,cat,type,key,boost]of [['サンパワー','晴れ','spec','ほのお','attack',1.5],['すなのちから','砂','phys','いわ','power',1.3]]){
 ability=ab;weather=w;suppressed=false;
 assert.equal(ctx.sharedAbilityDamageModifiers('my',0,'TEST','opp',0,'TEST','test',{cat},type,80,1)[key],boost);
 suppressed=true;
 assert.equal(ctx.sharedAbilityDamageModifiers('my',0,'TEST','opp',0,'TEST','test',{cat},type,80,1)[key],1);
 assert.equal(ctx.$('weather').value,w,'Suppression must preserve displayed weather');
}
console.log('PASS Solar Power / Sand Force damage suppression and displayed-weather persistence');
