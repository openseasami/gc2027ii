"""All 18 already-registered resist berries through actual outgoing/incoming adapters."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,scope='Controlled actual-page damage adapters; independent full berry callbacks in ALL_RESIST_BERRY_RESULTS.json. No legality certification.')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page()
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  checks=page.evaluate('''() => {
   const fixtures=[['ホズのみ','たいあたり','イーブイ'],['オッカのみ','かえんほうしゃ','ユキノオー'],
    ['イトケのみ','なみのり','リザードン'],['ソクノのみ','10まんボルト','ギャラドス'],
    ['リンドのみ','エナジーボール','ラグラージ'],['ヤチェのみ','れいとうビーム','ガブリアス'],
    ['ヨプのみ','インファイト','バンギラス'],['ビアーのみ','ヘドロばくだん','エルフーン'],
    ['シュカのみ','じしん','ジバコイル'],['バコウのみ','エアスラッシュ','キノガッサ'],
    ['ウタンのみ','サイコキネシス','ドクロッグ'],['タンガのみ','むしのさざめき','カラマネロ'],
    ['ヨロギのみ','パワージェム','ウルガモス'],['カシブのみ','シャドーボール','ミュウ'],
    ['ハバンのみ','りゅうのはどう','ガブリアス'],['ナモのみ','あくのはどう','フーディン'],
    ['リリバのみ','ラスターカノン','キュウコン(アローラのすがた)'],['ロゼルのみ','ムーンフォース','サザンドラ']];
   const checks=[];
   for(const [item,move,target]of fixtures)for(const side of ['my','opp']){
    const other=side==='my'?'opp':'my',actor='ミュウ';state[side+'Team']=[actor,'イーブイ'];state[other+'Team']=[target,'イーブイ'];state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};state.magicRoomTurns=0;state.entryFieldUncertainty=null;
    for(const s of ['my','opp'])for(let i=0;i<2;i++){
     const d=ensureBattleEntry(s,i,state[s+'Team'][i]);Object.assign(d,{hp:100,item:'なし',itemConfirmed:true,itemConsumed:false,ability:'なし',abilityConfirmed:true,status:'なし',bulk:'neutral'});for(const k of BATTLE_STAGE_KEYS)d[k]=0;
    }
    savedMyProfiles[0]={nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:side==='opp'?item:'なし'};savedMyProfiles[1]={nature:'まじめ',item:'なし'};
    state[other][0].item=item;$('weather').value=$('terrain').value='なし';$('myTailwind').value=$('oppTailwind').value=$('trTurns').value='0';state.sideConditions={my:{},opp:{}};
    const calc=()=>side==='my'?damageEstimate(actor,move,target,0,'neutral',0):opponentDamageEstimateAgainstMy({kind:'attack',actor,move},{name:target,idx:0,d:state.my[0]});
    const active=calc();if(!active.berry?.consume||active.berry.factor!==.5)throw Error('Berry not active '+item+'/'+side);
    if(state[other][0].itemConsumed)throw Error('Read-only forecast consumed real berry');
    state[other][0].itemConsumed=true;const consumed=calc();state[other][0].itemConsumed=false;
    if(consumed.berry?.consume||Math.max(...active.rolls)>=Math.max(...consumed.rolls))throw Error('Wrong consumed damage '+item);
    state[side][0].ability='きんちょうかん';const blocked=calc();state[side][0].ability='なし';
    if(blocked.berry.consume||Math.max(...blocked.rolls)!==Math.max(...consumed.rolls))throw Error('Unnerve ignored '+item);
    state[side][0].abilityConfirmed=false;
    const unknown=calc();state[side][0].abilityConfirmed=true;
    if(side==='opp'&&(!unknown.berry.uncertain||unknown.berry.consume))throw Error('Unknown blocking source assumed absent '+item);
    checks.push({item,side,activeMax:Math.max(...active.rolls),consumedMax:Math.max(...consumed.rolls),blockedMax:Math.max(...blocked.rolls),unknownGuarded:side!=='opp'||unknown.berry.uncertain,readOnly:true});
   }return checks;
  }''')
  assert len(checks)==36
  report.update(passed=True,berries=18,directions=2,checks=checks);browser.close()
finally:
 server.shutdown();(ROOT/'ALL_BERRY_BROWSER_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS 18 registered berries in both actual damage adapters: active/consumed/Unnerve/unknown; forecast stays read-only')
