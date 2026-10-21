# v1.99.0 release audit

## 修正
- みがわりの遮断判定を `substituteBlocksConfirmedHit` に共通化。
- みがわりを貫通する技（bypasssub）と「すりぬけ」による命中は、みがわりがあっても本体の特性ヒット処理の対象とする。
- 通常攻撃はみがわりを消費し、本体への特性ヒットを遮断。
- 味方から相手・相手から味方の単発攻撃／連続技で判定を共用。

## 検証
- verify-release.js: 9/9
- test-contact-ko.js: 6/6
- test-contact.js: 11/11
- test-residual.js: 11/11
- test-substitute-bypass.js: 14/14（新規）
- test-substitute-contact.js: 8/8
- test-substitute-create.js: 11/11
- test-substitute-state.js: 12/12
- test-substitute-strikes.js: 10/10
- 合計 92/92

## 残課題
- 技固有の状態異常・能力変化などの追加効果全般は未実装。今回の修正は本体への特性命中判定に限定。
- 実ブラウザの操作確認と過去の戦闘エンジン36スイートは未実施。
