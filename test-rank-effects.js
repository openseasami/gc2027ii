const assert=require('node:assert/strict'),rank=require('./rank-effects.js');
function run(input){const target={...(input.stages||{})},source=input.sourceStages?{...input.sourceStages}:null;const result=rank.resolve(input);rank.apply(result,target,source);return {target,source,result};}
let checks=0;
function check(input,expected){const got=run(input);for(const [key,value]of Object.entries(expected))assert.deepEqual(got[key],value);checks++;return got;}
check({changes:{atkStage:-1},ability:'あまのじゃく'},{target:{atkStage:1}});
check({changes:{atkStage:-1},ability:'たんじゅん'},{target:{atkStage:-2}});
for(const ability of ['クリアボディ','しろいけむり'])check({changes:{atkStage:-1,spdStage:-2},ability},{target:{}});
for(const [ability,key] of [['かいりきバサミ','atkStage'],['はとむね','defStage'],['するどいめ','accStage']]){
 check({changes:{[key]:-2,spaStage:-1},ability},{target:{spaStage:-1}});
 check({changes:{[key]:-2},ability,origin:'self'},{target:{[key]:-2}});
 check({changes:{[key]:-2},ability,bypass:true},{target:{[key]:-2}});
}
check({changes:{atkStage:-1},item:'クリアチャーム',bypass:true},{target:{}});
check({changes:{atkStage:-1},item:'クリアチャーム',origin:'self'},{target:{atkStage:-1}});
check({changes:{atkStage:-1},ability:'あまのじゃく',item:'クリアチャーム'},{target:{atkStage:1}});
check({changes:{atkStage:-1},ability:'まけんき'},{target:{atkStage:1}});
check({changes:{atkStage:-1,defStage:-1},ability:'まけんき'},{target:{atkStage:3,defStage:-1}});
check({changes:{atkStage:-1},ability:'かちき'},{target:{atkStage:-1,spaStage:2}});
check({changes:{atkStage:-1},stages:{atkStage:-6},ability:'まけんき'},{target:{atkStage:-6}});
check({changes:{atkStage:-1},ability:'まけんき',origin:'ally'},{target:{atkStage:-1}});
check({changes:{atkStage:-1},intimidate:true,ability:'ばんけん'},{target:{atkStage:1}});
for(const ability of ['せいしんりょく','どんかん','きもったま','マイペース'])check({changes:{atkStage:-1},intimidate:true,ability},{target:{}});
check({changes:{atkStage:-1},intimidate:true,ability:'びびり'},{target:{atkStage:-1,speStage:1}});
for(const item of ['おんみつマント'])check({changes:{spdStage:-2},secondary:true,item,bypass:true},{target:{}});
check({changes:{spdStage:-2},secondary:true,ability:'りんぷん'},{target:{}});
check({changes:{spdStage:-2},secondary:true,ability:'りんぷん',bypass:true},{target:{spdStage:-2}});
check({changes:{atkStage:-1},ability:'ミラーアーマー',sourceStages:{},sourceAbility:'まけんき'},{target:{},source:{atkStage:1}});
check({changes:{atkStage:-1},ability:'ミラーアーマー',sourceStages:{},sourceAbility:'ミラーアーマー'},{target:{},source:{atkStage:-1}});
check({changes:{atkStage:-1},ability:'ミラーアーマー',stages:{atkStage:-6},sourceStages:{}},{target:{atkStage:-6},source:{}});
for(const input of [{ability:null},{item:null}])assert.equal(run({changes:{atkStage:-1},...input}).result.unknown,true);
assert.throws(()=>rank.resolve({changes:{hp:-1}}),/Invalid/);
assert.throws(()=>rank.resolve({origin:'guessed'}),/Unknown/);
console.log(`PASS ${checks} source-aware rank rules plus unknown/invalid guards`);
