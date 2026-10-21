# v2.0.4 switch-in and field integration audit

- Real functions exercised: resolveEntryEvents, triggerEntryAbility, applyEntryTerrain, decrementTurnFieldCounters.
- Verifies simultaneous entrant stat reset/intimidate, confirmed weather entry, turn field/side-condition expiry, deterministic entry-order replay.
- Some dependencies (speed lookup, item effects, stage resets) are substituted; this is not browser E2E.
- No battle engine behavioral change; adds a regression test.
