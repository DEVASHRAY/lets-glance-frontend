import { randomUUID } from "node:crypto";

import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import { ConversationMessages } from "@/features/chat/conversation-messages";
import { loadMessageHistory } from "@/features/chat/chat.data";
import { ProfileAvatar } from "@/features/profile/profile-avatar";

export const metadata: Metadata = {
  title: "Conversation",
  description: "Read your conversation.",
};

export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
  themeColor: "#f8fafc",
  viewportFit: "cover",
};

const ChatConversationPage = async ({
  params,
}: PageProps<"/chat/[connectionId]">) => {
  let connectionId: string;

  try {
    connectionId = (await params).connectionId.trim();
  } catch (error) {
    if (error instanceof Error) {
      notFound();
    }

    notFound();
  }

  let result: Awaited<ReturnType<typeof loadMessageHistory>>;

  try {
    result = await loadMessageHistory({ connectionId });
  } catch (error) {
    return (
      <main className="bg-brand-surface min-h-[calc(100svh-4rem)] px-4 py-10 sm:px-6">
        <p
          role="alert"
          className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {error instanceof Error
            ? "Unable to load your messages"
            : "Unexpected message-history failure"}
        </p>
      </main>
    );
  }

  if (
    result.outcome ===
    ChatConstantsCollection.MessageHistoryLoadOutcome.Unauthorized
  ) {
    redirect("/login");
  }

  if (
    result.outcome === ChatConstantsCollection.MessageHistoryLoadOutcome.Missing
  ) {
    notFound();
  }

  if (
    result.outcome === ChatConstantsCollection.MessageHistoryLoadOutcome.Failure
  ) {
    return (
      <main className="bg-brand-surface min-h-[calc(100svh-4rem)] px-4 py-10 sm:px-6">
        <p
          role="alert"
          className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {result.message}
        </p>
      </main>
    );
  }

  const peerName = result.peer.name ?? "Member";

  return (
    <main className="chat-conversation-shell bg-brand-surface text-zinc-950">
      <section className="mx-auto flex h-full min-h-0 max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-zinc-100 px-4">
          <Link
            href="/chat"
            aria-label="Back to inbox"
            className="focus-visible:ring-brand-600/20 flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>

          <Link
            href={`/people/${result.peer.id}`}
            prefetch={false}
            className="focus-visible:ring-brand-600/20 flex min-w-0 items-center gap-3 rounded-xl py-1 pr-3 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4"
          >
            <ProfileAvatar
              className="size-10 rounded-full text-sm"
              name={peerName}
              photoUrl={result.peer.photoUrl ?? undefined}
              sizes="40px"
            />
            <span className="min-w-0">
              <h1 className="truncate font-semibold">{peerName}</h1>
              <span className="block text-xs text-zinc-500">View profile</span>
            </span>
          </Link>
        </header>

        <ConversationMessages
          key={connectionId}
          authenticatedUserId={result.authenticatedUserId}
          connectionId={connectionId}
          initialClientMessageId={randomUUID()}
          initialMessages={result.messages}
          initialNextLastLoadedSequenceNumber={
            result.nextLastLoadedSequenceNumber
          }
          readAcknowledgementRequired={result.readAcknowledgementRequired}
          readAcknowledgementSequenceNumber={
            result.readAcknowledgementSequenceNumber
          }
        />
      </section>
    </main>
  );
};

export default ChatConversationPage;

/*
 * Next.js 16 generated `PageProps` provides the typed dynamic route parameter,
 * and `params` must be awaited before reading `connectionId`. Next.js 14.1
 * commonly used handwritten props and exposed route parameters synchronously.
 *
 * The static viewport export enables safe-area insets and asks supporting
 * browsers to resize for the software keyboard without restricting user zoom.
 * Next.js 14.1 exposed the same static API, but iOS still needs the layout's
 * Visual Viewport fallback because WebKit does not honor `interactiveWidget`.
 *
 * Node's `randomUUID` creates a non-secret idempotency key on the server. The
 * Client Component preserves it for retries and rotates it after a successful
 * send, so one logical message keeps one identity.
 */
