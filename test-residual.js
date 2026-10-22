#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const start=html.indexOf('function estimatedEndTurnResidual(entry){');assert(start>=0);
let depth=0,end=-1;
for(let i=html.indexOf('{',start);i<html.length;i++){
 if(html[i]==='{')depth++;else if(html[i]==='}'&&!--depth){end=i+1;break;}
}
assert(end>start);
const source=html.slice(start,end);
let count=0;
function test(ability,status,weather,expectedDamage,expectedHeal){
 const context={
 effectiveBattleName:()=> 'TEST',BATTLE_DATA:{TEST:{hp:100,types:['ノーマル']}},
 savedMyProfiles:[{hp:0,item:''}],calcRealHP:()=>160,
 $:(id)=>({value:id==='weather'?weather:'なし'}),
 heldItemFor:()=>'',abilityOf:()=>ability,isGroundedPokemon:()=>false
 };
 const fn=vm.runInNewContext('('+source+')',context);
 const r=fn({name:'TEST',idx:0,d:{status}});
 assert.equal(r.damage,expectedDamage,`${ability} ${status} ${weather}: damage`);
 assert.equal(r.heal,expectedHeal,`${ability} ${status} ${weather}: heal`);
 count++;
}
test('あめうけざら','なし','雨',0,10);
test('あめうけざら','なし','晴れ',0,0);
test('アイスボディ','なし','雪',0,10);
test('かんそうはだ','なし','雨',0,20);
test('かんそうはだ','なし','晴れ',20,0);
test('サンパワー','なし','晴れ',20,0);
test('サンパワー','なし','雨',0,0);
test('ポイズンヒール','どく','なし',0,20);
test('ポイズンヒール','やけど','なし',10,0);
test('なし','どく','なし',20,0);
test('なし','なし','砂',10,0);
console.log(`${count} residual prediction tests passed.`);
