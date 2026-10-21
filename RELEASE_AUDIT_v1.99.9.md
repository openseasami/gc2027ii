# v1.99.9 release audit

- Added independently tested per-strike probability kernel accounting for accuracy (once), hit-count weighting, Substitute absorption, and early KO approximation.
- Existing nine single-strike secondary-status recommendations use the shared kernel with a single strike; intended behavior unchanged.
- The kernel is **not yet wired to any multi-hit move with an independently rolled status effect**. Do not claim full multi-hit move coverage.
- Verified via Node release validator and all bundled tests. Full browser and battle-engine integration tests remain pending.
