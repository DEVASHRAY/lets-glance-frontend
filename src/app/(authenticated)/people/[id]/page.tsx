import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BrandConstantsCollection } from "@/features/brand/brand.constants";
import { ConnectionsConstantsCollection } from "@/features/connections/connections.constants";
import { loadPeerConnection } from "@/features/connections/connections.data";
import type { PeerConnectionLoadResult } from "@/features/connections/connections.types";
import { DecideProfileForm } from "@/features/connections/decide-profile-form";
import { ReviewLikeForm } from "@/features/connections/review-like-form";
import { PersonProfileDetails } from "@/features/profile/person-profile-details";
import { ProfileConstantsCollection } from "@/features/profile/profile.constants";
import {
  loadPublicProfile,
  loadViewerProfile,
} from "@/features/profile/profile.data";
import type { PublicProfileLoadResult } from "@/features/profile/profile.types";

interface ResolvePersonIdInput {
  params: PageProps<"/people/[id]">["params"];
}

const resolvePersonId = async ({
  params,
}: ResolvePersonIdInput): Promise<string> => {
  try {
    const resolvedParams = await params;
    return resolvedParams.id.trim();
  } catch (error) {
    if (error instanceof Error) {
      return "";
    }

    return "";
  }
};

interface GetProfileOverlayInput {
  peerResult: PeerConnectionLoadResult;
  profileId: string;
  viewerId: string;
}

interface ProfileOverlayNone {
  kind: typeof ConnectionsConstantsCollection.ProfileOverlayKind.None;
}

interface ProfileOverlayReview {
  connectionId: string;
  kind: typeof ConnectionsConstantsCollection.ProfileOverlayKind.Review;
}

interface ProfileOverlayDecide {
  kind: typeof ConnectionsConstantsCollection.ProfileOverlayKind.Decide;
}

interface ProfileOverlayMessage {
  connectionId: string;
  kind: typeof ConnectionsConstantsCollection.ProfileOverlayKind.Status;
}

interface ProfileOverlayStatus {
  kind: typeof ConnectionsConstantsCollection.ProfileOverlayKind.Status;
  label: string;
}

type ProfileOverlay =
  | ProfileOverlayDecide
  | ProfileOverlayMessage
  | ProfileOverlayNone
  | ProfileOverlayReview
  | ProfileOverlayStatus;

const getProfileOverlay = ({
  peerResult,
  profileId,
  viewerId,
}: GetProfileOverlayInput): ProfileOverlay => {
  if (!viewerId || viewerId === profileId) {
    return {
      kind: ConnectionsConstantsCollection.ProfileOverlayKind.None,
    };
  }

  if (
    peerResult.outcome ===
      ConnectionsConstantsCollection.PeerConnectionLoadOutcome.Success &&
    peerResult.connection.status ===
      ConnectionsConstantsCollection.ConnectionStatus.Interested &&
    peerResult.connection.viewerRole ===
      ConnectionsConstantsCollection.ConnectionViewerRole.Receiver
  ) {
    return {
      connectionId: peerResult.connection.connectionId,
      kind: ConnectionsConstantsCollection.ProfileOverlayKind.Review,
    };
  }

  if (
    peerResult.outcome ===
    ConnectionsConstantsCollection.PeerConnectionLoadOutcome.Missing
  ) {
    return {
      kind: ConnectionsConstantsCollection.ProfileOverlayKind.Decide,
    };
  }

  if (
    peerResult.outcome !==
    ConnectionsConstantsCollection.PeerConnectionLoadOutcome.Success
  ) {
    return {
      kind: ConnectionsConstantsCollection.ProfileOverlayKind.None,
    };
  }

  if (
    peerResult.connection.status ===
    ConnectionsConstantsCollection.ConnectionStatus.Accepted
  ) {
    return {
      connectionId: peerResult.connection.connectionId,
      kind: ConnectionsConstantsCollection.ProfileOverlayKind.Status,
    };
  }

  if (
    peerResult.connection.status ===
    ConnectionsConstantsCollection.ConnectionStatus.Interested
  ) {
    return {
      kind: ConnectionsConstantsCollection.ProfileOverlayKind.Status,
      label: "Interest sent",
    };
  }

  return {
    kind: ConnectionsConstantsCollection.ProfileOverlayKind.Status,
    label: "Passed",
  };
};

interface GetOverlayActionsInput {
  overlay: ProfileOverlay;
  personName: string;
  profileId: string;
}

