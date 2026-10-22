const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const literal=n=>vm.runInNewContext('('+html.match(new RegExp('^const '+n+'\\s*=\\s*(.*);$','m'))[1]+')');
const moves=literal('NATIONAL_MOVES'),traits=literal('ABILITY_ENGINE_DATA').moves;
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const version=require(require.resolve('pokemon-showdown/package.json',{paths:[__dirname,__dirname+'/work/oracle']})).version;
assert.equal(version,'0.11.10');
let ability='',weather='なし';
const ctx={state:{my:[{hp:100}],opp:[{hp:100}]},effectiveBattleName:(s,i,n)=>n,knownBattleAbility:()=>ability,abilityMoveTraits:n=>traits[n]||{},$:(id)=>({value:'なし'}),attackerKnownItemless:()=>false,targetHasKnownRemovableItem:()=>false,weightBasedMovePower:()=>({power:80,known:false}),faintedAllyCount:()=>0,previousMoveFailed:()=>false,foulPlayAttackSource:()=>({atk:100}),isGroundedPokemon:()=>true,effectiveWeatherForDamage:()=>weather,BATTLE_DATA:{rock:{types:['いわ']},ice:{types:['こおり']}}};
vm.createContext(ctx);let start=html.indexOf('function resolveMoveForDamage('),end=html.indexOf('// Read-only calculation effects:',start);vm.runInContext(html.slice(start,end),ctx);
vm.runInContext(html.slice(html.indexOf('function weatherDefenseMod('),html.indexOf('const POKEMON_WEIGHT_KG=')),ctx);
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Primarina',ability:'Liquid Voice',moves:['hypervoice']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});
battle.makeChoices('team 12','team 12');
const types={Water:'みず',Normal:'ノーマル',Bug:'むし',Psychic:'エスパー',Fire:'ほのお'};let cases=0;const failures=[];
try{
 for(const [name,id] of [['ハイパーボイス','hypervoice'],['むしのさざめき','bugbuzz'],['うたかたのアリア','sparklingaria'],['サイコノイズ','psychicnoise'],['かえんほうしゃ','flamethrower']])for(const active of [false,true]){
  ability=active?'うるおいボイス':'';const source=battle.p1.active[0],target=battle.p2.active[0];source.ability=active?'liquidvoice':'torrent';
  const move=battle.dex.getActiveMove(id);battle.runEvent('ModifyType',source,target,move,move);
  const actual=ctx.resolveMoveForDamage('my',0,'アシレーヌ',name,moves[name]);
  if(actual.moveType!==types[move.type])failures.push({name,active,expected:types[move.type],actual:actual.moveType});
  assert.equal(actual.power,moves[name].power,'Liquid Voice must not boost base power');cases++;
 }
}finally{battle.destroy();}
for(const w of ['なし','砂','雪'])for(const name of ['rock','ice'])for(const cat of ['phys','spec']){
 weather=w;assert.equal(ctx.weatherDefenseMod(name,cat),w==='砂'&&name==='rock'&&cat==='spec'||w==='雪'&&name==='ice'&&cat==='phys'?1.5:1);
}
weather='なし';assert.equal(ctx.weatherDefenseMod('unknown','spec'),1);
fs.writeFileSync(__dirname+'/ADOPTION_MECHANICS_DIFFERENTIAL_RESULTS.json',JSON.stringify({oracle:'pokemon-showdown',version,entryPoint:'Battle.runEvent(ModifyType)',cases,failures,completion:false,limitations:['Liquid Voice move type only; no full damage, Champions legality or full-match parity']},null,2)+'\n');
assert.equal(failures.length,0,JSON.stringify(failures));console.log(`PASS ${cases} real Showdown Liquid Voice type cases; 13 effective-weather defense regressions`);
