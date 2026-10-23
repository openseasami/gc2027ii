// Complete seeded native Showdown matches. Custom 6 -> 4 fixtures, not official event rules.
const fs=require('node:fs'),ps=require(require.resolve('pokemon-showdown',{paths:[__dirname,__dirname+'/work/oracle']}));
const text=fs.readFileSync(__dirname+'/index.html','utf8'),literal=n=>JSON.parse(text.match(new RegExp('const '+n+'\\s*=\\s*(.+?);\\s*(?:\\n|$)'))[1]);
const dex=literal('NATIONAL_DEX'),moves=literal('NATIONAL_MOVES'),reg=literal('REGULATION_MC');
const names=Object.fromEntries(Object.entries(moves).map(([n,v])=>[v.id,n]));
const configs=[
 ['ペリッパー','Drizzle','あめふらし','Damp Rock','しめったいわ',['ウェザーボール','エアスラッシュ','おいかぜ','まもる']],
 ['ブリジュラス','Stamina','じきゅうりょく','White Herb','しろいハーブ',['りゅうのはどう','ラスターカノン','10まんボルト','まもる']],
 ['バシャーモ','Speed Boost','かそく','Focus Sash','きあいのタスキ',['ほのおのパンチ','かわらわり','つるぎのまい','まもる']],
 ['リキキリン','Armor Tail','テイルアーマー','Leftovers','たべのこし',['サイコキネシス','ハイパーボイス','トリックルーム','めいそう']],
 ['ゴリランダー','Grassy Surge','グラスメイカー','Life Orb','いのちのたま',['ウッドハンマー','ドレインパンチ','つるぎのまい','まもる']],
 ['エルフーン','Prankster','いたずらごころ','Grassy Seed','グラスシード',['エナジーボール','ムーンフォース','おいかぜ','グラスフィールド']],
 ['ガオガエン','Intimidate','いかく','Sitrus Berry','オボンのみ',['かえんほうしゃ','DDラリアット','おにび','まもる']],
 ['ミロカロス','Competitive','かちき','Rindo Berry','リンドのみ',['なみのり','りゅうのはどう','とぐろをまく','まもる']],
 ['ガブリアス','Sand Veil','すながくれ','Lum Berry','ラムのみ',['じしん','ドラゴンクロー','つるぎのまい','まもる']],
 ['サーフゴー','Good as Gold','おうごんのからだ','Metal Coat','メタルコート',['シャドーボール','ラスターカノン','わるだくみ','まもる']],
 ['ドラパルト','Clear Body','クリアボディ','Spell Tag','のろいのおふだ',['りゅうのはどう','シャドーボール','でんじは','まもる']],
 ['ドドゲザン','Defiant','まけんき','Black Glasses','くろいメガネ',['ドゲザン','アイアンヘッド','つるぎのまい','まもる']]
].map(([name,ability,jaAbility,item,jaItem,ms],i)=>{
 if(!dex[name])throw Error(name);for(const m of ms)if(!moves[m]||!dex[name].moves.includes(m))throw Error(name+' '+m);
 if(!reg.items.some(x=>x.name===jaItem))throw Error(jaItem);
 const physical=['バシャーモ','ゴリランダー','ガブリアス','ドドゲザン'].includes(name);
 return {name,id:dex[name].id,ability,jaAbility,item,jaItem,moves:ms,physical};
});
const families=[{name:'rain-tailwind',my:[0,1,2,3],opp:[0,1,2,3]},{name:'terrain-seed',my:[4,5,2,3],opp:[2,4,0,5]},{name:'room-boost',my:[3,2,0,4],opp:[5,3,1,4]}];
function team(cs,side){return cs.map((c,i)=>({name:(side?'o':'m')+i,species:c.id,ability:c.ability,item:c.item,level:50,nature:side?(c.physical?'Jolly':'Timid'):'Serious',evs:side?{[c.physical?'atk':'spa']:252,spe:252}:{},moves:c.moves.map(n=>moves[n].id)}));}
const weather={raindance:'雨',sunnyday:'晴れ',sandstorm:'砂',snow:'雪'},terrain={grassyterrain:'グラス',electricterrain:'エレキ',psychicterrain:'サイコ',mistyterrain:'ミスト'};
function snap(b){return {turn:b.turn,field:{weather:weather[b.field.weather]||'なし',weatherTurns:b.field.weather?b.field.weatherState.duration||0:0,terrain:terrain[b.field.terrain]||'なし',terrainTurns:b.field.terrain?b.field.terrainState.duration||0:0,trTurns:b.field.pseudoWeather.trickroom?.duration||0,myTailwind:b.p1.sideConditions.tailwind?.duration||0,oppTailwind:b.p2.sideConditions.tailwind?.duration||0},sides:b.sides.map(s=>({active:s.active.map(p=>p?Number(p.name.slice(1)):null),mons:s.pokemon.map(p=>({idx:Number(p.name.slice(1)),hp:p.hp,maxhp:p.maxhp,status:p.status,boosts:{...p.boosts},item:p.item,ability:p.ability,stats:{...p.storedStats},speed:p.getStat('spe'),moves:p.moveSlots.map(x=>x.id)})).sort((a,b)=>a.idx-b.idx)}))};}
function choices(b,side,game){const s=b.sides[side],r=s.activeRequest;if(!r||r.wait)return '';const available=s.pokemon.filter(p=>!p.fainted&&!p.isActive);if(r.forceSwitch){return r.forceSwitch.map(force=>force&&available.length?'switch '+(s.pokemon.indexOf(available.shift())+1):'pass').join(', ');}
 return r.active.map((req,slot)=>{const p=s.active[slot];if(p.fainted)return 'pass';
 if(b.turn===3&&slot===0&&available.length){const into=available.shift();return 'switch '+(s.pokemon.indexOf(into)+1);}
 const legal=req.moves.map((m,i)=>({...m,i})).filter(m=>!m.disabled&&m.pp>0);let chosen;
 if(b.turn===1)chosen=legal.find(m=>['tailwind','trickroom','grassyterrain','willowisp','thunderwave'].includes(m.id));
 if(b.turn===2)chosen=legal.find(m=>['swordsdance','calmmind','nastyplot','coil'].includes(m.id));
 if(b.turn===4&&slot===1&&game%2===0)chosen=legal.find(m=>m.id==='protect');
 if(!chosen){const attack=legal.filter(m=>b.dex.moves.get(m.id).category!=='Status');chosen=attack[(game+b.turn+slot+side)%attack.length]||legal[0];}
 if(!chosen)return 'move struggle';const target=['normal','adjacentFoe','any'].includes(chosen.target)?' '+((game+b.turn+slot)%2+1):'';
 return 'move '+(chosen.i+1)+target;
 }).join(', ');}
