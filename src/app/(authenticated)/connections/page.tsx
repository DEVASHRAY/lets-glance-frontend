import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BrandMark } from "@/features/brand/brand-mark";
import { ConnectionsConstantsCollection } from "@/features/connections/connections.constants";
import { loadConnections } from "@/features/connections/connections.data";
import { ConnectionPortraitCard } from "@/features/connections/connection-portrait-card";
import { ReviewLikeForm } from "@/features/connections/review-like-form";
import type {
  ConnectionList,
  ConnectionsLoadResult,
} from "@/features/connections/connections.types";

export const metadata: Metadata = {
  title: "Connections",
  description: "View your connections and recent interest.",
};

interface ResolveConnectionListInput {
  value?: string | string[];
}

interface ConnectionTabProps {
  active: boolean;
  children: ReactNode;
  href: string;
}

interface GetEmptyStateInput {
  connectionType: ConnectionList;
}

interface EmptyStateContent {
  message: string;
  title: string;
}

const resolveConnectionList = ({
  value,
}: ResolveConnectionListInput): ConnectionList | undefined => {
  if (!value || Array.isArray(value)) {
    return undefined;
  }

  switch (value) {
    case ConnectionsConstantsCollection.ConnectionList.Matches:
      return ConnectionsConstantsCollection.ConnectionList.Matches;
    case ConnectionsConstantsCollection.ConnectionList.Received:
      return ConnectionsConstantsCollection.ConnectionList.Received;
    case ConnectionsConstantsCollection.ConnectionList.Sent:
      return ConnectionsConstantsCollection.ConnectionList.Sent;
    default:
      return undefined;
  }
};

const ConnectionTab = ({ active, children, href }: ConnectionTabProps) => {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          : "rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-500 transition hover:bg-white hover:text-zinc-950"
      }
    >
      {children}
    </Link>
  );
};

const getEmptyState = ({
  connectionType,
}: GetEmptyStateInput): EmptyStateContent => {
  switch (connectionType) {
    case ConnectionsConstantsCollection.ConnectionList.Received:
      return {
        message: "When someone is interested in you, they’ll appear here.",
        title: "No new interest yet",
      };
    case ConnectionsConstantsCollection.ConnectionList.Sent:
      return {
        message: "Profiles you choose to connect with will appear here.",
        title: "You haven't chosen anyone yet",
      };
    default:
      return {
        message:
          "When you both choose each other, your connections will appear here.",
        title: "No connections yet",
      };
  }
};

const ConnectionsPage = async ({ searchParams }: PageProps<"/connections">) => {
  let typeValue: string | string[] | undefined;

  try {
    const resolvedSearchParams = await searchParams;
    typeValue = resolvedSearchParams["type"];
  } catch (error) {
    if (error instanceof Error) {
      typeValue = undefined;
    }
  }

  const connectionType = resolveConnectionList({
    value: typeValue,
  });

  if (!connectionType) {
    redirect("/connections?type=matches");
  }

  let result: ConnectionsLoadResult | null = null;

  try {
    result = await loadConnections({
      connectionType,
    });
  } catch (error) {
    return (
      <main className="bg-brand-surface min-h-[calc(100svh-4rem)] px-4 py-12 text-zinc-950 sm:px-6">
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {error instanceof Error
            ? "Unable to load your connections"
            : "Unexpected connections failure"}
        </div>
      </main>
    );
  }

  if (
    result.outcome ===
    ConnectionsConstantsCollection.ConnectionsLoadOutcome.Unauthorized
  ) {
    redirect("/login");
  }

  if (
    result.outcome ===
    ConnectionsConstantsCollection.ConnectionsLoadOutcome.Failure
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

  const emptyState = getEmptyState({
    connectionType,
  });

  return (
    <main className="bg-brand-surface relative isolate min-h-[calc(100svh-4rem)] overflow-hidden px-4 py-10 text-zinc-950 sm:px-6 sm:py-14">
      <div
        aria-hidden="true"
        className="bg-brand-200/40 absolute top-0 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      <section className="mx-auto max-w-6xl">
        <p className="text-brand-700 text-xs font-bold tracking-[0.18em] uppercase">
          Your people
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          Connections
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-zinc-600">
          Keep up with the people you&apos;ve noticed and the connections
          you&apos;ve made.
        </p>

        <nav
          aria-label="Connection categories"
          className="mt-8 inline-flex flex-wrap rounded-2xl border border-zinc-200/80 bg-white/60 p-1.5 shadow-sm backdrop-blur"
        >
          <ConnectionTab
            active={
              connectionType ===
              ConnectionsConstantsCollection.ConnectionList.Matches
            }
            href="/connections?type=matches"
          >
            Connected
          </ConnectionTab>
          <ConnectionTab
            active={
              connectionType ===
              ConnectionsConstantsCollection.ConnectionList.Received
            }
            href="/connections?type=received"
          >
            Interested in you
          </ConnectionTab>
          <ConnectionTab
            active={
              connectionType ===
              ConnectionsConstantsCollection.ConnectionList.Sent
            }
            href="/connections?type=sent"
          >
            Sent
          </ConnectionTab>
        </nav>

        {result.connections.length ? (
          <ul
            aria-label="Connection profiles"
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {result.connections.map((connection) => {
              const isReceived =
                connectionType ===
                ConnectionsConstantsCollection.ConnectionList.Received;
              const isMatch =
                connectionType ===
                ConnectionsConstantsCollection.ConnectionList.Matches;

              return (
                <ConnectionPortraitCard
                  key={connection.connectionId}
                  actions={
                    isReceived ? (
                      <ReviewLikeForm
                        compact
                        connectionId={connection.connectionId}
                        personName={connection.profile.name}
                      />
                    ) : isMatch ? (
                      <Link
                        href={`/chat/${connection.connectionId}`}
                        prefetch={false}
                        aria-label={`Message ${connection.profile.name}`}
                        className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-600/30 inline-flex size-10 items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 sm:h-9 sm:w-auto sm:px-3"
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
                    ) : null
                  }
                  profile={connection.profile}
                />
              );
            })}
          </ul>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-dashed border-zinc-300 bg-white/65 px-6 py-16 text-center backdrop-blur">
            <BrandMark className="mx-auto size-14 shadow-lg shadow-indigo-500/15" />
            <h2 className="mt-5 text-xl font-semibold">{emptyState.title}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              {emptyState.message}
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default ConnectionsPage;

/*
 * Learning notes
 *
 * Next.js 16 async search parameters
 * - Generated `PageProps` provides the route-aware type and `searchParams` is
 *   awaited before selecting the server-rendered connection category.
 * - A missing or unsupported `type` redirects to the canonical
 *   `/connections?type=matches` URL, keeping the address bar and active tab in
 *   sync.
 * - Next.js 14.1 exposed `searchParams` synchronously in page props.
 *
 * Server rendering
 * - Only the selected category is requested, avoiding a three-request waterfall
 *   and unnecessary payload for tabs the user has not opened.
 */
