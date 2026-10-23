const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8'),keys=['atkStage','defStage','spaStage','spdStage','speStage','accStage','evaStage'];
const state={my:{0:{}},opp:{0:{}}};let terrain='なし',held={known:true,item:''},ability='';
const ctx={state,BATTLE_STAGE_KEYS:keys,effectiveBattleName:(_s,_i,n)=>n,knownBattleAbility:s=>s==='opp'?ability:'',isGroundedPokemon:()=>false,$:()=>({value:terrain}),knownHeldItemState:()=>held,abilityMoveTraits:()=>({})};vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function resolveMoveForDamage('),html.indexOf('// Read-only calculation effects:')),ctx);
const resolve=(n,p=20,side='my')=>ctx.resolveMoveForDamage(side,0,'ミュウ',n,{type:'あく',cat:'phys',power:p},side==='my'?'opp':'my',0,'ミュウ');
assert.equal(resolve('つけあがる').power,20);
state.my[0]={atkStage:2,defStage:-6,spaStage:1,spdStage:0,speStage:0,accStage:2,evaStage:1};assert.equal(resolve('つけあがる').power,140);
state.my[0]=Object.fromEntries(keys.map(k=>[k,6]));assert.equal(resolve('つけあがる').power,860);
state.opp[0]=Object.fromEntries(keys.map(k=>[k,-6]));assert.equal(resolve('つけあがる',20,'opp').power,20);
for(const status of ['やけど','どく','もうどく','まひ','ねむり','こおり']){state.opp[0].status=status;assert.equal(resolve('ひゃっきやこう',65).power,130);}
state.opp[0].status='なし';assert.equal(resolve('ひゃっきやこう',65).power,65);ability='ぜったいねむり';assert.equal(resolve('ひゃっきやこう',65).power,130);ability='';
assert.equal(resolve('アイアンローラー',130).power,0);for(terrain of ['グラス','サイコ','エレキ','ミスト'])assert.equal(resolve('アイアンローラー',130).power,130);
held={known:false,item:''};assert.equal(resolve('ポルターガイスト',110).power,0);assert.match(resolve('ポルターガイスト',110).condition,/未確認/);
held={known:true,item:''};assert.equal(resolve('ポルターガイスト',110).power,0);held={known:true,item:'いのちのたま'};assert.equal(resolve('ポルターガイスト',110).power,110);
const before=JSON.stringify(state);resolve('つけあがる');resolve('ひゃっきやこう',65);resolve('アイアンローラー',130);resolve('ポルターガイスト',110);assert.equal(JSON.stringify(state),before);
console.log('PASS four shared conditional damage routes: rank extremes, all statuses, Comatose, four terrains, known/unknown/empty items and read-only evaluation');
