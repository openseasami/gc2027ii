#!/usr/bin/env python3
"""Normalize verified Pokémon Zone English labels to Japanese. No guesses: unknown labels remain English and are flagged."""
import json,re,copy
from pathlib import Path
P=Path(__file__).resolve().parent
M={}
A={}
def add(dst,s):
 for raw in s.strip().splitlines():
  if not raw.strip() or raw.lstrip().startswith('#'): continue
  en,jp=raw.split('|',1)
  if en in dst and dst[en]!=jp:raise ValueError(en)
  dst[en]=jp
add(M,'''Protect|まもる
Detect|みきり
Fake Out|ねこだまし
Close Combat|インファイト
Tailwind|おいかぜ
Trick Room|トリックルーム
Ice Beam|れいとうビーム
Heat Wave|ねっぷう
Shadow Ball|シャドーボール
Flamethrower|かえんほうしゃ
Expanding Force|ワイドフォース
Rock Slide|いわなだれ
Sucker Punch|ふいうち
Thunderbolt|10まんボルト
U-turn|とんぼがえり
Dazzling Gleam|マジカルシャイン
Encore|アンコール
Knock Off|はたきおとす
Ice Punch|れいとうパンチ
Earth Power|だいちのちから
Will-O-Wisp|おにび
Solar Beam|ソーラービーム
Swords Dance|つるぎのまい
Volt Switch|ボルトチェンジ
Wide Guard|ワイドガード
Psychic|サイコキネシス
Hyper Voice|ハイパーボイス
Dark Pulse|あくのはどう
Dragon Pulse|りゅうのはどう
Weather Ball|ウェザーボール
Iron Head|アイアンヘッド
Helping Hand|てだすけ
Earthquake|じしん
Aura Sphere|はどうだん
Calm Mind|めいそう
Overheat|オーバーヒート
Sludge Bomb|ヘドロばくだん
Taunt|ちょうはつ
Snarl|バークアウト
Icy Wind|こごえるかぜ
Dual Wingbeat|ダブルウイング
Light Screen|ひかりのかべ
Flash Cannon|ラスターカノン
Draco Meteor|りゅうせいぐん
Night Slash|つじぎり
Throat Chop|じごくづき
Hurricane|ぼうふう
Liquidation|アクアブレイク
Muddy Water|だくりゅう
Life Dew|いのちのしずく
Brave Bird|ブレイブバード
Body Press|ボディプレス
Rage Powder|いかりのこな
High Horsepower|10まんばりき
Flip Turn|クイックターン
Moonblast|ムーンフォース
Giga Drain|ギガドレイン
Reflect|リフレクター
Blizzard|ふぶき
Rain Dance|あまごい
Ice Shard|こおりのつぶて
Sludge Wave|ヘドロウェーブ
Drain Punch|ドレインパンチ
Feint|フェイント
Psycho Cut|サイコカッター
Play Rough|じゃれつく
Triple Axel|トリプルアクセル
Electroweb|エレキネット
Discharge|ほうでん
Focus Blast|きあいだま
Scald|ねっとう
Recover|じこさいせい
Yawn|あくび
Roost|はねやすめ
Low Kick|けたぐり
Dragon Dance|りゅうのまい
Flare Blitz|フレアドライブ
Psychic Fangs|サイコファング
Eruption|ふんか
Nasty Plot|わるだくみ
Aurora Veil|オーロラベール
Aqua Jet|アクアジェット
Sunny Day|にほんばれ
Bulk Up|ビルドアップ
Phantom Force|ゴーストダイブ
Shadow Claw|シャドークロー
Vacuum Wave|しんくうは
Shadow Sneak|かげうち
Sacred Sword|せいなるつるぎ
Hydro Pump|ハイドロポンプ
Energy Ball|エナジーボール
Skill Swap|スキルスワップ
Toxic|どくどく
Ancient Power|げんしのちから
Leech Life|きゅうけつ
First Impression|であいがしら
Mystical Fire|マジカルフレイム
Extreme Speed|しんそく
Bullet Punch|バレットパンチ
Wave Crash|ウェーブタックル
Grassy Glide|グラススライダー
Wood Hammer|ウッドハンマー
Dire Claw|フェイタルクロー
Parting Shot|すてゼリフ
Darkest Lariat|DDラリアット
Drum Beating|ドラムアタック
Superpower|ばかぢから
Acrobatics|アクロバット
Rock Tomb|がんせきふうじ
Coaching|コーチング
Power Gem|パワージェム
Double-Edge|すてみタックル
Dragon Claw|ドラゴンクロー
Drum Beating|ドラムアタック
Make It Rain|ゴールドラッシュ
Electro Shot|エレクトロビーム
Last Respects|おはかまいり
Follow Me|このゆびとまれ
Foul Play|イカサマ
Spore|キノコのほうし
Thunder Wave|でんじは
Seed Bomb|タネばくだん
Grassy Terrain|グラスフィールド
Psychic Terrain|サイコフィールド
Electric Terrain|エレキフィールド
Misty Terrain|ミストフィールド
Sandstorm|すなあらし
Snowscape|ゆきげしき
Haze|くろいきり
Substitute|みがわり
Baton Pass|バトンタッチ
Protect|まもる
''')
add(A,'''Intimidate|いかく
Inner Focus|せいしんりょく
Blaze|もうか
Prankster|いたずらごころ
Competitive|かちき
Flash Fire|もらいび
Torrent|げきりゅう
Cursed Body|のろわれボディ
Technician|テクニシャン
Levitate|ふゆう
Sharpness|きれあじ
Overgrow|しんりょく
Clear Body|クリアボディ
Weak Armor|くだけるよろい
Drought|ひでり
Snow Warning|ゆきふらし
Chlorophyll|ようりょくそ
Unnerve|きんちょうかん
Volt Absorb|ちくでん
Infiltrator|すりぬけ
Justified|せいぎのこころ
Pressure|プレッシャー
Speed Boost|かそく
Hyper Cutter|かいりきバサミ
Protean|へんげんじざい
Scrappy|きもったま
Magic Guard|マジックガード
Swift Swim|すいすい
Regenerator|さいせいりょく
Punk Rock|パンクロック
Moxie|じしんかじょう
Thick Fat|あついしぼう
Cloud Nine|ノーてんき
Solar Power|サンパワー
Emergency Exit|ききかいひ
Lightning Rod|ひらいしん
Drizzle|あめふらし
Armor Tail|テイルアーマー
Pixilate|フェアリースキン
Sand Stream|すなおこし
Rock Head|いしあたま
Hospitality|おもてなし
Damp|しめりけ
Flower Veil|フラワーベール
Flame Body|ほのおのからだ
Steadfast|ふくつのこころ
Snow Cloak|ゆきがくれ
Multiscale|マルチスケイル
Thermal Exchange|ねつこうかん
Liquid Voice|うるおいボイス
Toxic Debris|どくげしょう
Mirror Armor|ミラーアーマー
Magician|マジシャン
Defiant|まけんき
Rain Dish|あめうけざら
Iron Fist|てつのこぶし
Magic Bounce|マジックミラー
Friend Guard|フレンドガード
Soundproof|ぼうおん
Super Luck|きょううん
Gale Wings|はやてのつばさ
Solid Rock|ハードロック
Frisk|おみとおし
Sniper|スナイパー
Illusion|イリュージョン
Compound Eyes|ふくがん
Queenly Majesty|じょおうのいげん
Adaptability|てきおうりょく
Disguise|ばけのかわ
Pickpocket|わるいてぐせ
Contrary|あまのじゃく
Moody|ムラっけ
Electric Surge|エレキメイカー
Stance Change|バトルスイッチ
Unaware|てんねん
Merciless|ひとでなし
Libero|リベロ
Shell Armor|シェルアーマー
Gooey|ぬめぬめ
Sap Sipper|そうしょく
Leaf Guard|リーフガード
Telepathy|テレパシー
Poison Point|どくのトゲ
Oblivious|どんかん
Electromorphosis|でんきにかえる
Unburden|かるわざ
Limber|じゅうなん
Cute Charm|メロメロボディ
Rivalry|とうそうしん
Water Bubble|すいほう
Berserk|ぎゃくじょう
Mold Breaker|かたやぶり
Own Tempo|マイペース
Poison Heal|ポイズンヒール
Sand Veil|すながくれ
Tough Claws|かたいツメ
Natural Cure|しぜんかいふく
Illuminate|はっこう
Analytic|アナライズ
Quick Feet|はやあし
Grassy Surge|グラスメイカー
Poison Touch|どくしゅ
''')

