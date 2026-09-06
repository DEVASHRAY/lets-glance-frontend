import type { Metadata } from "next";

import { SignupFlow } from "@/features/auth/signup-flow";
import { BrandConstantsCollection } from "@/features/brand/brand.constants";

export const metadata: Metadata = {
  title: "Join",
  description: `Create a ${BrandConstantsCollection.DisplayName} profile and start meeting new people.`,
};

const SignupPage = () => {
  return <SignupFlow />;
};

export default SignupPage;

/*
 * Learning notes
 *
 * Server Component shell
 * - The route stays a Server Component. All step state and the signup Action
 *   live in the Client `SignupFlow`, so this file ships no extra JavaScript.
 *
 * Next.js 14.1 comparison
 * - App Router pages were already Server Components by default. Next.js 16
 *   keeps that model and generates metadata from the typed export.
 */
