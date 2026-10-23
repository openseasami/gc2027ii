// In-page observed-match replay. HP/status/secondary effects are observations,
// never claimed as automatically simulated by this support application.
() => {
 const stages={atk:'atkStage',def:'defStage',spa:'spaStage',spd:'spdStage',spe:'speStage',accuracy:'accStage',evasion:'evaStage'};
 const status={'':'なし',fnt:'なし',brn:'やけど',par:'まひ',slp:'ねむり',psn:'どく',tox:'どく',frz:'こおり'};
 const weatherIds={'雨':'raindance','晴れ':'sunnyday','砂':'sandstorm','雪':'snow'},terrainIds={'グラス':'grassyterrain','エレキ':'electricterrain','サイコ':'psychicterrain','ミスト':'mistyterrain'};
 const errors=[],oracle=[],counts={turns:0,fieldAssertions:0,stageAssertions:0,hpAssertions:0,speedAssertions:0,recommendations:0,forcedReplacements:0,observedStatus:0,observedItemConsumption:0,observedSecondaryRanks:0};
 let current;
 const assert=(ok,msg,detail)=>{if(!ok)throw Error(msg+' '+JSON.stringify(detail));};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function core(){return {turn:battleTurnNumber,field:Object.fromEntries(TURN_COMMIT_FIELD_IDS.map(id=>[id,$(id).value])),state:clone(state)};}
 function stable(){const s=core();delete s.state.lastRecommendationDiagnostic;delete s.state.entryOrderJournal;return s;}
 function compare(ref,where,terminal=false){
  assert(battleTurnNumber===ref.turn,where+' turn',[battleTurnNumber,ref.turn]);
  for(const [k,v]of Object.entries(terminal?{}:ref.field)){counts.fieldAssertions++;assert(String($(k).value)===String(v),where+' field '+k,[$(k).value,v]);}
  ref.sides.forEach((s,si)=>{const side=si?'opp':'my';assert(JSON.stringify(state[side+'Active'])===JSON.stringify(s.active),where+' active '+side,[state[side+'Active'],s.active]);
   for(const p of s.mons){const d=state[side][p.idx];counts.hpAssertions++;assert(Math.abs(d.hp-p.hp/p.maxhp*100)<1e-8,where+' HP '+side+p.idx,[d.hp,p.hp,p.maxhp]);
    assert(d.itemConsumed===!Boolean(p.item),where+' item consumed '+side+p.idx,[d.itemConsumed,p.item]);
    assert(d.status===status[p.status],where+' status '+side+p.idx,[d.status,p.status]);
    if(p.hp>0&&!terminal){for(const [key,field]of Object.entries(stages)){counts.stageAssertions++;assert((d[field]||0)===p.boosts[key],where+' stage '+side+p.idx+' '+key,[d[field],p.boosts[key]]);}}
    if(p.hp===0)assert(!manualSwitchCandidateIndices(side).includes(p.idx),where+' fainted bench resurrected',p.idx);
   }
  });
 }
 function initialize(game){current=game;savedMyTeam=game.my.map(c=>c.name);savedMyMoves=game.my.map(c=>[...c.moves]);savedMyProfiles=Object.fromEntries(game.my.map((c,i)=>[i,{nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:c.jaItem,ability:c.jaAbility}]));
  game.opp.forEach((c,i)=>$('opp'+i).value=c.name);myPickOrder=[...game.selected[0]];renderMyPickButtons();
  populateOpponentLeadSelectors(['oppLead0','oppLead1'],game.opp.map(c=>c.name));$('oppLead0').value=String(game.selected[1][0]);$('oppLead1').value=String(game.selected[1][1]);
  assert(startMatch()===true,'start match',$('registerStatus').textContent);
  // All abilities/items in these laboratory fixtures are explicitly known.
  for(const [si,side]of ['my','opp'].entries())for(let i=0;i<6;i++){
   const c=game[side][i],d=state[side][i];Object.assign(d,{hp:100,item:c.jaItem,itemConfirmed:true,itemConsumed:false,ability:c.jaAbility,abilityConfirmed:true,moves:[...c.moves],confirmedMoves:[true,true,true,true],status:'なし',pendingPostTurnEntry:false,unburdenActive:false});for(const k of Object.values(stages))d[k]=0;
  }
  state.entryOrderJournal={};state.entryOrderCursor=0;state.entryFieldUncertainty={};
  for(const id of TURN_COMMIT_FIELD_IDS)$(id).value=['weather','terrain'].includes(id)?'なし':'0';
  REFRESH_MEMO=null;resolveEntryEvents(['my','opp'].flatMap(side=>state[side+'Active'].map(idx=>({side,idx,name:state[side+'Team'][idx]}))));
  snapshotTurnStartActives();state.turnRecordStart=turnRecordSnapshot();renderCards();refresh();resetGuide45Turn();compare(game.initial,'initial '+game.id);return stable();
 }
 function preview(turn){
  REFRESH_MEMO=null;
  const mine=leadData('my'),foes=leadData('opp');
  if(!mine.length||!foes.length)return;
  for(const [si,side]of ['my','opp'].entries())for(const p of turn.before.sides[si].mons.filter(p=>p.hp>0&&turn.before.sides[si].active.includes(p.idx))){
   counts.speedAssertions++;assert(fieldSpeed(state[side+'Team'][p.idx],side,p.idx)===p.speed,'speed '+current.id+'/'+turn.number+'/'+side+p.idx,[fieldSpeed(state[side+'Team'][p.idx],side,p.idx),p.speed]);
  }
  const before=stable(),p=exhaustiveRobustTurnPlans(temporalContext(),foes[0],foes[0],{});
  assert(p?.best?.actions?.length===mine.length,'recommendation disappears',p?.best);assert(recommendationPairIsLegal(p.best.actions),'illegal recommendation',p.best.actions);
  for(const a of p.best.actions){const ti=state.oppTeam.indexOf(a.target);if(ti>=0)assert(state.opp[ti].hp>0&&state.oppActive.includes(ti),'KO/inactive target',a);}
  assert(JSON.stringify(stable())===JSON.stringify(before),'recommendation mutates observations',null);counts.recommendations++;
  assert($('myRecommendation').getAttribute('data-prediction-verified')==='false','recommendation certainty',null);
  const a=mine[0],d=foes[0],mv=(savedMyMoves[a.idx]||[]).find(n=>DAMAGE_MOVES[n]&&!DAMAGE_MOVES[n].spread&&DAMAGE_MOVES[n].power>0);if(!mv)return;
  const r=damageEstimate(a.name,mv,d.name,a.idx,'neutral',d.idx);if(!r?.rolls?.length)return;
  const am=turn.before.sides[0].mons.find(p=>p.idx===a.idx),dm=turn.before.sides[1].mons.find(p=>p.idx===d.idx),ac=simulatedActionEvent({actor:a.name,move:mv},'my'),dc=simulatedActionEvent({actor:d.name,move:'たいあたり'},'opp');
  const orders=[];for(const tr of [false,true]){const old=$('trTurns').value;$('trTurns').value=tr?'5':'0';const sorted=sortTurnSimulationEvents([ac,dc]);orders.push(ac.priority===dc.priority&&ac.speed===dc.speed?null:sorted[0]===ac?'source':'target');$('trTurns').value=old;}
  const effectiveItem=(side,idx)=>REGULATION_MC.items.find(x=>x.name===heldItemFor(side,idx))?.id||'';
  oracle.push({id:current.id+'/'+turn.number,path:'native-match-start-board',sourceId:NATIONAL_DEX[a.name].id,targetId:NATIONAL_DEX[d.name].id,aa:am.ability,da:dm.ability,sourceItem:effectiveItem('my',a.idx),targetItem:effectiveItem('opp',d.idx),moveId:NATIONAL_MOVES[mv].id,spread:false,burn:am.status==='brn',sourceStatus:am.status,targetStatus:dm.status,screen:'',weatherId:weatherIds[turn.before.field.weather]||'',terrainId:terrainIds[turn.before.field.terrain]||'',aStats:am.stats,dStats:dm.stats,aHp:am.maxhp,dHp:dm.maxhp,aBoosts:am.boosts,dBoosts:dm.boosts,aSpeed:fieldSpeed(a.name,'my',a.idx),dSpeed:fieldSpeed(d.name,'opp',d.idx),sourceTW:turn.before.field.myTailwind>0,targetTW:turn.before.field.oppTailwind>0,priority:ac.priority,orderNormal:orders[0],orderTR:orders[1],rolls:r.rolls.length===1&&r.rolls[0]===0?Array(16).fill(0):r.rolls});
 }
 function observe(turn){
  assert(battleTurnNumber===turn.number,'turn input',battleTurnNumber);
  // Record the submitted action; absence from the native move log means it never executed.
  ['my','opp'].forEach((side,si)=>{
   const before=turn.before.sides[si],after=turn.after.sides[si];
   before.active.forEach((idx,slot)=>{if(idx==null||!before.mons.find(p=>p.idx===idx)?.hp)return;
    const action=turn.inputs[si].split(',')[slot].trim(),name=state[side+'Team'][idx];
    if(action.startsWith('switch')){const into=after.active[slot];assert(recordSwitchForSlot(side,slot,into),'record switch',[side,slot,into]);}
    else {const mon=before.mons.find(p=>p.idx===idx),moveIndex=Number(action.split(' ')[1])-1,id=mon.moves[moveIndex],move=Object.keys(NATIONAL_MOVES).find(n=>NATIONAL_MOVES[n].id===id);
     assert(move,'move lookup',action);setCurrentTurnMove(side,idx,name,move);
     const prefix='|move|p'+(si+1)+'ab'[slot]+': '+(si?'o':'m')+idx+'|';
     const executed=turn.log.find(l=>l.startsWith(prefix));
     const failed=!executed||turn.log.some((l,j)=>l.startsWith('|-fail|p'+(si+1)+'ab'[slot]+': '+(si?'o':'m')+idx)&&turn.log.slice(0,j).reverse().find(x=>x.startsWith('|move|'))===executed);
     if(failed)setCurrentTurnMoveFailed(side,idx,name,true);
    }
   });
   // HP/status and non-seed consumptions are explicit observations, including residuals.
   for(const p of after.mons){const d=state[side][p.idx];setObservedBattleHp(side,p.idx,p.hp/p.maxhp*100);if(d.status!==status[p.status])counts.observedStatus++;d.status=status[p.status];
    const c=current[side][p.idx];if(!p.item&&!['グラスシード','しろいハーブ'].includes(c.jaItem)&&!d.itemConsumed){d.itemConsumed=true;counts.observedItemConsumption++;}
   }
  });
  // Confirm native secondary rank / reactive hit events as observations. Setup,
  // Intimidate, seeds and Speed Boost remain automatic and are checked separately.
  let observedRankApplied=false;
  const observeRanks=()=>{let lastMove=null;
  for(const line of turn.log){if(line==='|'||line.startsWith('|switch|'))lastMove=null;if(line.startsWith('|move|'))lastMove=line.split('|')[3];
   const m=line.match(/^\|-(boost|unboost)\|p([12])[ab]: ([mo])(\d+)\|(\w+)\|(\d+)(.*)$/);if(!m)continue;
   const id=lastMove?.toLowerCase().replace(/[^a-z0-9]/g,''),definition=Object.values(NATIONAL_MOVES).find(v=>v.id===id);
   if(m[7].includes('Stamina')||m[7].includes('Weak Armor')||(!m[7]&&definition&&definition.cat!=='status'&&definition.cat!=='変化')){
    // Ignore primary self-boost moves (their local metadata category is status).
    if(['swordsdance','calmmind','nastyplot','coil'].includes(id))continue;
    const side=m[2]==='1'?'my':'opp',idx=Number(m[4]),key=stages[m[5]];if(key){const d=state[side][idx];d[key]=Math.max(-6,Math.min(6,(d[key]||0)+(m[1]==='boost'?1:-1)*Number(m[6])));counts.observedSecondaryRanks++;observedRankApplied=true;}
   }
  }
  };
  // Commit through the production turn transaction with the guide cursor held.
  guide45State={opp1:{hp:true,action:true},opp2:{hp:true,action:true},my1:{hp:true},my2:{hp:true}};
  guide45TurnFinalized=true;guide45LastCommittedSnapshot=clone(guide45TurnStartSnapshot);
  finalizeTurnState();
  // Observed secondary ranks belong to the incoming occupant after switch reset,
  // not to its earlier stay on the bench. These are not inferred by the engine.
  observeRanks();
  // Native winner can be declared before the last residual phase. No fictional
  // end-of-turn oracle is asserted for that terminal partial turn.
  compare({...turn.after,turn:turn.number+1},'after '+current.id+'/'+turn.number,turn.number===current.turns.length);
  for(const forced of turn.forced){state.pendingEndTurnReplacements=true;for(const [si,side]of ['my','opp'].entries())forced.after.sides[si].active.forEach((idx,slot)=>{if(idx!==state[side+'Active'][slot]){assert(recordForcedReplacement(side,slot,idx),'forced replacement',[side,slot,idx]);counts.forcedReplacements++;}});finishPostPerishReplacements();}
  // Automatic entry events after replacements are compared as well.
  compare({...turn.next,turn:turn.number+1},'next '+current.id+'/'+turn.number,turn.number===current.turns.length);
  snapshotTurnStartActives();state.turnRecordStart=turnRecordSnapshot();if(turn.forced.length||observedRankApplied){renderCards();refresh();}save();captureGuide45TurnStart();
  counts.turns++;return stable();
 }
 window.SeriesMatch={initialize,preview,observe,compare,stable,oracle,counts,setCurrent:g=>{current=g},reset:()=>resetGuide45Turn()};return true;
}
