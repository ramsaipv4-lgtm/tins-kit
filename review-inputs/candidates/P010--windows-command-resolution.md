---
id: windows-command-resolution
solves: PowerShell launcher passes an array to Start-Process FilePath
triggers: windows,powershell,launcher
not_when: The caller intentionally needs every matching executable
status: candidate
consumers: agent-control
consumer_roots: 60ead0c1df13945f5f3680132d780ca6fbe40a8a
license: UNLICENSED
source: agent-control@781fd7a1baace9c2dcc2920dbc04d7af54584741
---
# Resolve one executable when Windows PATH contains multiple Node installations

Get-Command node -CommandType Application may return multiple matches. Select-Object -First 1 before reading Source when a launcher requires one PATH-priority executable. AC-5 and corrected Windows cold-start/reuse smoke in docs/evidence/README.md support this local candidate; no global promotion.

## Evidence

- test/launcher.test.mjs#AC-5
