const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function extract(start,end){let a=html.indexOf('function '+start+'(');assert(a>=0,start);let b=html.indexOf('\nfunction '+end+'(',a+1);assert(b>a,end);return html.slice(a,b)}
const snippets=[extract('priorityBlockedAgainst','priorityBlockReason'),extract('priorityBlockReason','usableAttackMove'),extract('isGroundedPokemon','terrainDamageMod'),extract('forecastGroundedForTerrain','forecastCommonSecondaryStatus')].join('\n');
const entries={0:{item:'ふうせん',itemConfirmed:true,ability:'',abilityConfirmed:true},1:{item:'くろいてっきゅう',itemConfirmed:true,ability:'',abilityConfirmed:true},2:{item:'',itemConfirmed:true,ability:'ふゆう',abilityConfirmed:true},3:{item:'',itemConfirmed:true,ability:'',abilityConfirmed:true}};
const context={state:{opp:entries},BATTLE_DATA:{'通常':{types:['ノーマル']},'飛行':{types:['ひこう']}},$:()=>({value:'サイコ'}),effectiveBattleName:(_,__,name)=>name,abilityOf:(side,idx)=>entries[idx].ability,heldItemFor:(side,idx)=>entries[idx].item,activePriorityBlocker:()=>null};vm.createContext(context);vm.runInContext(snippets,context);
const cases=[['通常',0,false],['飛行',1,true],['通常',2,false],['通常',3,true],['飛行',3,false]];
for(const [name,idx,expected] of cases){assert.equal(context.priorityBlockedAgainst({name,idx},'opp'),expected,`${name}/${idx}`);assert.equal(Boolean(context.priorityBlockReason({name,idx},'opp')),expected,`reason ${name}/${idx}`)}
console.log(`${cases.length*2} grounded priority tests passed`);
