# v1.99.1 release audit

## Change
- Added deterministic stat-stage changes on *confirmed damaging single hits* for Acid Spray (SpD -2) and Mystical Fire (SpA -1), in both directions. Existing Lumina Crash (SpD -2) now uses the same table.
- If Substitute absorbs the attack, the existing early return prevents these effects. Bypass attacks can trigger them.
- Zero HP after hit does not record stat drops. Probabilistic secondary effects, spread moves, status moves, and multi-hit secondary effects are **not** covered.

## Test scope
- Run release integrity and all bundled component tests, plus `test-guaranteed-stat-drops.js`.
- No browser end-to-end verification or full legacy battle engine suite is claimed.
