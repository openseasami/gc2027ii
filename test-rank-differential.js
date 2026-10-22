// Real external Battle.boost oracle; general Gen 9 mechanics, not Champions legality.
const fs=require('node:fs'),assert=require('node:assert/strict'),rank=require('./rank-effects.js');
let ps;try{ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));}
catch(error){throw Error('Install pinned oracle: npm ci --ignore-scripts. '+error.message);}
const version=require(require.resolve('pokemon-showdown/package.json',{paths:[__dirname,__dirname+'/work/oracle']})).version;
assert.equal(version,'0.11.10');
const battle=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
for(const side of ['p1','p2'])battle.setPlayer(side,{team:[{species:'Pikachu',ability:'Static',moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});
battle.makeChoices('team 12','team 12');
const map={atkStage:'atk',defStage:'def',spaStage:'spa',spdStage:'spd',speStage:'spe',accStage:'accuracy',evaStage:'evasion'};
const abilities={'':'Static','あまのじゃく':'Contrary','たんじゅん':'Simple','まけんき':'Defiant','かちき':'Competitive','クリアボディ':'Clear Body','しろいけむり':'White Smoke','かいりきバサミ':'Hyper Cutter','はとむね':'Big Pecks','するどいめ':'Keen Eye','ミラーアーマー':'Mirror Armor','ばんけん':'Guard Dog','びびり':'Rattled','せいしんりょく':'Inner Focus','どんかん':'Oblivious','きもったま':'Scrappy','マイペース':'Own Tempo'};
const items={'':'','クリアチャーム':'clearamulet'};
let cases=0;const failures=[];
try{
 for(const [ability,en]of Object.entries(abilities))for(const item of Object.keys(items))for(const start of [-6,-5,0,5,6])for(const origin of ['self','ally','opponent'])for(const eventKind of ['move','intimidate'])for(const changes of [{atkStage:-1},{spdStage:-2},{accStage:-1},{atkStage:-1,defStage:-1},{atkStage:2}]){
  if(eventKind==='intimidate'&&(origin!=='opponent'||Object.keys(changes).length!==1||changes.atkStage!==-1))continue;
  const target=battle.p2.active[0],source=origin==='self'?target:origin==='ally'?battle.p2.active[1]:battle.p1.active[0];
  for(const side of battle.sides)for(const p of side.active){p.ability='static';p.item='';for(const key of Object.values(map))p.boosts[key]=0;}
  target.ability=ps.toID(en);target.item=items[item];for(const key of Object.values(map))target.boosts[key]=start;
  const stages=Object.fromEntries(Object.keys(map).map(k=>[k,start]));
  const expected=rank.resolve({stages,changes,ability,item,origin,intimidate:eventKind==='intimidate',sourceStages:origin==='self'?null:{}});
  const actualTarget={...stages},actualSource={};rank.apply(expected,actualTarget,actualSource);
  battle.boost(Object.fromEntries(Object.entries(changes).map(([k,v])=>[map[k],v])),target,source,eventKind==='intimidate'?battle.dex.abilities.get('intimidate'):battle.dex.moves.get('growl'));
  const differences=Object.keys(map).filter(k=>actualTarget[k]!==target.boosts[map[k]]||(origin!=='self'&&(actualSource[k]||0)!==source.boosts[map[k]]));
  if(differences.length)failures.push({eventKind,ability,item,start,origin,changes,differences,expected:actualTarget,actual:{...target.boosts}});
  cases++;
 }
}finally{battle.destroy();}
const report={oracle:'pokemon-showdown',version,format:'gen9doublescustomgame',entryPoint:'Battle.boost',seed:[1,2,3,4],cases,failures,complete:false,completion:false,limitations:['No full-match or Champions-specific legality oracle','Intimidate event immunities, move hits and item lifecycle tested separately']};
fs.writeFileSync(__dirname+'/RANK_DIFFERENTIAL_RESULTS.json',JSON.stringify(report,null,2)+'\n');
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,4)));
console.log(`PASS ${cases} real Showdown rank differential cases, version ${version}`);
