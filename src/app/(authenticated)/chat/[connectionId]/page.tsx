import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import { ConversationMessages } from "@/features/chat/conversation-messages";
import { loadMessageHistory } from "@/features/chat/chat.data";

export const metadata: Metadata = {
  title: "Conversation | Tinder Lite",
  description: "Read your Tinder Lite conversation.",
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
      <main className="min-h-[calc(100svh-4rem)] bg-[#fff8f6] px-4 py-10 sm:px-6">
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
      <main className="min-h-[calc(100svh-4rem)] bg-[#fff8f6] px-4 py-10 sm:px-6">
        <p
          role="alert"
          className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {result.message}
        </p>
      </main>
    );
  }

  return (
    <main className="fixed inset-x-0 top-16 bottom-0 overflow-hidden bg-[#fff8f6] px-4 py-4 text-zinc-950 sm:px-6 sm:py-6">
      <section className="mx-auto flex h-full min-h-0 max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-zinc-100 px-4">
          <Link
            href="/chat"
            aria-label="Back to inbox"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f32672]/20"
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

          <div>
            <h1 className="font-semibold">Conversation</h1>
            <p className="text-xs text-zinc-500">Your latest messages</p>
          </div>
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
 * Node's `randomUUID` creates a non-secret idempotency key on the server. The
 * Client Component preserves it for retries and rotates it after a successful
 * send, so one logical message keeps one identity.
 */
