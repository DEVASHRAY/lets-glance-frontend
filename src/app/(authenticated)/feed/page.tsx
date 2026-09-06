import type { Metadata } from "next";
import { Suspense } from "react";

import { FeedContent } from "@/features/feed/feed-content";

export const metadata: Metadata = {
  title: "Discover",
  description: "Discover people and start meaningful connections.",
};

const FeedLoading = () => {
  return (
    <div
      aria-label="Loading profiles"
      aria-live="polite"
      className="mx-auto flex w-full max-w-[29rem] animate-pulse flex-col items-center"
    >
      <div className="relative h-[min(62svh,38rem)] min-h-[31rem] w-full overflow-hidden rounded-[2.25rem] border border-white/80 bg-zinc-200 shadow-[0_38px_100px_-36px_rgba(30,41,59,0.35)]">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-indigo-100 to-blue-100" />
        <div className="absolute right-7 bottom-8 left-7">
          <div className="h-5 w-24 rounded-full bg-white/45" />
          <div className="mt-4 h-12 w-52 rounded-2xl bg-white/60" />
          <div className="mt-3 h-4 w-64 max-w-full rounded-full bg-white/40" />
        </div>
      </div>
      <div aria-hidden="true" className="h-20 shrink-0 sm:h-[5.25rem]" />
      <span className="sr-only">Loading profiles</span>
    </div>
  );
};

const FeedPage = () => {
  return (
    <main className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[linear-gradient(110deg,var(--color-brand-50)_0%,var(--color-brand-surface)_52%,var(--color-brand-accent-50)_100%)] text-zinc-950">
      <section className="relative min-h-[calc(100svh-4rem)] px-4 py-7 sm:px-6 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -z-20 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),rgba(248,250,252,0)_68%)]"
        />
        <div
          aria-hidden="true"
          className="bg-brand-200/40 absolute -top-32 -left-40 -z-10 size-[30rem] rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="bg-brand-accent-200/35 absolute -right-40 -bottom-40 -z-10 size-[32rem] rounded-full blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:text-left">
            <div className="text-brand-700 border-brand-600/15 inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.18em] uppercase shadow-sm backdrop-blur">
              <span className="bg-brand-600 size-1.5 rounded-full" />
              Curated for you
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl">
              One person.
              <span className="from-brand-600 to-brand-accent-600 block bg-gradient-to-r bg-clip-text text-transparent">
                One moment.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-base leading-7 text-zinc-600 lg:mx-0 lg:text-lg">
              Slow down and discover the person in front of you. Move when
              you&apos;re ready.
            </p>
          </div>

          <Suspense fallback={<FeedLoading />}>
            <FeedContent />
          </Suspense>
        </div>
      </section>
    </main>
  );
};

export default FeedPage;

/*
 * Learning notes
 *
 * Streaming Server Components
 * - The page is a synchronous Server Component that renders the feed shell.
 * - `FeedContent` performs request-time data work behind Suspense, allowing the
 *   shell and loading cards to stream first.
 *
 * Authenticated route group
 * - The parent `(authenticated)` group keeps this page at the public `/feed`
 *   URL while organizing it with the other protected product routes.
 *
 * React 18.2 comparison
 * - Suspense existed in React 18, but data-loading integration depended more on
 *   framework conventions. The Next.js App Router coordinates this server
 *   rendering and streaming boundary.
 */
