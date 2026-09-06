import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/photo-*",
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
        port: "",
        pathname:
          "/id/1223477625/vector/male-default-avatar-profile-icon-man-face-silhouette-person-placeholder-vector-illustration.jpg",
        search:
          "?s=170667a&w=0&k=20&c=CrHRmkAACHQyNhv-f3Mj_PpO5WLFJlXcL2QcUlYByP4=",
      },
      {
        protocol: "https",
        hostname: "cdn.vectorstock.com",
        port: "",
        pathname:
          "/i/1000v/14/18/default-female-avatar-profile-picture-icon-grey-vector-34511418.jpg",
        search: "",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
        port: "",
        pathname: "/wiki/Special:FilePath/*",
        search: "?width=800",
      },
    ],
  },
  redirects: async () => [
    {
      source: "/",
      destination: "/feed",
      permanent: false,
    },
  ],
};

export default nextConfig;

/*
 * Learning notes
 *
 * Next.js config redirects
 * - Next.js 16 applies this known unconditional redirect before Proxy and route
 *   rendering, so `/` remains outside the authenticated Proxy matcher.
 * - Next.js 14.1 used the same `redirects()` config API; its request
 *   interception convention was still named `middleware.ts`.
 *
 * Remote image allowlist
 * - Current providers are Unsplash for runtime-normalized profile URLs, iStock
 *   and VectorStock for Express gender defaults, and Wikimedia Commons
 *   `Special:FilePath` seed portraits. Fixed URLs and generated seed URLs use
 *   exact query allowlists. Unsplash remains query-open because the runtime
 *   preserves source query parameters while replacing its image controls.
 * - Wikimedia redirects `Special:FilePath` requests to `upload.wikimedia.org`.
 *   Next.js 16 does not recheck `remotePatterns` after a permitted redirect, so
 *   the redirect host is not allowed separately when no direct `src` uses it.
 * - Next.js 14.1 supported protocol, host, port, and path restrictions, but
 *   exact `remotePatterns.search` matching arrived in 14.2.14. Next.js 16 uses
 *   exact searches here wherever the current URL format is stable.
 *
 * Image qualities
 * - Next.js 16 only allows quality `75` unless `images.qualities` lists more
 *   values. Next.js 14.1 accepted any quality from 1 to 100.
 *
 * Standalone output
 * - Next.js 16 traces the production server and emits only its runtime files
 *   under `.next/standalone`; the deployment copies browser assets beside it.
 * - Next.js 14.1 supported the same output mode, but the default build still
 *   required the full installation when started with `next start`.
 */
