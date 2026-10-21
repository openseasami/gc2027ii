# v2.0.9 release audit

- Baseline: v2.0.8.
- Fixed 45-second mode initialization: restore saved ON/OFF from localStorage, default ON only when no saved value exists.
- Added test-mode45-reload.js (9 assertions: first visit, persisted OFF, persisted ON).
- Validation: 28/28 test-*.js files; 9/9 verify-release checks.
- Browser automation attempted with Chromium/Playwright against file:// and local HTTP, both blocked by the execution environment (net::ERR_BLOCKED_BY_ADMINISTRATOR). Browser E2E not completed.
- No claims of browser UI or full battle runtime validation.
