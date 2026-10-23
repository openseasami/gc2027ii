const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const h=fs.readFileSync('index.html','utf8');const state={myTeam:['A'],oppTeam:['B'],my:[{}],opp:[{abilityConfirmed:true}]};
const ctx={state,DAMAGE_MOVES:{'通常':{cat:'phys'}},MOVE_BASE_ACCURACY:{'通常':.95},REGULATION_MC:{moveDetails:{'トリックフラワー':{alwaysHit:true}}},abilityOf:()=>'',heldItemFor:()=>'',effectiveWeatherForDamage:()=> 'なし',$:()=>({value:'なし'})};vm.createContext(ctx);vm.runInContext(h.slice(h.indexOf('function accuracyStageMultiplier('),h.indexOf('// v1.78.0: one accuracy-aware')),ctx);
for(const [a,d,want]of [[1,2,.71],[2,1,1],[-1,-2,1],[-2,-1,.71],[6,-6,1],[-6,6,.31]]){state.my[0].accStage=a;state.opp[0].evaStage=d;assert.equal(ctx.effectiveMoveAccuracy('通常','my',0,'opp',0).accuracy,want,`${a}/${d}`);}
state.my[0].accStage=-6;state.opp[0].evaStage=6;assert.equal(ctx.effectiveMoveAccuracy('トリックフラワー','my',0,'opp',0).accuracy,1);
state.my[0].accStage=0;state.opp[0].evaStage=6;assert.equal(ctx.effectiveMoveAccuracy('ＤＤラリアット','my',0,'opp',0).accuracy,1);
console.log('PASS net accuracy/evasion rank, integer percentage, intrinsic sure-hit and evasion-ignore boundaries');