add(M,'''King’s Shield|キングシールド
Draining Kiss|ドレインキッス
Disable|かなしばり
Freeze-Dry|フリーズドライ
Sleep Powder|ねむりごな
Leaf Storm|リーフストーム
Icicle Crash|つららおとし
Ice Fang|こおりのキバ
Terrain Pulse|だいちのはどう
Poltergeist|ポルターガイスト
Extrasensory|じんつうりき
Leaf Blade|リーフブレード
Power Whip|パワーウィップ
High Jump Kick|とびひざげり
Surf|なみのり
Ice Spinner|アイススピナー
Soak|みずびたし
Rising Voltage|ライジングボルト
Moonlight|つきのひかり
Overdrive|オーバードライブ
Boomburst|ばくおんぱ
Psychic Noise|サイコノイズ
Crunch|かみくだく
Stockpile|たくわえる
Alluring Voice|みわくのボイス
Scorching Sands|ねっさのだいち
Air Slash|エアスラッシュ
Drill Run|ドリルライナー
Zap Cannon|でんじほう
Coil|とぐろをまく
Hypnosis|さいみんじゅつ
Twin Beam|ツインビーム
Hyper Beam|はかいこうせん
Quick Attack|でんこうせっか
Final Gambit|いのちがけ
Head Smash|もろはのずつき
Steel Roller|アイアンローラー
Stomping Tantrum|じだんだ
Meteor Mash|コメットパンチ
Matcha Gotcha|シャカシャカほう
Strength Sap|ちからをすいとる
Armor Cannon|アーマーキャノン
Light of Ruin|はめつのひかり
Quiver Dance|ちょうのまい
Struggle Bug|むしのていこう
Bug Buzz|むしのさざめき
Fiery Dance|ほのおのまい
Spirit Break|ソウルクラッシュ
Steel Beam|てっていこうせん
Perish Song|ほろびのうた
Glaive Rush|きょけんとつげき
Quash|さきおくり
Spiky Shield|ニードルガード
Power Trip|つけあがる
Iron Defense|てっぺき
Psyshock|サイコショック
Rage Fist|ふんどのこぶし
Water Spout|しおふき
Shell Smash|からをやぶる
Double Shock|でんこうそうげき
Revival Blessing|さいきのいのり
Dragon Darts|ドラゴンアロー
Dragon Cheer|ドラゴンエール
Population Bomb|ネズミざん
Super Fang|いかりのまえば
Beat Up|ふくろだたき
Clanging Scales|スケイルノイズ
Clangorous Soul|ソウルビート
Quick Guard|ファストガード
Bitter Blade|むねんのつるぎ
Infernal Parade|ひゃっきやこう
Snipe Shot|ねらいうち
Focus Energy|きあいだめ
Air Cutter|エアカッター
Bitter Malice|うらみつらみ
Flower Trick|トリックフラワー
Brick Break|かわらわり
Pollen Puff|かふんだんご
Meteor Assault|スターアサルト
Lumina Crash|ルミナコリジョン
Trop Kick|トロピカルキック
Speed Swap|スピードスワップ
Stone Axe|がんせきアックス
X-Scissor|シザークロス
Storm Throw|やまあらし
Mach Punch|マッハパンチ
Octolock|たこがため
Payback|しっぺがえし
Topsy-Turvy|ひっくりかえす
Bug Bite|むしくい
Leech Seed|やどりぎのタネ
Acupressure|つぼをつく
Cosmic Power|コスモパワー
Last Resort|とっておき
Hammer Arm|アームハンマー
Baneful Bunker|トーチカ
Infestation|まとわりつく
Pyro Ball|かえんボール
Gunk Shot|ダストシュート
Shelter|たてこもる
Synthesis|こうごうせい
Water Shuriken|みずしゅりけん
Instruct|さいはい
Waterfall|たきのぼり
Temper Flare|やけっぱち
Fissure|じわれ
Belly Drum|はらだいこ
Body Slam|のしかかり
Self-Destruct|じばく
Minimize|ちいさくなる
Barb Barrage|どくばりセンボン
Poison Jab|どくづき
Ceaseless Edge|ひけん・ちえなみ
Aqua Cutter|アクアカッター
Razor Shell|シェルブレード
Parabolic Charge|パラボラチャージ
Slack Off|なまける
Trick|トリック
Thunder Punch|かみなりパンチ
Mirror Coat|ミラーコート
Entrainment|なかまづくり
Gigaton Hammer|デカハンマー
Psych Up|じこあんじ
Accelerock|アクセルロック
Zen Headbutt|しねんのずつき
Sheer Cold|ぜったいれいど
Chilly Reception|さむいギャグ
Heal Pulse|いやしのはどう
Wish|ねがいごと
Water Pulse|みずのはどう
''')
add(A,'''Curious Medicine|きみょうなくすり
Synchronize|シンクロ
Mega Launcher|メガランチャー
''')

def main():
 src=json.loads((P/'ADOPTION_120_VERIFIED.json').read_text(encoding='utf8'))
 result=copy.deepcopy(src)
 unknown={'moves':{},'abilities':{}}
 changed={'moves':0,'abilities':0}
 for x in result['species']:
  for key,mp in [('moves',M),('abilities',A)]:
   target={}
   for name,v in x[key].items():
    normalized=mp.get(name,name)
    if normalized in target and target[normalized]!=v:raise ValueError(f'Collision {x["name"]} {normalized}')
    target[normalized]=v
    if normalized!=name:changed[key]+=1
    if normalized.isascii() and ((key=='moves' and v>=10) or (key=='abilities' and v>7)):
     unknown[key][normalized]=unknown[key].get(normalized,0)+1
   x[key]=target
 (P/'ADOPTION_120_NORMALIZED.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 (P/'ADOPTION_120_NAME_AUDIT.json').write_text(json.dumps({'translatedRows':changed,'untranslatedPriority':unknown,'uniqueUntranslatedPriority':{k:len(v) for k,v in unknown.items()}},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('translated',changed,'untranslated target names',{k:len(v) for k,v in unknown.items()})

if __name__=='__main__':main()
