# Global Challenge 2027 II — completion audit (2026-10-20)

**Status: NOT COMPLETE.** This assessment avoids claiming that tests prove simulation accuracy.

## Verified
- Release integrity checks: 9/9.
- Existing test scripts: execute individually (see run summary outside the archive).
- Regulation mapping: 262 entries, all present in NATIONAL_DEX.
- There are 203 distinct ability names in these entries; 105 are explicitly marked `固有効果は未対応` in ABILITY_SUPPORT. Other abilities may be only partially supported.
- 698 distinct listed learnset move names have corresponding NATIONAL_MOVES catalog entries. This does NOT validate legality or move-effect implementation.

## Blocking completion requirements
1. Implement and independently verify every required ability, move, item, and exception for the target format; track precise per-effect evidence.
2. Validate damage, speed, priority, turn order and secondary effects against authoritative reference cases.
3. Run a real-browser E2E suite for a full match including KO replacement, 45-second mode, save/reload/undo/redo and responsive layout.
4. Reconcile the target format's exact regulation and legal move availability. National learnsets alone are not a legality database.
5. Confirm deployed GitHub Pages build corresponds to tested source. This package does NOT deploy updates.

Run `node coverage-audit.js` from the extracted directory to regenerate machine-readable metadata coverage.
