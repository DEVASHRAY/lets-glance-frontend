import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import { ConversationInbox } from "@/features/chat/conversation-inbox";
import { loadConversationInbox } from "@/features/chat/chat.data";

export const metadata: Metadata = {
  title: "Messages | Tinder Lite",
  description: "Continue conversations with your Tinder Lite matches.",
};

const ChatInboxPage = async () => {
  let result: Awaited<ReturnType<typeof loadConversationInbox>>;

  try {
    result = await loadConversationInbox();
  } catch (error) {
    return (
      <main className="min-h-[calc(100svh-4rem)] bg-[#fff8f6] px-4 py-10 sm:px-6">
        <p
          role="alert"
          className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          {error instanceof Error
            ? "Unable to load your conversations"
            : "Unexpected conversation inbox failure"}
        </p>
      </main>
    );
  }

  if (
    result.outcome ===
    ChatConstantsCollection.ConversationInboxLoadOutcome.Unauthorized
  ) {
    redirect("/login");
  }

  if (
    result.outcome ===
    ChatConstantsCollection.ConversationInboxLoadOutcome.Failure
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

  // A refreshed server snapshot remounts the inbox so its local realtime state starts from authoritative data.
  const inboxSnapshotKey = result.conversations
    .map(
      (conversation) =>
        `${conversation.conversationId}:${String(conversation.lastMessage.sequenceNumber)}:${String(conversation.unreadCount)}:${conversation.lastMessage.deliveryStatus ?? "incoming"}`,
    )
    .join("|");

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-[#fff8f6] px-4 py-10 text-zinc-950 sm:px-6">
      <section className="mx-auto max-w-2xl">
        <p className="text-xs font-bold tracking-[0.18em] text-[#d91d60] uppercase">
          Your conversations
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
          Messages
        </h1>

        <ConversationInbox
          key={inboxSnapshotKey}
          initialConversations={result.conversations}
          initialNextCursor={result.nextCursor}
        />
      </section>
    </main>
  );
};

export default ChatInboxPage;

/*
 * The page keeps its fetch and Zod validation in a Server Component, then
 * passes validated data to the focused Client Component that owns realtime
 * inbox behavior. Next.js 14.1 supported the same server/client composition;
 * Next.js 16 keeps that boundary model.
 */