const getOverlayActions = ({
  overlay,
  personName,
  profileId,
}: GetOverlayActionsInput) => {
  if (
    overlay.kind === ConnectionsConstantsCollection.ProfileOverlayKind.Review
  ) {
    return (
      <ReviewLikeForm
        connectionId={overlay.connectionId}
        personName={personName}
      />
    );
  }

  if (
    overlay.kind === ConnectionsConstantsCollection.ProfileOverlayKind.Decide
  ) {
    return <DecideProfileForm personName={personName} receiverId={profileId} />;
  }

  if (
    overlay.kind === ConnectionsConstantsCollection.ProfileOverlayKind.Status
  ) {
    if ("connectionId" in overlay) {
      return (
        <Link
          href={`/chat/${overlay.connectionId}`}
          prefetch={false}
          aria-label={`Message ${personName}`}
          className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-600/30 inline-flex size-14 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(49,46,129,0.55)] transition focus-visible:outline-none focus-visible:ring-4 sm:h-12 sm:w-auto sm:px-5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          </svg>
          <span className="sr-only sm:not-sr-only">Message</span>
        </Link>
      );
    }

    return (
      <p className="rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-[0_16px_36px_-18px_rgba(15,15,15,0.55)]">
        {overlay.label}
      </p>
    );
  }

  return null;
};

interface LoadPersonInput {
  id: string;
}

const loadPerson = async ({
  id,
}: LoadPersonInput): Promise<PublicProfileLoadResult> => {
  try {
    return await loadPublicProfile({ id });
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? "Unable to load this profile"
          : "Unexpected profile failure",
      outcome: ProfileConstantsCollection.ProfileLoadOutcome.Failure,
    };
  }
};

export const generateMetadata = async ({
  params,
}: PageProps<"/people/[id]">): Promise<Metadata> => {
  const id = await resolvePersonId({ params });

  if (!id) {
    return {
      title: "Profile",
    };
  }

  const result = await loadPerson({ id });

  if (
    result.outcome !== ProfileConstantsCollection.ProfileLoadOutcome.Success
  ) {
    return {
      title: "Profile",
    };
  }

  return {
    title: result.profile.name,
    description: `View ${result.profile.name}'s profile on ${BrandConstantsCollection.DisplayName}.`,
  };
};

const PersonPage = async ({ params }: PageProps<"/people/[id]">) => {
  const id = await resolvePersonId({ params });

  if (!id) {
    notFound();
  }

  const [result, peerResult, viewerResult] = await Promise.all([
    loadPerson({ id }),
    loadPeerConnection({ peerUserId: id }),
    loadViewerProfile(),
  ]);

  if (
    result.outcome ===
      ProfileConstantsCollection.ProfileLoadOutcome.Unauthorized ||
    peerResult.outcome ===
      ConnectionsConstantsCollection.PeerConnectionLoadOutcome.Unauthorized ||
    viewerResult.outcome ===
      ProfileConstantsCollection.ProfileLoadOutcome.Unauthorized
  ) {
    redirect("/login");
  }

  if (
    result.outcome === ProfileConstantsCollection.ProfileLoadOutcome.NotFound
  ) {
    notFound();
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
  const viewerId =
    viewerResult.outcome ===
    ProfileConstantsCollection.ProfileLoadOutcome.Success
      ? viewerResult.profile.id
      : "";
  const overlay = getProfileOverlay({
    peerResult,
    profileId: profile.id,
    viewerId,
  });
  const overlayActions = getOverlayActions({
    overlay,
    personName: profile.name,
    profileId: profile.id,
  });
  const messageActionIsFloating =
    overlay.kind === ConnectionsConstantsCollection.ProfileOverlayKind.Status &&
    "connectionId" in overlay;

  return (
    <main className="bg-brand-surface text-zinc-950">
      <PersonProfileDetails
        actions={messageActionIsFloating ? undefined : overlayActions}
        eyebrow={
          overlay.kind ===
          ConnectionsConstantsCollection.ProfileOverlayKind.Review
            ? "Interested in you"
            : "Profile"
        }
        floatingActions={messageActionIsFloating ? overlayActions : undefined}
        profile={profile}
      />
    </main>
  );
};

export default PersonPage;

/*
 * Learning notes
 *
 * Next.js 16 async params
 * - Generated `PageProps<"/people/[id]">` types this route. `params` is a
 *   promise and must be awaited before reading `id`.
 * - Next.js 14.1 passed `params` as a plain object.
 *
 * Public profile fields
 * - Express public profiles now include bio, job, city, photos, and a `life`
 *   object (cinema, lifestyle, city, texture). Email and phone stay on the
 *   signed-in `/profile` page.
 */
