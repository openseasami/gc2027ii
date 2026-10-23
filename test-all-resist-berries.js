// All registered type-resist berries, independent PS callbacks and 16 rolls.
const fs=require('node:fs'),assert=require('node:assert/strict'),core=require('./battle-core.js');
const ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const rows=[
 ['ホズのみ','chilanberry','Normal','ノーマル','Eevee'],['オッカのみ','occaberry','Fire','ほのお','Abomasnow'],
 ['イトケのみ','passhoberry','Water','みず','Charizard'],['ソクノのみ','wacanberry','Electric','でんき','Gyarados'],
 ['リンドのみ','rindoberry','Grass','くさ','Swampert'],['ヤチェのみ','yacheberry','Ice','こおり','Garchomp'],
 ['ヨプのみ','chopleberry','Fighting','かくとう','Tyranitar'],['ビアーのみ','kebiaberry','Poison','どく','Whimsicott'],
 ['シュカのみ','shucaberry','Ground','じめん','Magnezone'],['バコウのみ','cobaberry','Flying','ひこう','Breloom'],
 ['ウタンのみ','payapaberry','Psychic','エスパー','Toxicroak'],['タンガのみ','tangaberry','Bug','むし','Malamar'],
 ['ヨロギのみ','chartiberry','Rock','いわ','Volcarona'],['カシブのみ','kasibberry','Ghost','ゴースト','Mew'],
 ['ハバンのみ','habanberry','Dragon','ドラゴン','Garchomp'],['ナモのみ','colburberry','Dark','あく','Alakazam'],
 ['リリバのみ','babiriberry','Steel','はがね','Ninetales-Alola'],['ロゼルのみ','roseliberry','Fairy','フェアリー','Hydreigon']];
let comparisons=0,consumptionComparisons=0;const failures=[],byBerry={};
for(const[item,id,type,jp,species]of rows){
 const b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[1,2,3,4]});
 try{
  for(const[side,name]of [['p1','Pikachu'],['p2',species]])b.setPlayer(side,{team:[{species:name,level:50,ability:'Run Away',moves:['splash']},{species:'Eevee',ability:'Run Away',moves:['splash']}]});
  b.makeChoices('team 12','team 12');const a=b.p1.active[0],d=b.p2.active[0];a.types=['Normal'];
  const eff=2**d.getTypes().reduce((n,t)=>n+b.dex.getEffectiveness(type,t),0);
  byBerry[item]={comparisons:0};
  for(const physical of [false,true])for(const blocked of [false,true])for(const ripen of [false,true])for(const consumed of [false,true])for(const substitute of [false,true])for(const bypass of [false,true]){
   a.setAbility(blocked?'Unnerve':'Run Away');d.setAbility(ripen?'Ripen':'Run Away');delete d.volatiles.substitute;if(substitute)d.addVolatile('substitute');
   const assessment=core.resistBerry({item:consumed?'':item,type:jp,effectiveness:eff,blocked,ripen,substitute,bypassSubstitute:bypass});
   const base=core.baseDamage(80,a.storedStats[physical?'atk':'spa'],d.storedStats[physical?'def':'spd'],false,1,1);
   for(let roll=85;roll<=100;roll++){
    b.sendUpdates();d.setItem(consumed?'':id);b.randomizer=n=>Math.floor(n*roll/100);
    const m=b.dex.getActiveMove('tackle');m.type=type;m.category=physical?'Physical':'Special';m.basePower=80;m.willCrit=false;m.flags={...m.flags,bypasssub:bypass};
    const expected=b.actions.getDamage(a,d,m,true),actual=core.damageRoll(base,roll,1,type==='Normal'?1.5:1,eff,1,1,1,1,1,assessment.factor);
    comparisons++;byBerry[item].comparisons++;
    if(expected!==actual&&failures.length<30)failures.push({item,physical,blocked,ripen,consumed,substitute,bypass,roll,expected,actual});
    consumptionComparisons++;if((!d.item)!==(consumed||assessment.consume)&&failures.length<30)failures.push({item,role:'consumption'});
   }
  }
 }finally{b.destroy();}
}
const report={completion:false,oracle:'pokemon-showdown@0.11.10 real resistance-berry item callbacks',berries:18,comparisons,consumptionComparisons,byBerry,failures,
 scope:'Registered type-resist berries; physical/special, all 16 rolls, active/consumed, Unnerve, Ripen, Substitute/bypass. Controlled damage, not official item eligibility.'};
fs.writeFileSync('ALL_RESIST_BERRY_RESULTS.json',JSON.stringify(report,null,2)+'\n');assert.deepEqual(failures,[]);
assert.equal(core.resistBerry({item:'ホズのみ',type:'ノーマル',effectiveness:.5}).factor,.5);
assert.equal(core.resistBerry({item:'ホズのみ',type:'ノーマル',effectiveness:0}).factor,1);
assert.equal(core.resistBerry({item:'オッカのみ',type:'ほのお',effectiveness:1}).factor,1);
assert.equal(core.resistBerry({item:'オッカのみ',type:'みず',effectiveness:2}).factor,1);
assert.equal(core.resistBerry({item:'',effectiveness:2}).factor,1);
assert.equal(Object.keys(core.RESIST_BERRY_TYPES).length,18);
console.log(`PASS ${comparisons} damage and ${consumptionComparisons} consumption comparisons for all 18 registered resist berries`);
