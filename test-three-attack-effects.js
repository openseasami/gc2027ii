const assert=require('node:assert/strict'),m=require('./three-attack-effects');
assert.equal(m.strikePower('トリプルアクセル',1,20),20);assert.equal(m.strikePower('トリプルアクセル',2,20),40);assert.equal(m.strikePower('トリプルアクセル',3,20),60);assert.equal(m.strikePower('ネズミざん',10,20),20);
assert.deepEqual(m.temperPower(null,1),{power:75,known:true});assert.deepEqual(m.temperPower({turn:0,result:'failed'},1),{power:75,known:true});assert.deepEqual(m.temperPower(null,2),{power:75,known:false});assert.equal(m.temperPower({turn:2,result:'failed'},3).power,150);assert.equal(m.temperPower({turn:1,result:'failed'},3).known,false);
for(const result of ['success','other'])assert.deepEqual(m.temperPower({turn:2,result},3),{power:75,known:true});
assert.equal(m.previousTurn({kind:'move',failed:true},true,1).result,'failed');assert.equal(m.previousTurn({kind:'move',failed:true},false,1).result,'other');assert.deepEqual(m.temperPower({turn:3,result:'other'},3),{power:75,known:true});assert.deepEqual(m.temperPower({turn:3,result:'other'},4),{power:75,known:true});assert.equal(m.previousTurn({kind:'move',failed:false},true,1).result,'success');assert.equal(m.previousTurn({kind:'move'},true,1).result,'unknown');assert.equal(m.previousTurn(null,true,1).result,'unknown');assert.equal(m.previousTurn(null,false,1).result,'other');assert.equal(m.previousTurn({kind:'switch'},true,1).result,'other');
for(const max of [3,10])for(const p of [0,.5,.9,.99,1]){
 const r=m.hitDistribution(max,p,p);assert.ok(Math.abs(r.distribution.reduce((n,x)=>n+x[1],0)-1)<1e-12);assert.equal(r.accuracy,p);assert.equal(r.distribution.at(-1)[1],p**(max-1));
}
assert.deepEqual(m.hitDistribution(3,.9,.9,{singleCheck:true}).distribution,[[3,1]]);const dice=m.hitDistribution(10,.9,.9,{dice:true,singleCheck:true});assert.deepEqual(dice.distribution.map(x=>x[0]),[4,5,6,7,8,9,10]);assert.ok(dice.distribution.every(x=>x[1]===1/7));
assert.equal(m.accuracy(.9,0,0,[4505]),.99);assert.equal(m.accuracy(.9,-1,0,[4505]),.74);assert.equal(m.accuracy(.9,-1,0,[4505],true),.68);
console.log('PASS per-strike powers, stamped failure/success/unknown/switch history, geometric stopping, Dice 4..10 and fixed-point accuracy');
