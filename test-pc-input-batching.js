// Exercise production input transaction orchestration, not a duplicated engine.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const source=html.slice(html.indexOf('function applyFixed45Input('),html.indexOf('function renderPcLiveRecommendation('));
const calls=[],state={turnHpInputs:{my2:true}},guide45State={opp1:{hp:false,action:false},my1:{hp:false}};
const c={state,guide45State,battleTurnNumber:7,renderCards:()=>calls.push('cards'),refresh:()=>calls.push('refresh'),save:()=>calls.push('save')};
c.updateGuide45=render=>{assert.equal(render,false);calls.push('guide');};
vm.createContext(c);vm.runInContext(source,c);
c.applyFixed45Input('my1',['hp'],true);
assert.equal(guide45State.my1.hp,true);assert.equal(guide45State.opp1.hp,false);
assert.deepEqual(JSON.parse(JSON.stringify(state.turnHpInputs)),{my2:true,my1:true});assert.deepEqual(calls,['guide','cards','refresh','save']);
calls.length=0;
c.updateGuide45=()=>{assert.equal(guide45State.opp1.hp,true);assert.equal(guide45State.opp1.action,true);calls.push('atomic-ko');c.battleTurnNumber++;};
c.applyFixed45Input('opp1',['hp','action'],true);
assert.deepEqual(calls,['atomic-ko'],'committed turn has already rendered/saved; never refresh or commit twice');
calls.length=0;c.updateGuide45=()=>{throw Error('transaction failure');};
assert.throws(()=>c.applyFixed45Input('my1',['hp']),/transaction failure/);
assert.deepEqual(calls,[],'do not persist after failed transactional finalization');
console.log('PASS production PC input batching: correct side, atomic KO flags, one update/save, no duplicate turn rendering, failure propagation');
