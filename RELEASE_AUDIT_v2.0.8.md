# v2.0.8 release audit

- Baseline: v2.0.7.
- No battle engine changes. Added test-entry-tie-replay.js and test-mode45-fixed.js.
- Equal-speed entry: tie RNG journal replayed after cursor rewind, reverse entrant order, changed composition reroll.
- 45-second mode: toggling, damage panel visibility, guide refresh, persisted setting call.
- Browser UI end-to-end, actual localStorage persistence across reload, KO workflow and actual save/undo interactions are NOT verified by these Node tests.
- Run node verify-release.js and every test-*.js before distribution.
