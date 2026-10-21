# Global Challenge 2027 II v2.1.0 — Torkoal priority implementation

## Source changes
- `ふんか` and `しおふき` moved from unsupported variable-power catalog records to active damage-calculation entries (spread moves), with power calculated from observed user HP percentage for **both** friendly and opposing attackers. Formula: max(1, floor(150 × HP%/100)). Unknown/non-numeric HP returns unavailable instead of assuming maximum power.
- `ボディプレス` activated as a damaging move and its attacking stat replaced by the user's Defense and Defense stage. Burn's physical Attack penalty is excluded for Body Press. Both damage directions updated.
- Existing `ひでり`, weather boosts, Trick Room and turn transaction routines retained.

## Automated verification
- `node verify-release.js`: 9/9 pass
- `node test-torkoal-core.js`: 17 checks pass
- 31 previously supplied regression test scripts: all passed (rerun in release procedure).

## Important limitations; NOT release-ready
- Ability `シェルアーマー` critical-hit immunity not fully modeled.
- `あくび` and `クリアスモッグ` complete turn-by-turn and stat-reset effects not demonstrated.
- Opponent damage results use assumed investment/nature when unknown; damage calculation is explicitly approximate.
- Full live browser E2E and comparison to an independent battle calculator were not available.
- The dataset contains catalog entries for moves without resolved effects. Do NOT interpret move presence as full functionality.
- This release focuses on Torkoal; high-usage ability/move coverage expansion remains unfinished.
- GitHub Pages deployment is separate from creating this ZIP.
