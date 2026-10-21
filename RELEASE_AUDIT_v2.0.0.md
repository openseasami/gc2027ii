# v2.0.0 release audit

- Added verified per-hit flinch metadata for ダブルパンツァー (30% per hit, two hits). This move is not usable in standard Scarlet/Violet play, so the integration is a reusable calculation-path validation rather than expanded Regulation C coverage.
- Forecast is advisory-only and conditional on the target not having moved. The tool does not automatically apply flinch.
- Calculates accuracy once, then two per-hit rolls, with approximate KO/substitute strike filtering; preserves existing status forecasts.
- New unit tests cover two-hit 51%, accuracy, Substitute, KO and prevented effects.
- 9 static release checks passed; all bundled Node tests passed. Full browser interaction and battle engine integration tests not completed.
