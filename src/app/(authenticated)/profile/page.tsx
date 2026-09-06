import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EditProfileForm } from "@/features/profile/edit-profile-form";
import { ProfileConstantsCollection } from "@/features/profile/profile.constants";
import { loadViewerProfile } from "@/features/profile/profile.data";
import type { ProfileLoadResult } from "@/features/profile/profile.types";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Update your profile details.",
};

const ProfilePage = async () => {
  let result: ProfileLoadResult | null = null;

  try {
    result = await loadViewerProfile();
  } catch (error) {
    return (
      <main className="bg-brand-surface min-h-[calc(100svh-4rem)] px-4 py-12 text-zinc-950 sm:px-6">
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {error instanceof Error
            ? "Unable to load your profile"
            : "Unexpected profile failure"}
        </div>
      </main>
    );
  }

  if (
    result.outcome ===
    ProfileConstantsCollection.ProfileLoadOutcome.Unauthorized
  ) {
    redirect("/login");
  }

  if (
    result.outcome === ProfileConstantsCollection.ProfileLoadOutcome.Failure
  ) {
    return (
      <main className="bg-brand-surface min-h-[calc(100svh-4rem)] px-4 py-12 text-zinc-950 sm:px-6">
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {result.message}
        </div>
      </main>
    );
  }

  const { profile } = result;

  return (
    <main className="bg-brand-surface relative isolate min-h-[calc(100svh-4rem)] text-zinc-950">
      <div
        aria-hidden="true"
        className="bg-brand-200/40 absolute top-0 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full blur-3xl"
      />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
        <p className="text-brand-700 text-xs font-bold tracking-[0.18em] uppercase">
          Your profile
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          Edit what people see
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-zinc-600">
          Update your basics, bio, and the details that show up on your public
          card. Save when you&apos;re done.
        </p>
      </div>
      <EditProfileForm profile={profile} />
    </main>
  );
};

export default ProfilePage;

/*
 * Learning notes
 *
 * Server Component profile
 * - Express profile data is fetched and runtime-validated on the server, then
 *   passed into a Client form for editing. The shared React `cache` call still
 *   deduplicates this request with the header's viewer lookup.
 *
 * Next.js 14.1 comparison
 * - App Router Server Components supported the same server-rendered page model;
 *   Next.js 16 keeps request-time APIs asynchronous and uses the shared Proxy
 *   convention for the optimistic route check.
 */
