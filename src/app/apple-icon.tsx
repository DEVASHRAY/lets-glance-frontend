import { ImageResponse } from "next/og";

export const size = {
  height: 180,
  width: 180,
};

export const contentType = "image/png";

const AppleIcon = () => {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#4338ca",
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
        <circle
          cx="9.5"
          cy="10.5"
          r="2.8"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
        />
        <circle
          cx="22.5"
          cy="10.5"
          r="2.8"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
        />
        <path
          d="M4.8 23c.7-4.1 2.6-6.2 5.6-6.2 2.4 0 4 1.1 4.8 3.3M27.2 23c-.7-4.1-2.6-6.2-5.6-6.2-2.4 0-4 1.1-4.8 3.3"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <path
          d="m16 9.7.6 2.2 2.2.6-2.2.6-.6 2.2-.6-2.2-2.2-.6 2.2-.6.6-2.2Z"
          fill="#ffffff"
        />
      </svg>
    </div>,
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
