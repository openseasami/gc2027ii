() => {
 const rows=[],oracle=[];
 const lineups=[
  ['ガブリアス','サーフゴー','ドラゴンクロー','シャドーボール','ガオガエン','リキキリン','じしん'],
  ['ゴリランダー','ドラパルト','ウッドハンマー','りゅうのはどう','ガブリアス','アシレーヌ','ねこだまし'],
  ['ペリッパー','ブリジュラス','ウェザーボール','ラスターカノン','ガオガエン','ニンフィア','なみのり'],
  ['アシレーヌ','ウルガモス','ムーンフォース','かえんほうしゃ','ドドゲザン','ガブリアス','ハイパーボイス'],
  ['ニンフィア','ドドゲザン','ムーンフォース','ドゲザン','ドラパルト','ゴリランダー','ハイパーボイス'],
  ['オオニューラ','ガブリアス','インファイト','ドラゴンクロー','ドドゲザン','ペリッパー','いわなだれ']
 ];
 function setup(line){
  state.myTeam=[line[0],line[1],'ミロカロス','ボーマンダ'];state.oppTeam=[line[4],line[5],'サーフゴー','ゴリランダー'];
  state.myActive=[0,1];state.oppActive=[0,1];state.mySelected=state.oppSelected=[0,1,2,3];state.my={};state.opp={};state.seenOpp=[0,1];state.entryFieldUncertainty={};state.magicRoomTurns=0;state.pendingEndTurnReplacements=false;
  REFRESH_MEMO=null;battleTurnNumber=3;state.sideConditions={my:{},opp:{}};
  for(const side of ['my','opp'])for(let i=0;i<4;i++){
   const d=ensureBattleEntry(side,i,state[side+'Team'][i]);Object.assign(d,{hp:i<2?100:0,ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,itemConsumed:false,status:'なし',freshEntry:true,substituteHp:0,actionHistory:[],moves:['たいあたり','まもる']});
   for(const k of BATTLE_STAGE_KEYS)d[k]=0;
  }
  for(let i=0;i<4;i++){savedMyProfiles[i]={nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:'なし'};savedMyMoves[i]=i<2?[line[2+i],'まもる']:['たいあたり'];}
  savedMyMoves[0].push(line[6]);
  for(const id of ['weatherTurns','terrainTurns','trTurns','myTailwind','oppTailwind'])$(id).value='0';$('weather').value=$('terrain').value='なし';
 }
 const observed=()=>JSON.stringify({my:state.my,opp:state.opp,myActive:state.myActive,oppActive:state.oppActive,field:['weather','terrain','trTurns','myTailwind','oppTailwind'].map(id=>$(id).value)});
 const check=(id,ok,evidence)=>rows.push({id,passed:!!ok,evidence});
 const plan=()=>exhaustiveRobustTurnPlans(temporalContext(),leadData('opp')[0],leadData('opp')[0],{});
 function comparison(id,action,target){
  const ai=state.myTeam.indexOf(action.actor),di=target.idx,an=action.actor,dn=target.name;
  const r=damageEstimate(an,action.move,dn,ai,'neutral',di),mv=DAMAGE_MOVES[action.move];
  const aStats={},dStats={};for(const k of ['atk','def','spa','spd','spe']){aStats[k]=calcRealStat(BATTLE_DATA[an][k],savedMyProfiles[ai][k]||0,'まじめ',k);dStats[k]=calcRealStat(BATTLE_DATA[dn][k],0,'まじめ',k);}
  aStats.spe=intrinsicBattleSpeed(an,'my',ai);dStats.spe=intrinsicBattleSpeed(dn,'opp',di);
  const a=simulatedActionEvent(action,'my'),b=simulatedActionEvent({actor:dn,move:'たいあたり'},'opp');
  const orders=[];for(const tr of [false,true]){const old=$('trTurns').value;$('trTurns').value=tr?'5':'0';const events=sortTurnSimulationEvents([a,b]);orders.push(a.priority===b.priority&&a.speed===b.speed?null:events[0]===a?'source':'target');$('trTurns').value=old;}
  oracle.push({id,path:'outgoing',sourceId:NATIONAL_DEX[an].id,targetId:NATIONAL_DEX[dn].id,aa:'runaway',da:'runaway',sourceItem:'',targetItem:'',moveId:NATIONAL_MOVES[action.move].id,
   spread:!!mv.spread,burn:false,screen:state.sideConditions.opp.reflect?'stacked':'',weatherId:{'雨':'raindance','晴れ':'sunnyday','砂':'sandstorm','雪':'snow'}[$('weather').value]||'',terrainId:'',
   aStats,dStats,aHp:calcRealHP(BATTLE_DATA[an].hp,0),dHp:r.hp,aBoosts:{spe:state.my[ai].speStage},dBoosts:{spe:state.opp[di].speStage},aSpeed:fieldSpeed(an,'my',ai),dSpeed:fieldSpeed(dn,'opp',di),
   sourceTW:Number($('myTailwind').value)>0,targetTW:Number($('oppTailwind').value)>0,priority:a.priority,orderNormal:orders[0],orderTR:orders[1],rolls:r.rolls});
  const insight=damageInsightVsTarget(action,target);return insight&&JSON.stringify(insight.rolls)===JSON.stringify(r.rolls);
 }
 for(const [li,line]of lineups.entries())for(const mode of ['full-board','cleanup','trick-room','tailwind','screens','protect-switch']){
  setup(line);const id=`${li+1}/${mode}`;
  if(mode==='cleanup'){state.opp[0].moves=state.opp[1].moves=['たいあたり'];state.opp[0].hp=state.opp[1].hp=1;state.my[0].speStage=state.my[1].speStage=6;}
  if(mode==='trick-room'){$('trTurns').value='3';state.my[0].speStage=state.my[1].speStage=-2;state.opp[0].speStage=state.opp[1].speStage=2;}
  if(mode==='tailwind')$('myTailwind').value='2';
  if(mode==='screens')state.sideConditions.opp={reflect:3,lightScreen:3,auroraVeil:3};
  if(li===2)$('weather').value='雨';if(li===3)$('weather').value='晴れ';
  const before=observed(),p=plan(),actions=p?.best?.actions||[];
  const legal=recommendationPairIsLegal(actions),readonly=observed()===before;
  const damage=comparison(id,{actor:line[0],move:line[2],target:line[4]},leadData('opp')[0]);
  let constraint=true,evidence={actions,score:p?.best?.score,generated:p?.generatedCount,alternatives:p?.alternatives?.map(x=>({actions:x.actions,score:x.score})),scenarios:p?.scenarios?.map(s=>[s.pair.a,s.pair.b].filter(Boolean).map(a=>({actor:a.actor,kind:a.kind,move:a.move}))) };
  if(mode==='cleanup'){
   const covered=new Set(actions.flatMap(a=>actionDamageInsights(a).filter(d=>d.koChance===1).map(d=>d.target)));
   constraint=covered.size===2;evidence.covered=[...covered];
  }
  if(mode==='protect-switch'){
   state.opp[2].hp=100;
   const a={actor:line[0],move:line[2],target:line[4]},pair={a:{actor:line[4],kind:'support',move:'まもる'},b:{actor:line[5],kind:'switch',switchTo:'サーフゴー'}};
   const blocked=scenarioDamageInsights(a,pair);constraint=blocked.length===0;evidence.protectedDamageCount=blocked.length;
  }
  check(id,legal&&readonly&&damage&&constraint,{...evidence,legal,readonly,damage});
 }
 // Critical late-game recommendation regression: one survivor and no replacement.
 setup(lineups[0]);state.my[1].hp=0;state.opp[0].hp=state.opp[1].hp=1;
 const solo=plan();renderMyRecommendations();
 check('last-survivor-has-action',solo?.best?.actions?.length===1&&recommendationPairIsLegal(solo.best.actions)&&!$('myRecommendation').textContent.includes('先発を選択'),{actions:solo?.best?.actions,text:$('myRecommendation').textContent.slice(0,300)});
 setup(lineups[0]);state.opp[1].hp=0;
 const lastFoe=plan();renderOpponentActions();check('one-foe-no-dead-target',lastFoe?.best?.actions?.length===2&&lastFoe.best.actions.every(a=>!a.target||a.target!==lineups[0][5]),lastFoe?.best?.actions);
 setup(lineups[1]);$('terrain').value='サイコ';
 const psychic=plan();check('psychic-terrain-no-fake-out',psychic?.best?.actions?.every(a=>a.move!=='ねこだまし'),psychic?.best?.actions);
 setup(lineups[0]);state.my[1].hp=1;state.opp[0].hp=state.opp[1].hp=1;state.my[0].speStage=state.my[1].speStage=6;
 const ally=plan();check('lethal-ally-spread-avoided',ally?.best&&planAllyDamageRisk(ally.best.actions).penalty===0,ally?.best?.actions);
 setup(lineups[0]);state.opp[0].actionHistory=[{kind:'move',move:'まもる'}];
 const a={actor:lineups[0][0],move:'ドラゴンクロー',target:lineups[0][4]},pair={a:{actor:lineups[0][4],kind:'support',move:'まもる'}};
 check('repeated-protect-remains-uncertain',Math.abs(scenarioHitAvailability(a,pair,leadData('opp')[0])-2/3)<1e-8,null);
 setup(lineups[0]);state.my[0].perishCount=1;state.my[2].hp=100;
 const perish=plan();check('perish-escape-not-protect',perish?.best?.actions?.some(a=>a.actor===lineups[0][0]&&a.kind==='switch'),perish?.best?.actions);
 setup(lineups[0]);state.my[1].hp=0;guide45State={opp1:{hp:false,action:false},opp2:{hp:false,action:false},my1:{hp:false},my2:{hp:false}};
 guide45TurnStartSnapshot={turn:battleTurnNumber,state:JSON.parse(JSON.stringify(state)),field:{}};
 check('old-ko-slot-needs-no-repeat-input',guideStepDone('my2')&&!guideStepDone('my1'),null);
 state.my[0].hp=0;check('new-ko-still-needs-action-observation',!guideStepDone('my1'),null);
 for(const weight of [.01,.1,.5]){
  const old=robustTurnAggregate([0,0],[weight,1-weight]).score;
  const improved=robustTurnAggregate([10,0],[weight,1-weight]).score;
  check('better-scenario-never-lowers-rank-'+weight,improved>=old,{old,improved});
 }
 state.myTeam=[];state.oppTeam=[];check('empty-battle-never-completes-guide',!guide45InputsComplete(),null);
 return {checks:rows,oracle};
}
