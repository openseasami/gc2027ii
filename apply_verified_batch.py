import json,csv
from pathlib import Path
root=Path(__file__).resolve().parent
path=root/'PRIORITY_POLICY.json'; d=json.loads(path.read_text())
src=d['primarySource']['url']
data={
'エルフーン':('Whimsicott',20,{'おいかぜ':93.5,'ムーンフォース':85.6,'アンコール':59.4,'まもる':47.1,'あまえる':16.6,'にほんばれ':14.4,'ギガドレイン':9.4,'ちょうはつ':7.6,'てだすけ':7.4,'マジカルシャイン':6.6},{'いたずらごころ':97.0,'ようりょくそ':2.1,'すりぬけ':1.0}),
'ニョロトノ':('Politoed',30,{'まもる':90.1,'ウェザーボール':86.2,'れいとうビーム':50.6,'だくりゅう':46.2,'ほろびのうた':43.6,'アンコール':26.9,'てだすけ':9.4,'こごえるかぜ':8.4,'さいみんじゅつ':8.2,'じこあんじ':7.0},{'あめふらし':99.5,'ちょすい':0.4,'しめりけ':0.1}),
'ドリュウズ':('Excadrill',27,{'アイアンヘッド':97.4,'まもる':92.1,'いわなだれ':86.3,'10まんばりき':82.4,'じしん':24.3,'つるぎのまい':2.8,'ドリルライナー':2.2,'つのドリル':1.8,'じだんだ':1.4,'かわらわり':1.2},{'すなかき':93.5,'かたやぶり':4.4,'すなのちから':2.0}),
'イエッサン♂':('Indeedee',28,{'ワイドフォース':99.0,'マジカルフレイム':63.6,'トリック':57.0,'まもる':47.0,'トリックルーム':29.9,'マジカルシャイン':21.7,'ふういん':19.7,'ハイパーボイス':11.9,'てだすけ':9.6,'アンコール':7.3},{'サイコメイカー':99.7,'せいしんりょく':0.2,'シンクロ':0.1})
}
prov=d.setdefault('observationSources',{}); ranks=d.setdefault('tournamentRanksVerified',{})
for name,(english,rank,moves,abilities) in data.items():
    assert name not in d['records'],f'Existing record must not overwrite: {name}'
    assert rank>0 and rank<=30
    d['records'][name]={'english':english,'moves':moves,'abilities':abilities}
    ranks[name]=rank
    prov[name]={'move':{k:src for k in moves},'ability':{k:src for k in abilities}}
d['records']=dict(sorted(d['records'].items()))
path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
manifest={name:{'rank':rank,'source_url':src} for name,(_,rank,_,_) in data.items()}
(root/'tournament-verified-ranks-batch.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with (root/'adoption-verified-batch.csv').open('w',encoding='utf-8',newline='') as f:
 w=csv.writer(f);w.writerow(['species','english','kind','name','rate','source_url','event'])
 for species,(english,rank,moves,abilities) in data.items():
  for k,v in moves.items():w.writerow([species,english,'move',k,v,src,d['primarySource']['event']])
  for k,v in abilities.items():w.writerow([species,english,'ability',k,v,src,d['primarySource']['event']])
print('Added:',len(data),'Species; observations:',sum(len(t[2])+len(t[3]) for t in data.values()),'total',len(d['records']))
