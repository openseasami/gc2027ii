const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),moves=vm.runInNewContext('('+html.match(/^const NATIONAL_MOVES\s*=\s*(.*);$/m)[1]+')');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const version=require(require.resolve('pokemon-showdown/package.json',{paths:[__dirname,__dirname+'/work/oracle']})).version;assert.equal(version,'0.11.10');
const state={my:[{hp:100}],opp:[{hp:100}]};let known=true;
const ctx={NATIONAL_MOVES:moves,DAMAGE_MOVES:moves,PROTECT_MOVES:new Set(['まもる']),state,$:()=>({value:'なし'}),abilityOf:()=> 'はやてのつばさ',knownBattleAbility:(side)=>side==='my'||known?'はやてのつばさ':''};
vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function movePriorityValue('),html.indexOf('// Shared action-order effects.')),ctx);
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Talonflame',ability:'Gale Wings',moves:['bravebird']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});battle.makeChoices('team 12','team 12');
let cases=0;const failures=[];
try{
 for(const [name,id]of [['ブレイブバード','bravebird'],['おいかぜ','tailwind'],['はねやすめ','roost'],['でんこうせっか','quickattack'],['まもる','protect'],['トリックルーム','trickroom']])for(const hp of [100,99,50,1])for(const side of ['my','opp']){
  known=true;state[side][0].hp=hp;const source=battle.p1.active[0];source.hp=hp===100?source.maxhp:Math.max(1,Math.floor(source.maxhp*hp/100));
  const move=battle.dex.getActiveMove(id),expected=battle.runEvent('ModifyPriority',source,null,move,move.priority),actual=ctx.movePriorityForActor(name,'move',side,0,'ファイアロー');
  if(actual!==expected)failures.push({name,hp,side,expected,actual});cases++;
 }
}finally{battle.destroy();}
known=false;state.opp[0].hp=100;assert.equal(ctx.movePriorityForActor('ブレイブバード','move','opp',0,'ファイアロー'),0);
assert.equal(ctx.movePriorityForActor('ブレイブバード','switch','my',0,'ファイアロー'),7);
state.my[0].hp=undefined;assert.equal(ctx.movePriorityForActor('ブレイブバード','move','my',0,'ファイアロー'),0);
fs.writeFileSync(__dirname+'/GALE_WINGS_DIFFERENTIAL_RESULTS.json',JSON.stringify({oracle:'pokemon-showdown',version,entryPoint:'Battle.runEvent(ModifyPriority)',cases,failures,completion:false,limitations:['General Gen 9 registered move type and observed full HP only; not official Champions rules or full-match parity']},null,2)+'\n');
assert.equal(failures.length,0,JSON.stringify(failures));console.log(`PASS ${cases} real Showdown Gale Wings full/injured HP priority cases and unknown/switch guards`);