function run(game){const family=families[game%3],my=configs.slice(0,6),opp=configs.slice(6),b=new ps.Battle({formatid:'gen9doublescustomgame',seed:[game+1,game*13+17,29,101]});b.ruleTable.pickedTeamSize=4;
 try{b.setPlayer('p1',{name:'my',team:team(my,0)});b.setPlayer('p2',{name:'opp',team:team(opp,1)});const select=(arr,offset)=>arr.map(i=>(i+offset)%6);const a=select(family.my,0),d=select(family.opp,0);b.makeChoices('team '+a.map(i=>i+1).join(''),'team '+d.map(i=>i+1).join(''));
 const result={id:game+1,family:family.name,seed:[game+1,game*13+17,29,101],my,opp,selected:[a,d],initial:snap(b),turns:[]};
 while(!b.ended&&b.turn<=45){if(b.requestState!=='move')throw Error('Unexpected request '+b.requestState);const before=snap(b),start=b.log.length,inputs=[choices(b,0,game),choices(b,1,game)];let preResidual=null;
 const original=b.fieldEvent;b.fieldEvent=function(id,...args){if(id==='Residual')preResidual=snap(b);return original.call(this,id,...args);};
 b.makeChoices(...inputs);b.fieldEvent=original;if(b.sides.some(s=>s.choice.error))throw Error(JSON.stringify(b.sides.map(s=>s.choice.error)));
 const after=snap(b),forced=[];
 while(!b.ended&&b.requestState==='switch'){const pre=snap(b),cs=[choices(b,0,game),choices(b,1,game)];try{b.makeChoices(...cs);}catch(e){throw Error(JSON.stringify({game,cs,requests:b.sides.map(s=>s.activeRequest),errors:b.sides.map(s=>s.choice.error)}));}forced.push({before:pre,inputs:cs,after:snap(b)});}
 result.turns.push({number:before.turn,before,inputs,log:b.log.slice(start).filter(l=>!l.startsWith('|t:|')),preResidual,after,forced,next:snap(b)});
 }
 if(!b.ended)throw Error('Unfinished game '+game);result.winner=b.winner;result.final=snap(b);result.complete=true;return result;
 }finally{b.destroy();}}
const group=Number(process.argv[2]||0);const games=Array.from({length:10},(_,i)=>run(group*10+i));process.stdout.write(JSON.stringify({completion:false,oracle:'pokemon-showdown@0.11.10',format:'gen9doublescustomgame with explicit pickedTeamSize=4',games}));
