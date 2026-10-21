# v1.99.8 release audit

- Updated advisory-only secondary status predictions for きよめのしお (all modeled statuses), パステルベール (poison), すいほう and ねつこうかん (burn), and sunny リーフガード.
- Weather is passed from current battle controls to the probability helper.
- Mold Breaker bypass handling is retained; known ability suppression removes the protective effect in the forecast.
- Predictions do NOT mutate observed battle state.
- New regression: test-secondary-immunity-abilities.js, 13 checks.
- Individual tests: 16 scripts passing; release verifier: 9/9 passing.
- Not tested in a real graphical browser. Multi-hit secondary chances, partner protections, all exceptional conditions and battle-engine integration remain incomplete.
