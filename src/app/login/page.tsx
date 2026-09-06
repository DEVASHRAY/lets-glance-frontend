import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/features/auth/login-form";
import { BrandConstantsCollection } from "@/features/brand/brand.constants";
import { BrandMark } from "@/features/brand/brand-mark";

export const metadata: Metadata = {
  title: "Log in",
  description: `Log in to ${BrandConstantsCollection.DisplayName} and continue your conversations.`,
};

const LoginPage = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const defaultEmail = isDevelopment
    ? process.env["DEV_LOGIN_EMAIL"]
    : undefined;
  const defaultPassword = isDevelopment
    ? process.env["DEV_LOGIN_PASSWORD"]
    : undefined;

  return (
    <main className="bg-brand-surface text-brand-ink relative isolate min-h-svh flex-1 overflow-hidden">
      <div
        aria-hidden="true"
        className="bg-brand-400/20 absolute -top-40 -left-40 size-96 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-brand-accent-300/20 absolute right-[-8rem] bottom-[-10rem] size-[28rem] rounded-full blur-3xl"
      />

      <div className="relative mx-auto grid min-h-svh w-full max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        <section
          aria-labelledby="brand-heading"
          className="hidden flex-col justify-between px-12 py-12 lg:flex xl:px-20 xl:py-16"
        >
          <div className="flex items-center gap-3 text-lg font-bold tracking-tight">
            <BrandMark className="shadow-brand-glow size-12" />
            {BrandConstantsCollection.DisplayName}
          </div>

          <div className="max-w-xl pb-12">
            <p className="text-brand-700 mb-5 text-sm font-bold tracking-[0.22em] uppercase">
              Designed for a closer look
            </p>
            <h2
              id="brand-heading"
              className="text-5xl leading-[1.03] font-semibold tracking-[-0.045em] xl:text-7xl"
            >
              A quicker first look.
              <span className="from-brand-600 to-brand-accent-600 block bg-gradient-to-r bg-clip-text text-transparent">
                A better hello.
              </span>
            </h2>
            <p className="text-brand-muted mt-7 max-w-lg text-lg leading-8">
              Thoughtful profiles make it easier to notice someone and start a
              conversation without the noise.
            </p>
          </div>

          <p className="text-brand-subtle text-sm">
            Take a glance. Find a reason to say hello.
          </p>
        </section>

        <section
          aria-labelledby="login-heading"
          className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12"
        >
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 text-lg font-bold tracking-tight lg:hidden">
              <BrandMark className="shadow-brand-glow size-11" />
              {BrandConstantsCollection.DisplayName}
            </div>

            <div className="border-brand-border bg-brand-panel shadow-brand-panel rounded-[2rem] border p-6 sm:p-10">
              <p className="text-brand-700 text-sm font-bold tracking-[0.18em] uppercase">
                Welcome back
              </p>
              <h1
                id="login-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
              >
                Log in to continue
              </h1>
              <p className="text-brand-muted mt-3 leading-7">
                Your next great conversation could be one sign-in away.
              </p>
              <LoginForm
                defaultEmail={defaultEmail}
                defaultPassword={defaultPassword}
              />
              <p className="text-brand-subtle mt-6 text-center text-sm">
                New here?{" "}
                <Link
                  href="/signup"
                  className="text-brand-muted hover:text-brand-700 font-medium underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;

/*
 * Learning notes
 *
 * Server Component
 * - App Router pages are Server Components unless `"use client"` is added.
 * - This shell ships no page-specific client JavaScript because it has no
 *   state, events, effects, custom hooks, or browser API usage.
 * - The visual atmosphere uses CSS instead of image assets, avoiding additional
 *   network requests and responsive-image bytes on the authentication path.
 *
 * Metadata
 * - Next.js generates this page's document metadata from the typed `metadata`
 *   export. Next.js 14.1 used the same App Router metadata convention.
 *
 * Development credentials
 * - Git-ignored `.env.local` values prefill the form only in development.
 * - Passing them to the Client Component intentionally exposes them to the
 *   local browser, so production never receives these props.
 */
