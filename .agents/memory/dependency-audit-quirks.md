---
name: Dependency audit quirks
description: Security-audit behavior for Metro’s image-size transitive dependency.
---

When a security audit reports image-size through Metro and the registry has no patched release, a narrow local replacement is safer than leaving the vulnerable parser package in the dependency graph. Metro only needs synchronous byte-buffer dimension detection, so preserve that API and test the actual Metro resolution path.

**Why:** The latest registry release can remain flagged while the upstream advisory reports no available fix, and changing Expo/Metro versions can introduce unrelated compatibility risk.

**How to apply:** Keep brace-expansion overrides on the existing minimatch major lines, pin js-yaml to the patched 4.x release, and verify both the lockfile and a real Metro web bundle after reinstalling and restarting the workflow.