# v1.99.3 audit
- Confirmed single-target hit stat drops (Acid Spray, Mystical Fire, Lumina Crash): secondary suppression for Covert Cloak, and Mirror Armor reflection onto attacker's battle entry.
- Reflected drops respect attacker Clear Body/White Smoke; reflection does not loop.
- Enemy items only taken into account when confirmed; own item uses battle entry.
- Scope limitation: does not cover probabilistic effects, status moves, multi-hit secondary effects, Mold Breaker and suppression interactions, other stat-changing moves, observed effects beyond this path.
- Automated component tests, static audit; no real-browser end-to-end assurance.
