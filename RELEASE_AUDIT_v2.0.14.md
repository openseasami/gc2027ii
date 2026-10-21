# v2.0.14 — Grounding integration correction and audit

## Code changes
Unified confirmed-item/ability grounding checks at five remaining call sites: Psychic Terrain priority blocking and explanations, Prankster terrain explanation, terrain seed activation, and Grassy Terrain end-of-turn healing forecast. This follows v2.0.13 terrain-damage correction. Unknown opponent item/ability remains unconfirmed.

## Validations
- All 30 `test-*.js` scripts pass, including 10 new priority grounding assertions.
- All 9 `verify-release.js` checks pass.
- ZIP integrity checked.

## Not complete
Live deployed browser E2E, full Regulation C rules and legality, full move/item/ability semantics, UI acceptance, and cartridge-accurate battle comparisons have not been established. No completion certification is claimed.
