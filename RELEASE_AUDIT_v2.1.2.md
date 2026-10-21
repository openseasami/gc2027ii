# v2.1.2 release audit

- Implemented 7-stage clearing helper for Haze (including accuracy/evasion).
- Implemented guarded Clear Smog stage reset for **explicitly confirmed hit with resolved target index**.
- Prevents false resets when target is ambiguous, move failed, or substitute intercepted the hit.
- IMPORTANT: ordinary recorded move UI does not yet capture hitConfirmed / targetIdx, so Clear Smog remains conservative (no automatic reset without confirmation).
- Yawn and its deferred sleep are NOT implemented in this version.
- Not a complete Torkoal implementation; no real-browser end-to-end testing performed.
