# v1.98.6 release audit

- Added isolated, deterministic per-strike Substitute contact forecasting helper.
- Substitute breaking hit is not counted as a contact with the defender for Rough Skin / Iron Barbs / Static / Flame Body forecast.
- Existing forecast unchanged when substituteHp absent. No automatic Substitute detection or UI state management added.
- This is a guarded prediction feature only, not a complete Substitute battle engine.
- Run `node verify-release.js`, `node test-contact.js`, `node test-contact-ko.js`, `node test-residual.js`, `node test-substitute-contact.js`.
