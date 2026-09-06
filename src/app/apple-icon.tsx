import { ImageResponse } from "next/og";

import { BrandConstantsCollection } from "@/features/brand/brand.constants";

export const size = {
  height: 180,
  width: 180,
};

export const contentType = "image/png";

const AppleIcon = () => {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: `linear-gradient(135deg, ${BrandConstantsCollection.PrimaryColor} 0%, ${BrandConstantsCollection.AccentColor} 100%)`,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg
          height="150"
          viewBox="0 0 32 32"
          width="150"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={BrandConstantsCollection.MarkHeartPath} fill="#ffffff" />
        </svg>
      </div>
    ),
    size,
  );
};

export default AppleIcon;

/*
 * Learning notes
 *
 * App icon file convention
 * - `apple-icon.tsx` is a Next.js metadata route. Next.js turns the returned
 *   image into `<link rel="apple-touch-icon">`.
 * - Next.js 14.1 introduced the same `app/apple-icon` convention. Next.js 16.3
 *   still uses it; `params` would be a Promise if this file lived on a dynamic
 *   segment.
 *
 * ImageResponse
 * - `next/og` draws the PNG at build time. A static `apple-icon.png` would also
 *   work; this keeps the mark aligned with the in-app SVG without a binary
 *   asset.
 */
