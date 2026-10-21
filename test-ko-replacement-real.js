#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
function extract(start,end){const i=html.indexOf(start),j=html.indexOf(end,i+start.length);assert(i>=0&&j>i,start);return html.slice(i,j)}
const code=extract('function pendingSwitchDestinations(side,excludeOriginIdx=null){','function applyPostTurnEntries(){')+extract('function pendingKOReplacements(){','function fixed45CurrentEntry(){');
const state={myTeam:['M0','M1','M2'],oppTeam:['O0','O1','O2'],myActive:[0],oppActive:[0],my:[{hp:0},{hp:100},{hp:100}],opp:[{hp:0},{hp:100},{hp:100}],pendingEndTurnReplacements:true};
const entry=[];const ctx={state,Set,Error,manualSwitchCandidateIndices:side=>[1,2].filter(i=>!(state[side+'Active']||[]).includes(i)),ensureBattleEntry:(s,i)=>state[s][i],finishPostPerishReplacements:()=>{entry.push('finish')},SWITCHING_MOVES:new Set([])};
vm.createContext(ctx);vm.runInContext(code,ctx);
let n=0;const eq=(actual,expected,msg)=>{assert.equal(actual,expected,msg);n++};
eq(ctx.pendingKOReplacements().length,2,'both KO');eq(ctx.nextKOReplacement().side,'opp','opponent goes first');
eq(ctx.recordForcedReplacement('opp',0,1),true,'opponent replacement');eq(state.oppActive[0],1,'opponent active');eq(state.opp[1].pendingPostTurnEntry,true,'defer ability');
eq(ctx.nextKOReplacement().side,'my','own replacement follows');eq(ctx.recordForcedReplacement('my',0,1),true,'own replacement');eq(state.myActive[0],1,'own active');eq(state.my[1].pendingPostTurnEntry,true,'own ability deferred');
eq(ctx.hasPendingKOReplacement(),false,'no more pending KO');eq(ctx.recordForcedReplacement('my',0,2),false,'healthy actor cannot force replace');
// A reserved bench target cannot be used twice by a pending switch.
state.my[2].currentTurnAction={kind:'switch',to:'M1'};state.myActive=[0];state.my[0].hp=0;
eq(ctx.recordForcedReplacement('my',0,1),false,'reserved incoming slot rejected');
console.log(`${n} actual forced-KO replacement assertions passed`);
