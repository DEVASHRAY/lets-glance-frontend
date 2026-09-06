"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import {
  ChatSchemasCollection,
  type ConversationInboxItem,
} from "@/features/chat/chat.schemas";
import { InboxTimestamp } from "@/features/chat/chat-timestamp";
import { chatSocket } from "@/features/chat/chat-socket";
import type {
  MessageCreatedPayload,
  MessageReceiptPayload,
} from "@/features/chat/chat-socket.types";
import { MessageDeliveryIcon } from "@/features/chat/message-delivery-icon";
import { ProfileAvatar } from "@/features/profile/profile-avatar";

interface ConversationInboxProps {
  initialConversations: ConversationInboxItem[];
  initialNextCursor: string | null;
}

interface UpdateDeliveryStatusInput {
  payload: MessageReceiptPayload;
  status:
    | typeof ChatConstantsCollection.MessageDeliveryStatus.Delivered
    | typeof ChatConstantsCollection.MessageDeliveryStatus.Read;
}

const lastMessagePreviewMaxLength = 120;

export const ConversationInbox = ({
  initialConversations,
  initialNextCursor,
}: ConversationInboxProps) => {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [olderConversationsError, setOlderConversationsError] = useState("");
  const [olderConversationsPending, startOlderConversationsTransition] =
    useTransition();
  const conversationsRef = useRef(initialConversations);
  const nextCursorRef = useRef(initialNextCursor);
  const paginationSentinel = useRef<HTMLDivElement>(null);
  const paginationRequestPending = useRef(false);
  const paginationAbortController = useRef<AbortController | null>(null);
  const inboxMayBeStale = useRef(false);

  const loadOlderConversations = useCallback(async (): Promise<void> => {
    const cursor = nextCursorRef.current;

    if (!cursor || paginationRequestPending.current) {
      return;
    }

    paginationRequestPending.current = true;
    setOlderConversationsError("");

    const abortController = new AbortController();
    paginationAbortController.current = abortController;

    try {
      const response = await fetch(
        `/api/v1/chat/conversations?cursor=${encodeURIComponent(cursor)}`,
        {
          cache: "no-store",
          method: "GET",
          signal: abortController.signal,
        },
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setOlderConversationsError("Older conversations could not be loaded");
        return;
      }

      const parsedResponse =
        ChatSchemasCollection.conversationInboxResponse.safeParse(
          await response.json(),
        );

      if (!parsedResponse.success) {
        setOlderConversationsError(
          "Older conversations returned an invalid response",
        );
        return;
      }

      const currentConversations = conversationsRef.current;
      const loadedConversationIds = new Set(
        currentConversations.map((conversation) => conversation.conversationId),
      );
      const olderConversations = parsedResponse.data.data.items.filter(
        (conversation) =>
          !loadedConversationIds.has(conversation.conversationId),
      );
      const nextConversations = [
        ...currentConversations,
        ...olderConversations,
      ];

      conversationsRef.current = nextConversations;
      setConversations(nextConversations);

      for (const conversation of parsedResponse.data.data.items) {
        if (
          chatSocket.connected &&
          conversation.lastMessage.deliveryAcknowledgementRequired
        ) {
          chatSocket.emit("message.mark-delivered", {
            conversationId: conversation.conversationId,
            sequenceNumber: conversation.lastMessage.sequenceNumber,
          });
        }
      }

      nextCursorRef.current = parsedResponse.data.data.nextCursor;
      setNextCursor(parsedResponse.data.data.nextCursor);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setOlderConversationsError(
        error instanceof Error
          ? "Unable to load older conversations"
          : "Unexpected conversation loading failure",
      );
    } finally {
      if (paginationAbortController.current === abortController) {
        paginationAbortController.current = null;
      }

      paginationRequestPending.current = false;
    }
  }, [router]);

  const requestOlderConversations = useCallback(() => {
    if (!nextCursorRef.current || paginationRequestPending.current) {
      return;
    }

    startOlderConversationsTransition(async () => {
      try {
        await loadOlderConversations();
      } catch (error) {
        setOlderConversationsError(
          error instanceof Error
            ? "Unable to load older conversations"
            : "Unexpected conversation loading failure",
        );
      }
    });
  }, [loadOlderConversations]);

  useEffect(() => {
    const sentinel = paginationSentinel.current;

    if (!sentinel || !nextCursor) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          requestOlderConversations();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [nextCursor, requestOlderConversations]);

  useEffect(() => {
    return () => {
      const abortController = paginationAbortController.current;

      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  useEffect(() => {
    const acknowledgeDeliveredMessages = () => {
      for (const conversation of conversationsRef.current) {
        if (!conversation.lastMessage.deliveryAcknowledgementRequired) {
          continue;
        }

        chatSocket.emit("message.mark-delivered", {
          conversationId: conversation.conversationId,
          sequenceNumber: conversation.lastMessage.sequenceNumber,
        });
      }
    };

    const receiveMessageCreated = (payload: MessageCreatedPayload) => {
      const currentConversations = conversationsRef.current;
      const conversation = currentConversations.find(
        (currentConversation) =>
          currentConversation.conversationId === payload.conversationId,
      );

      if (!conversation) {
        router.refresh();
        return;
      }

      if (payload.sequenceNumber <= conversation.lastMessage.sequenceNumber) {
        return;
      }

      const messageIsIncoming = payload.senderId === conversation.peer.id;
      const unreadCount =
        messageIsIncoming && conversation.unreadCount < Number.MAX_SAFE_INTEGER
          ? conversation.unreadCount + 1
          : conversation.unreadCount;

      const updatedConversation: ConversationInboxItem = {
        ...conversation,
        lastMessage: {
          createdAt: payload.createdAt,
          deliveryAcknowledgementRequired: messageIsIncoming,
          deliveryStatus: messageIsIncoming
            ? null
            : ChatConstantsCollection.MessageDeliveryStatus.Sent,
          sentByAuthenticatedUser: !messageIsIncoming,
          sequenceNumber: payload.sequenceNumber,
          textPreview: payload.text.slice(0, lastMessagePreviewMaxLength),
        },
        unreadCount,
      };
      const nextConversations = [
        updatedConversation,
        ...currentConversations.filter(
          (currentConversation) =>
            currentConversation.conversationId !== payload.conversationId,
        ),
      ];

      conversationsRef.current = nextConversations;
      setConversations(nextConversations);

      if (!messageIsIncoming) {
        return;
      }

      chatSocket.emit("message.mark-delivered", {
        conversationId: payload.conversationId,
        sequenceNumber: payload.sequenceNumber,
      });
    };

    const updateDeliveryStatus = ({
      payload,
      status,
    }: UpdateDeliveryStatusInput) => {
      const currentConversations = conversationsRef.current;
      const conversation = currentConversations.find(
        (currentConversation) =>
          currentConversation.conversationId === payload.conversationId,
      );

      if (
        !conversation ||
        !conversation.lastMessage.sentByAuthenticatedUser ||
        conversation.lastMessage.sequenceNumber > payload.sequenceNumber ||
        !conversation.lastMessage.deliveryStatus ||
        conversation.lastMessage.deliveryStatus ===
          ChatConstantsCollection.MessageDeliveryStatus.Read ||
        conversation.lastMessage.deliveryStatus === status
      ) {
        return;
      }

      const nextConversations = currentConversations.map(
        (currentConversation) =>
          currentConversation.conversationId === payload.conversationId
            ? {
                ...currentConversation,
                lastMessage: {
                  ...currentConversation.lastMessage,
                  deliveryStatus: status,
                },
              }
            : currentConversation,
      );

      conversationsRef.current = nextConversations;
      setConversations(nextConversations);
    };

    const markOutgoingMessageDelivered = (payload: MessageReceiptPayload) => {
      updateDeliveryStatus({
        payload,
        status: ChatConstantsCollection.MessageDeliveryStatus.Delivered,
      });
    };

    const markOutgoingMessageRead = (payload: MessageReceiptPayload) => {
      updateDeliveryStatus({
        payload,
        status: ChatConstantsCollection.MessageDeliveryStatus.Read,
      });
    };

    const synchronizeAfterReconnect = () => {
      acknowledgeDeliveredMessages();

      if (!inboxMayBeStale.current) {
        return;
      }

      inboxMayBeStale.current = false;
      router.refresh();
    };

    const rememberDisconnect = () => {
      inboxMayBeStale.current = true;
    };

    chatSocket.on("connect", synchronizeAfterReconnect);
    chatSocket.on("disconnect", rememberDisconnect);
    chatSocket.on("message.created", receiveMessageCreated);
    chatSocket.on("message.delivered", markOutgoingMessageDelivered);
    chatSocket.on("message.read", markOutgoingMessageRead);

    if (chatSocket.connected) {
      acknowledgeDeliveredMessages();
    }

    return () => {
      chatSocket.off("connect", synchronizeAfterReconnect);
      chatSocket.off("disconnect", rememberDisconnect);
      chatSocket.off("message.created", receiveMessageCreated);
      chatSocket.off("message.delivered", markOutgoingMessageDelivered);
      chatSocket.off("message.read", markOutgoingMessageRead);
    };
  }, [router]);

  if (!conversations.length) {
    return (
      <div className="border-brand-border-strong bg-brand-panel/75 mt-8 rounded-3xl border border-dashed px-6 py-14 text-center">
        <h2 className="text-lg font-semibold">No messages yet</h2>
        <p className="text-brand-subtle mt-2 text-sm leading-6">
          Your conversations will appear here after you message a connection.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul
        aria-label="Conversation inbox"
        className="border-brand-border bg-brand-panel mt-8 overflow-hidden rounded-3xl border"
      >
        {conversations.map((conversation) => {
          const peerName = conversation.peer.name ?? "Member";
          const deliveryStatus = conversation.lastMessage.deliveryStatus;

          return (
            <li
              key={conversation.conversationId}
              className="border-brand-border border-b last:border-b-0"
            >
              <Link
                href={`/chat/${conversation.connectionId}`}
                className="hover:bg-brand-50 focus-visible:ring-brand-600/70 flex min-h-20 items-center gap-4 px-4 py-3 transition focus-visible:ring-4 focus-visible:ring-inset focus-visible:outline-none"
              >
                <ProfileAvatar
                  className="size-14 rounded-full text-base"
                  name={peerName}
                  photoUrl={conversation.peer.photoUrl ?? undefined}
                  sizes="56px"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-semibold">{peerName}</span>
                    <InboxTimestamp
                      dateTime={conversation.lastMessage.createdAt}
                      className="text-brand-subtle shrink-0 text-xs"
                    />
                  </span>

                  <span className="text-brand-subtle mt-1 flex items-center gap-1.5 text-sm">
                    {conversation.lastMessage.sentByAuthenticatedUser &&
                    deliveryStatus ? (
                      <MessageDeliveryIcon status={deliveryStatus} />
                    ) : null}
                    <span className="truncate">
                      {conversation.lastMessage.textPreview}
                    </span>
                  </span>
                </span>

                {conversation.unreadCount ? (
                  <span
                    aria-label={`${String(conversation.unreadCount)} unread messages`}
                    className="bg-brand-600 flex min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 py-1 text-xs font-bold text-white"
                  >
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      {nextCursor ? (
        <div
          ref={paginationSentinel}
          className="flex min-h-16 items-center justify-center"
        >
          {olderConversationsPending ? (
            <span
              role="status"
              aria-live="polite"
              className="text-brand-subtle flex items-center gap-2 text-sm font-medium"
            >
              <span
                aria-hidden="true"
                className="border-brand-border-strong border-t-brand-600 size-4 animate-spin rounded-full border-2"
              />
              Loading older conversations
            </span>
          ) : olderConversationsError ? (
            <button
              type="button"
              onClick={requestOlderConversations}
              className="rounded-full px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              Retry loading conversations
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

/*
 * React 19's async Transition keeps pagination pending across `await`; React
 * 18.2 required separate pending state after asynchronous work. Effect cleanup
 * otherwise follows the same model and removes observers and socket listeners.
 * Next.js 16 `router.refresh()` merges a fresh Server Component payload for an
 * unknown conversation; Next.js 14.1 exposed the same client-router method.
 */
