const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(__dirname+'/index.html','utf8');
const a=s.indexOf('function isGroundedPokemon('),b=s.indexOf('function applyStage(',a);
const f=s.indexOf('function forecastGroundedForTerrain('),g=s.indexOf('function forecastCommonSecondaryStatus(',f);
assert.ok(a>0&&b>a&&f>0&&g>f);
const context={BATTLE_DATA:{A:{types:['ひこう']},B:{types:['ドラゴン']},C:{types:['くさ']}},state:{my:[{ability:'ふゆう',item:'',abilityConfirmed:true}],opp:[{ability:'',item:'ふうせん',itemConfirmed:true}]},$:(id)=>({value:'ミスト'}),abilityOf:(side,i)=>context.state[side][i].ability,heldItemFor:(side,i)=>context.state[side][i].item};
vm.createContext(context);
vm.runInContext(s.slice(f,g)+s.slice(a,b),context);
let count=0;const check=(a,b)=>{assert.equal(a,b);count++};
check(context.isGroundedPokemon('C','my',0),false); // levitate
check(context.isGroundedPokemon('B','opp',0),false); // balloon
check(context.terrainDamageMod('C','ドラゴン','B','りゅうのはどう','my',0,'opp',0),1);
context.state.opp[0].item='くろいてっきゅう';
check(context.isGroundedPokemon('B','opp',0),true);
check(context.terrainDamageMod('C','ドラゴン','B','りゅうのはどう','my',0,'opp',0),0.5);
context.state.my[0].item='くろいてっきゅう';
check(context.isGroundedPokemon('C','my',0),true);
context.$=()=>({value:'グラス'});
check(context.terrainDamageMod('C','くさ','B','エナジーボール','my',0,'opp',0),1.3);
check(context.terrainDamageMod('C','じめん','B','じしん','my',0,'opp',0),0.5);
context.state.opp[0].itemConfirmed=false;
check(context.isGroundedPokemon('B','opp',0),true); // unknown item cannot be asserted
console.log(`${count} terrain damage grounded checks passed`);
