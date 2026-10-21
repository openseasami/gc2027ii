const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync(__dirname+'/index.html','utf8');
const begin=src.indexOf('const COMMON_STATUS_SECONDARIES='),end=src.indexOf('function planCommonSecondaryForecast(',begin);
assert.ok(begin>0&&end>begin);
const context={};vm.createContext(context);vm.runInContext(src.slice(begin,end)+'\nthis.forecast=forecastCommonSecondaryStatus;',context);
const fn=context.forecast;let n=0;
function eq(actual,expected){if(typeof actual==='number'&&typeof expected==='number')assert.ok(Math.abs(actual-expected)<1e-10);else assert.equal(actual,expected);n++}
function test(move,accuracy,status,types,ability,item,bypass,attacker){return fn(move,accuracy,status,types,ability,item,bypass,attacker)}
eq(test('10まんボルト',.8,'',[]).probability,.08);
eq(test('かえんほうしゃ',1,'',[]).probability,.1);
eq(test('ヘドロばくだん',1,'',[]).probability,.3);
eq(test('かみなり',1,'',[]).probability,.3);
eq(test('れいとうビーム',1,'',[]).status,'こおり');
eq(test('10まんボルト',1,'',['でんき']).probability,0);
eq(test('かえんほうしゃ',1,'',['ほのお']).probability,0);
eq(test('ヘドロばくだん',1,'',['はがね']).probability,0);
eq(test('10まんボルト',1,'まひ',[]).probability,0);
eq(test('10まんボルト',1,'',[],'じゅうなん').probability,0);
eq(test('10まんボルト',1,'',[],'じゅうなん','',true).probability,.1);
eq(test('かえんほうしゃ',1,'',[],'','おんみつマント',true).probability,0);
eq(test('かえんほうしゃ',1,'',[],'','',false,'ちからずく').probability,0);
eq(test('みずでっぽう',1,'',[]),null);
eq(test('かえんほうしゃ',0,'',[]).probability,0);
eq(test('かえんほうしゃ',100,'',[]).probability,.1);
assert.ok(src.includes('score+=planCommonSecondaryForecast(actions,forcedOppPair).bonus'));n++;
assert.ok(src.includes('...secondaries.notes.slice(0,1)'));n++;
console.log(`${n} common secondary forecast checks passed`);
