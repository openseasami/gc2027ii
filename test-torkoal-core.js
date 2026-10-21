const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function resolveMoveForDamage(');
const end=html.indexOf('// Read-only calculation effects:',start);
assert.ok(start>0&&end>start);
let side='my',hp=100;
const context={state:{my:[{hp:100,defStage:0}],opp:[{hp:100,defStage:0}]},effectiveBattleName:(s,i,n)=>n,knownBattleAbility:()=>'',abilityMoveTraits:()=>({}),$:(id)=>({value:'なし'}),attackerKnownItemless:()=>false,targetHasKnownRemovableItem:()=>false,weightBasedMovePower:()=>({power:80,known:false}),faintedAllyCount:()=>0,previousMoveFailed:()=>false,foulPlayAttackSource:()=>({atk:100}),isGroundedPokemon:()=>true};
vm.createContext(context);vm.runInContext(html.slice(start,end),context);
const mv={type:'ほのお',power:150,cat:'spec'};
let count=0;
for(const [pct,expected] of [[100,150],[75,112],[50,75],[25,37],[1,1],[0,1]]){
 context.state.my[0].hp=pct;
 assert.equal(context.resolveMoveForDamage('my',0,'コータス','ふんか',mv).power,expected);count++;
 context.state.opp[0].hp=pct;
 assert.equal(context.resolveMoveForDamage('opp',0,'コータス','ふんか',mv).power,expected);count++;
}
context.state.my[0].hp=NaN;
assert.equal(context.resolveMoveForDamage('my',0,'コータス','ふんか',mv).power,0);count++;
const press=context.resolveMoveForDamage('my',0,'コータス','ボディプレス',{power:80,type:'かくとう',cat:'phys'});
assert.equal(press.useOwnDefense,true);count++;
assert.equal(press.power,80);count++;
assert.equal(context.resolveMoveForDamage('my',0,'コータス','しおふき',{power:150,type:'みず',cat:'spec'}).power,0);count++;
assert.ok(html.includes("'ふんか':{power:150,type:'ほのお',cat:'spec',spread:true}"));count++;
console.log(`${count} Torkoal variable-power and Body Press checks passed`);
