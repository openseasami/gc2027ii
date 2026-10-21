const assert=require('node:assert/strict');
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const src=html.slice(html.indexOf('function applyObservedMoveEffects('),html.indexOf('function applyObservedMoveEffects(')+4800);
assert.match(src,/registryBoosts/);
assert.match(src,/effect.kind==='multi_boost'/);
assert.match(src,/else if\(SELF_SETUP_BOOSTS\[move\]\)/);
const engine=require('./effect-engine.js');
for(const [move,expected] of Object.entries({
 'つるぎのまい':{atkStage:2},'てっぺき':{defStage:2},'こうそくいどう':{speStage:2},
 'めいそう':{spaStage:1,spdStage:1},'りゅうのまい':{atkStage:1,speStage:1},
 'ビルドアップ':{atkStage:1,defStage:1},'わるだくみ':{spaStage:2}
})){
 let boosts={};
 for(const effect of engine.evaluate('on_move_used',{move,succeeded:true}).events){
  if(effect.target!=='self')continue;
  if(effect.kind==='stat_boost')boosts[effect.stat+'Stage']=(boosts[effect.stat+'Stage']||0)+effect.stages;
  if(effect.kind==='multi_boost')for(const [stat,stages] of Object.entries(effect.stats))boosts[stat+'Stage']=(boosts[stat+'Stage']||0)+stages;
 }
 assert.deepEqual(boosts,expected,move);
}
console.log('Integrated registered self boosts: PASS');
