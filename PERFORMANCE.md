# Performance Baseline

This document records reproducible performance evidence for Let's Glance. The first entry measures the empty Next.js application so later measurements can separate framework cost from application cost.

## Baseline 001: Framework Floor

Measured on August 25, 2026.

### Source and environment

- Revision: `392b509`
- Application: empty `/` route with root layout, Geist Sans, Geist Mono, and Tailwind CSS
- Next.js: `16.3.2`
- React: `19.2.8`
- Bundler: Turbopack
- Node.js: `24.15.0`
- npm: `12.0.2`
- Machine: Apple M3 Pro with 18 GB memory
- Server: local production server on loopback

The Cursor rule files were uncommitted during measurement, but they do not affect runtime output.

### Production build

- Route `/` was statically prerendered.
- Turbopack compilation: 229 ms
- TypeScript checking: 857 ms
- Static generation: 59 ms for four generated pages
- Total wall-clock build time: 3.23 seconds
- Production server readiness: 83 ms

The build completed successfully. The timing wrapper returned a nonzero status only because sandboxed macOS denied a hardware-clock query after the build.

### Warm local HTTP response

Ten sequential requests were sent to the production server after warm-up.

- Median TTFB: 1.80 ms
- Median total response time: 1.91 ms
- Uncompressed HTML: 6,260 bytes
- Gzip HTML transfer: 1,995 bytes
- Next.js cache status: `HIT`

These loopback timings establish a local framework floor. They do not represent internet latency, CDN performance, or production server load.

### Initial modern-browser transfer

- HTML: 1,995 bytes
- CSS: 2,375 bytes
- JavaScript: 133,328 bytes across five requested chunks
- Preloaded WOFF2 fonts: 52,396 bytes
- Favicon: 25,931 bytes
- Total initial transfer: 216,025 bytes, approximately 211 KiB
- Expected initial requests: 10

The build also emits a 39,473-byte `nomodule` compatibility chunk. Modern module-capable browsers do not request it, so it is excluded from the modern-browser total.

### Turbopack bundle graph

The built-in `next experimental-analyze --output` command completed in 1.01 seconds without adding a dependency.

- Route `/` first-load JavaScript: 453,121 uncompressed bytes
- Route `/_not-found` first-load JavaScript: 453,121 uncompressed bytes
- Modern first-load chunks per route: five
- Measured gzip transfer for those chunks: 133,328 bytes

The generated interactive analysis lives under `.next/diagnostics/analyze`. It is ignored build output and should be regenerated for each comparison rather than committed.

### Cache and compression behavior

- Prerendered HTML uses gzip and advertises `s-maxage=31536000`.
- Content-hashed JavaScript and CSS use `public, max-age=31536000, immutable`.
- JavaScript is gzip compressed by the local Next.js production server.
- Fonts are already delivered as compressed WOFF2 files with immutable caching.

### Current measurement limitations

- The page has no visible product content, so LCP, CLS, and INP would not be meaningful product baselines.
- No Lighthouse, WebPageTest, or real-user monitoring dependency has been added yet.
- No cold-cache browser trace, CPU throttling, network throttling, or production CDN was involved.
- Build timings are machine-specific and should be compared only under equivalent conditions.

## Measurement policy

- Never use this empty-page framework floor as the product performance budget.
- Establish route budgets after the first realistic application shell and data flow exist.
- Record cold and warm runs separately.
- Record device, CPU throttle, network profile, cache state, deployment, and source revision.
- Compare distributions such as median and p75 rather than selecting one favorable run.
- Report regressions as well as improvements, including transferred bytes, request count, main-thread work, and user-centric metrics.
