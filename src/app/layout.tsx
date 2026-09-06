import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { BrandConstantsCollection } from "@/features/brand/brand.constants";

import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const productDescription =
  "Meet people at your pace and start meaningful conversations.";

export const metadata: Metadata = {
  applicationName: BrandConstantsCollection.DisplayName,
  description: productDescription,
  metadataBase: new URL(BrandConstantsCollection.PublicOrigin),
  openGraph: {
    description: productDescription,
    siteName: BrandConstantsCollection.DisplayName,
    title: BrandConstantsCollection.DisplayName,
    type: "website",
  },
  title: {
    default: BrandConstantsCollection.DisplayName,
    template: `%s | ${BrandConstantsCollection.DisplayName}`,
  },
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
};

export default RootLayout;

/*
 * Learning notes
 *
 * Next.js metadata
 * - `metadataBase` anchors generated metadata URLs to the canonical public
 *   origin, while the title template applies the product name to child pages.
 * - Next.js 14.1 supported both APIs; Next.js 16.3 keeps metadata generation in
 *   the Server Component layout without shipping client JavaScript.
 */
