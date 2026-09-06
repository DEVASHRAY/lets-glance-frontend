"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import {
  ChatSchemasCollection,
  type MessageHistoryItem,
} from "@/features/chat/chat.schemas";
import { MessageTimestamp } from "@/features/chat/chat-timestamp";
import { MessageDeliveryIcon } from "@/features/chat/message-delivery-icon";
import { chatSocket } from "@/features/chat/chat-socket";
import type {
  MessageCreatedPayload,
  MessageReceiptPayload,
} from "@/features/chat/chat-socket.types";
import {
  sendMessageAction,
  type SendMessageActionState,
} from "@/features/chat/send-message.action";

interface ConversationMessagesProps {
  authenticatedUserId: string;
  connectionId: string;
  initialClientMessageId: string;
  initialMessages: MessageHistoryItem[];
  initialNextLastLoadedSequenceNumber: number | null;
  readAcknowledgementRequired: boolean;
  readAcknowledgementSequenceNumber: number | null;
}

interface InsertMessageInput {
  currentMessages: MessageHistoryItem[];
  message: MessageHistoryItem;
}

interface OptimisticMessage {
  clientMessageId: string;
  createdAt: string;
  id: string;
  optimistic: true;
  text: string;
}

type RenderedMessage = MessageHistoryItem | OptimisticMessage;

interface MessageSubmitButtonProps {
  messageIsEmpty: boolean;
  pending: boolean;
}

interface PendingScrollRestoration {
  scrollHeight: number;
  scrollTop: number;
}

const initialSendMessageActionState = {
  message: "",
  outcome: ChatConstantsCollection.SendMessageOutcome.Idle,
} satisfies SendMessageActionState;

const insertMessage = ({
  currentMessages,
  message,
}: InsertMessageInput): MessageHistoryItem[] => {
  if (
    currentMessages.some(
      (currentMessage) =>
        currentMessage.id === message.id ||
        currentMessage.sequenceNumber === message.sequenceNumber,
    )
  ) {
    return currentMessages;
  }

  const insertionIndex = currentMessages.findIndex(
    (currentMessage) => currentMessage.sequenceNumber > message.sequenceNumber,
  );

  if (insertionIndex < 0) {
    return [...currentMessages, message];
  }

  return [
    ...currentMessages.slice(0, insertionIndex),
    message,
    ...currentMessages.slice(insertionIndex),
  ];
};

const MessageSubmitButton = ({
  messageIsEmpty,
  pending,
}: MessageSubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={pending || messageIsEmpty}
      className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-600/25 flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={pending ? "Sending message" : "Send message"}
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
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    </button>
  );
};

export const ConversationMessages = ({
  authenticatedUserId,
  connectionId,
  initialClientMessageId,
  initialMessages,
  initialNextLastLoadedSequenceNumber,
  readAcknowledgementRequired,
  readAcknowledgementSequenceNumber,
}: ConversationMessagesProps) => {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    RenderedMessage[],
    OptimisticMessage
  >(messages, (currentMessages, optimisticMessage) => {
    if (
      currentMessages.some(
        (message) =>
          message.clientMessageId === optimisticMessage.clientMessageId,
      )
    ) {
      return currentMessages;
    }

    return [...currentMessages, optimisticMessage];
  });
  const [nextLastLoadedSequenceNumber, setNextLastLoadedSequenceNumber] =
    useState(initialNextLastLoadedSequenceNumber);
  const [olderMessagesError, setOlderMessagesError] = useState("");
  const [olderMessagesPending, startOlderMessagesTransition] = useTransition();
  const [messageText, setMessageText] = useState("");
  const [clientMessageId, setClientMessageId] = useState(
    initialClientMessageId,
  );
  const messageViewport = useRef<HTMLDivElement>(null);
  const messageTextarea = useRef<HTMLTextAreaElement>(null);
  const shouldScrollToLatestMessage = useRef(true);
  const olderMessagesRequestPending = useRef(false);
  const olderMessagesAbortController = useRef<AbortController | null>(null);
  const reconnectSynchronizationPending = useRef(false);
  const reconnectSynchronizationAbortController =
    useRef<AbortController | null>(null);
  const conversationMayBeStale = useRef(false);
  const pendingScrollRestoration = useRef<PendingScrollRestoration | null>(
    null,
  );
  const loadedMessageIds = useRef(
    new Set(initialMessages.map((message) => message.id)),
  );
  const loadedSequenceNumbers = useRef(
    new Set(initialMessages.map((message) => message.sequenceNumber)),
  );
  const initialConversation = initialMessages.at(-1);
  const pendingIncomingReceipt = useRef<MessageReceiptPayload | null>(
    initialConversation &&
      readAcknowledgementRequired &&
      readAcknowledgementSequenceNumber
      ? {
          conversationId: initialConversation.conversationId,
          sequenceNumber: readAcknowledgementSequenceNumber,
        }
      : null,
  );
  const deliveredThroughSequenceNumber = useRef(0);
  const readThroughSequenceNumber = useRef(0);

  const processSendMessage = async (
    previousState: SendMessageActionState,
    formData: FormData,
  ): Promise<SendMessageActionState> => {
    let submittedMessageText = "";
    const restoreSubmittedMessage = () => {
      setMessageText((currentText) => currentText || submittedMessageText);
    };

    try {
      const submittedClientMessageId = formData.get("clientMessageId");
      const submittedText = formData.get("text");

      if (
        typeof submittedClientMessageId === "string" &&
        submittedClientMessageId &&
        typeof submittedText === "string" &&
        submittedText.trim()
      ) {
        submittedMessageText = submittedText.trim();
        shouldScrollToLatestMessage.current = true;
        addOptimisticMessage({
          clientMessageId: submittedClientMessageId,
          createdAt: new Date().toISOString(),
          id: `optimistic:${submittedClientMessageId}`,
          optimistic: true,
          text: submittedMessageText,
        });
      }

      const result = await sendMessageAction(previousState, formData);

      if (
        result.outcome ===
        ChatConstantsCollection.SendMessageOutcome.Unauthorized
      ) {
        router.replace("/login");
        return result;
      }

      if (
        result.outcome === ChatConstantsCollection.SendMessageOutcome.Conflict
      ) {
        restoreSubmittedMessage();

        if (
          result.submittedClientMessageId &&
          result.submittedClientMessageId === clientMessageId
        ) {
          setClientMessageId(crypto.randomUUID());
        }

        return result;
      }

      if (
        result.outcome !== ChatConstantsCollection.SendMessageOutcome.Success ||
        !result.sentMessage
      ) {
        restoreSubmittedMessage();
        return result;
      }

      const sentMessage = result.sentMessage;
      loadedMessageIds.current.add(sentMessage.id);
      loadedSequenceNumbers.current.add(sentMessage.sequenceNumber);
      shouldScrollToLatestMessage.current = true;

      setMessages((currentMessages) =>
        insertMessage({
          currentMessages,
          message: {
            ...sentMessage,
            deliveryStatus: ChatConstantsCollection.MessageDeliveryStatus.Sent,
          },
        }),
      );
      setClientMessageId(crypto.randomUUID());

      return result;
    } catch (error) {
      restoreSubmittedMessage();

      return {
        message:
          error instanceof Error
            ? "Unable to complete message sending"
            : "Unexpected message action failure",
        outcome: ChatConstantsCollection.SendMessageOutcome.Failure,
      };
    }
  };

  const [sendMessageState, sendMessageFormAction, sendMessagePending] =
    useActionState(processSendMessage, initialSendMessageActionState);
  const latestMessageId = optimisticMessages.at(-1)?.id;

  const loadOlderMessages = async (): Promise<void> => {
    if (!nextLastLoadedSequenceNumber || olderMessagesRequestPending.current) {
      return;
    }

    olderMessagesRequestPending.current = true;
    setOlderMessagesError("");

    const abortController = new AbortController();
    olderMessagesAbortController.current = abortController;
    const searchParams = new URLSearchParams({
      lastLoadedSequenceNumber: String(nextLastLoadedSequenceNumber),
    });

    try {
      const response = await fetch(
        `/api/v1/chat/connections/${encodeURIComponent(connectionId)}/messages?${searchParams.toString()}`,
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
        setOlderMessagesError("Older messages could not be loaded");
        return;
      }

      const parsedResponse =
        ChatSchemasCollection.messageHistoryResponse.safeParse(
          await response.json(),
        );

      if (
        !parsedResponse.success ||
        parsedResponse.data.data.authenticatedUserId !== authenticatedUserId
      ) {
        setOlderMessagesError("Older messages returned an invalid response");
        return;
      }

      const olderMessages: MessageHistoryItem[] = [];

      for (const message of parsedResponse.data.data.items) {
        if (
          loadedMessageIds.current.has(message.id) ||
          loadedSequenceNumbers.current.has(message.sequenceNumber)
        ) {
          continue;
        }

        loadedMessageIds.current.add(message.id);
        loadedSequenceNumbers.current.add(message.sequenceNumber);
        olderMessages.push(message);
      }

      const viewport = messageViewport.current;

      if (viewport && olderMessages.length) {
        pendingScrollRestoration.current = {
          scrollHeight: viewport.scrollHeight,
          scrollTop: viewport.scrollTop,
        };

        setMessages((currentMessages) => {
          let nextMessages = currentMessages;

          for (const message of olderMessages) {
            nextMessages = insertMessage({
              currentMessages: nextMessages,
              message,
            });
          }

          return nextMessages;
        });
      }

      setNextLastLoadedSequenceNumber(
        parsedResponse.data.data.nextLastLoadedSequenceNumber,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setOlderMessagesError(
        error instanceof Error
          ? "Unable to load older messages"
          : "Unexpected older-message failure",
      );
    } finally {
      if (olderMessagesAbortController.current === abortController) {
        olderMessagesAbortController.current = null;
      }

      olderMessagesRequestPending.current = false;
    }
  };

  const requestOlderMessages = () => {
    if (!nextLastLoadedSequenceNumber || olderMessagesRequestPending.current) {
      return;
    }

    startOlderMessagesTransition(async () => {
      try {
        await loadOlderMessages();
      } catch (error) {
        setOlderMessagesError(
          error instanceof Error
            ? "Unable to load older messages"
            : "Unexpected older-message failure",
        );
      }
    });
  };

  useLayoutEffect(() => {
    const textarea = messageTextarea.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${String(Math.min(textarea.scrollHeight, 128))}px`;
  }, [messageText]);

  useLayoutEffect(() => {
    const viewport = messageViewport.current;
    const previousPosition = pendingScrollRestoration.current;

    if (!viewport || !previousPosition) {
      return;
    }

    viewport.scrollTop =
      viewport.scrollHeight -
      previousPosition.scrollHeight +
      previousPosition.scrollTop;
    pendingScrollRestoration.current = null;
  }, [messages.length]);

  useEffect(() => {
    return () => {
      const abortController = olderMessagesAbortController.current;

      if (abortController) {
        abortController.abort();
      }

      const reconnectAbortController =
        reconnectSynchronizationAbortController.current;

      if (reconnectAbortController) {
        reconnectAbortController.abort();
      }
    };
  }, []);

  useEffect(() => {
    const viewport = messageViewport.current;

    if (!viewport || !latestMessageId || !shouldScrollToLatestMessage.current) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
    shouldScrollToLatestMessage.current = false;
  }, [latestMessageId]);

  useEffect(() => {
    const acknowledgePendingIncomingMessage = () => {
      const receipt = pendingIncomingReceipt.current;

      if (!receipt || !chatSocket.connected) {
        return;
      }

      if (document.visibilityState === "visible") {
        if (readThroughSequenceNumber.current >= receipt.sequenceNumber) {
          return;
        }

        chatSocket.emit("message.mark-read", receipt);
        readThroughSequenceNumber.current = receipt.sequenceNumber;
        deliveredThroughSequenceNumber.current = receipt.sequenceNumber;
        return;
      }

      if (deliveredThroughSequenceNumber.current >= receipt.sequenceNumber) {
        return;
      }

      chatSocket.emit("message.mark-delivered", receipt);
      deliveredThroughSequenceNumber.current = receipt.sequenceNumber;
    };

    const synchronizeMessageHistory = async (): Promise<boolean> => {
      const abortController = new AbortController();
      reconnectSynchronizationAbortController.current = abortController;

      try {
        const response = await fetch(
          `/api/v1/chat/connections/${encodeURIComponent(connectionId)}/messages`,
          {
            cache: "no-store",
            method: "GET",
            signal: abortController.signal,
          },
        );

        if (response.status === 401) {
          router.replace("/login");
          return true;
        }

        if (!response.ok) {
          return false;
        }

        const parsedResponse =
          ChatSchemasCollection.messageHistoryResponse.safeParse(
            await response.json(),
          );

        if (
          !parsedResponse.success ||
          parsedResponse.data.data.authenticatedUserId !== authenticatedUserId
        ) {
          return false;
        }

        const synchronizedMessages = parsedResponse.data.data.items;
        const earliestSynchronizedMessage = synchronizedMessages.at(0);
        const historyGapDetected =
          earliestSynchronizedMessage &&
          earliestSynchronizedMessage.sequenceNumber > 1 &&
          !loadedSequenceNumbers.current.has(
            earliestSynchronizedMessage.sequenceNumber,
          ) &&
          !loadedSequenceNumbers.current.has(
            earliestSynchronizedMessage.sequenceNumber - 1,
          );
        const containsNewMessage = synchronizedMessages.some(
          (message) =>
            !loadedMessageIds.current.has(message.id) &&
            !loadedSequenceNumbers.current.has(message.sequenceNumber),
        );

        if (containsNewMessage) {
          const viewport = messageViewport.current;
          shouldScrollToLatestMessage.current =
            !viewport ||
            viewport.scrollHeight -
              viewport.scrollTop -
              viewport.clientHeight <=
              96;
        }

        for (const message of synchronizedMessages) {
          loadedMessageIds.current.add(message.id);
          loadedSequenceNumbers.current.add(message.sequenceNumber);
        }

        if (historyGapDetected) {
          setNextLastLoadedSequenceNumber(
            parsedResponse.data.data.nextLastLoadedSequenceNumber,
          );
        }

        setMessages((currentMessages) => {
          let nextMessages = currentMessages;

          for (const message of synchronizedMessages) {
            const existingMessageIndex = nextMessages.findIndex(
              (currentMessage) =>
                currentMessage.id === message.id ||
                currentMessage.sequenceNumber === message.sequenceNumber,
            );

            if (existingMessageIndex < 0) {
              nextMessages = insertMessage({
                currentMessages: nextMessages,
                message,
              });
              continue;
            }

            nextMessages = nextMessages.map((currentMessage, index) =>
              index === existingMessageIndex ? message : currentMessage,
            );
          }

          return nextMessages;
        });

        const latestSynchronizedMessage = synchronizedMessages.at(-1);

        if (
          latestSynchronizedMessage &&
          parsedResponse.data.data.readAcknowledgementRequired &&
          parsedResponse.data.data.readAcknowledgementSequenceNumber
        ) {
          pendingIncomingReceipt.current = {
            conversationId: latestSynchronizedMessage.conversationId,
            sequenceNumber:
              parsedResponse.data.data.readAcknowledgementSequenceNumber,
          };
        }

        return true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return false;
        }

        return false;
      } finally {
        if (
          reconnectSynchronizationAbortController.current === abortController
        ) {
          reconnectSynchronizationAbortController.current = null;
        }
      }
    };

    const receiveMessageCreated = (payload: MessageCreatedPayload) => {
      if (
        payload.connectionId !== connectionId ||
        loadedMessageIds.current.has(payload.id) ||
        loadedSequenceNumbers.current.has(payload.sequenceNumber)
      ) {
        return;
      }

      loadedMessageIds.current.add(payload.id);
      loadedSequenceNumbers.current.add(payload.sequenceNumber);

      const createdMessage: MessageHistoryItem = {
        clientMessageId: payload.clientMessageId,
        conversationId: payload.conversationId,
        createdAt: payload.createdAt,
        deliveryStatus:
          payload.senderId === authenticatedUserId
            ? ChatConstantsCollection.MessageDeliveryStatus.Sent
            : null,
        id: payload.id,
        senderId: payload.senderId,
        sequenceNumber: payload.sequenceNumber,
        text: payload.text,
      };

      const viewport = messageViewport.current;
      const nearLatestMessage =
        !viewport ||
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <=
          96;
      shouldScrollToLatestMessage.current =
        payload.senderId === authenticatedUserId || nearLatestMessage;

      setMessages((currentMessages) =>
        insertMessage({
          currentMessages,
          message: createdMessage,
        }),
      );

      if (payload.senderId === authenticatedUserId) {
        return;
      }

      const currentPendingReceipt = pendingIncomingReceipt.current;

      if (
        !currentPendingReceipt ||
        payload.sequenceNumber > currentPendingReceipt.sequenceNumber
      ) {
        pendingIncomingReceipt.current = {
          conversationId: payload.conversationId,
          sequenceNumber: payload.sequenceNumber,
        };
      }

      acknowledgePendingIncomingMessage();
    };

    const markOutgoingMessagesDelivered = ({
      conversationId,
      sequenceNumber,
    }: MessageReceiptPayload) => {
      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (
            message.conversationId !== conversationId ||
            message.sequenceNumber > sequenceNumber ||
            message.deliveryStatus !==
              ChatConstantsCollection.MessageDeliveryStatus.Sent
          ) {
            return message;
          }

          return {
            ...message,
            deliveryStatus:
              ChatConstantsCollection.MessageDeliveryStatus.Delivered,
          };
        }),
      );
    };

    const markOutgoingMessagesRead = ({
      conversationId,
      sequenceNumber,
    }: MessageReceiptPayload) => {
      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (
            message.conversationId !== conversationId ||
            message.sequenceNumber > sequenceNumber ||
            !message.deliveryStatus ||
            message.deliveryStatus ===
              ChatConstantsCollection.MessageDeliveryStatus.Read
          ) {
            return message;
          }

          return {
            ...message,
            deliveryStatus: ChatConstantsCollection.MessageDeliveryStatus.Read,
          };
        }),
      );
    };

    const synchronizeAfterReconnect = () => {
      acknowledgePendingIncomingMessage();

      if (
        !conversationMayBeStale.current ||
        reconnectSynchronizationPending.current
      ) {
        return;
      }

      conversationMayBeStale.current = false;
      reconnectSynchronizationPending.current = true;

      startTransition(async () => {
        try {
          const synchronized = await synchronizeMessageHistory();

          if (!synchronized) {
            conversationMayBeStale.current = true;
            return;
          }

          acknowledgePendingIncomingMessage();
        } catch {
          conversationMayBeStale.current = true;
        } finally {
          reconnectSynchronizationPending.current = false;
        }
      });
    };

    const rememberSocketDisconnect = () => {
      conversationMayBeStale.current = true;
      // The prior connection may have closed before its receipt reached the server.
      deliveredThroughSequenceNumber.current = 0;
      readThroughSequenceNumber.current = 0;
    };

    chatSocket.on("connect", synchronizeAfterReconnect);
    chatSocket.on("disconnect", rememberSocketDisconnect);
    chatSocket.on("message.created", receiveMessageCreated);
    chatSocket.on("message.delivered", markOutgoingMessagesDelivered);
    chatSocket.on("message.read", markOutgoingMessagesRead);
    document.addEventListener(
      "visibilitychange",
      acknowledgePendingIncomingMessage,
    );
    acknowledgePendingIncomingMessage();

    return () => {
      chatSocket.off("connect", synchronizeAfterReconnect);
      chatSocket.off("disconnect", rememberSocketDisconnect);
      chatSocket.off("message.created", receiveMessageCreated);
      chatSocket.off("message.delivered", markOutgoingMessagesDelivered);
      chatSocket.off("message.read", markOutgoingMessagesRead);
      document.removeEventListener(
        "visibilitychange",
        acknowledgePendingIncomingMessage,
      );
    };
  }, [authenticatedUserId, connectionId, router]);

  return (
    <>
      <div
        ref={messageViewport}
        tabIndex={0}
        onScroll={(event) => {
          if (event.currentTarget.scrollTop <= 64) {
            requestOlderMessages();
          }
        }}
        className="bg-brand-surface/70 focus-visible:ring-brand-600/25 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
      >
        {optimisticMessages.length ? (
          <ol
            aria-label="Message history"
            className="flex min-h-full flex-col justify-end gap-2 px-4 py-5"
          >
            {nextLastLoadedSequenceNumber ? (
              <li className="flex h-8 shrink-0 items-center justify-center">
                {olderMessagesPending ? (
                  <span
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 text-xs font-medium text-zinc-500"
                  >
                    <span
                      aria-hidden="true"
                      className="border-t-brand-600 size-3.5 animate-spin rounded-full border-2 border-zinc-300"
                    />
                    Loading older messages
                  </span>
                ) : olderMessagesError ? (
                  <button
                    type="button"
                    onClick={requestOlderMessages}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
                  >
                    Retry loading older messages
                  </button>
                ) : null}
              </li>
            ) : null}

            {optimisticMessages.map((message) => {
              const isOptimistic = "optimistic" in message;
              const sentByAuthenticatedUser =
                isOptimistic || Boolean(message.deliveryStatus);

              return (
                <li
                  key={message.id}
                  className={
                    sentByAuthenticatedUser
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <article
                    className={
                      sentByAuthenticatedUser
                        ? "border-brand-600/15 bg-brand-50 max-w-[82%] rounded-2xl rounded-br-md border px-3.5 py-2 text-zinc-950 shadow-sm"
                        : "max-w-[82%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3.5 py-2 text-zinc-950 shadow-sm"
                    }
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-5">
                      {message.text}
                    </p>
                    <span className="mt-1 flex items-center justify-end gap-1 text-[0.6875rem] text-zinc-400">
                      <MessageTimestamp
                        dateTime={message.createdAt}
                        className="shrink-0"
                      />
                      {isOptimistic ? (
                        <span role="status" aria-label="Sending">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="size-3.5 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                        </span>
                      ) : message.deliveryStatus ? (
                        <MessageDeliveryIcon status={message.deliveryStatus} />
                      ) : null}
                    </span>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex min-h-full items-center justify-center px-6 text-center">
            <div>
              <h2 className="text-lg font-semibold">No messages yet</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Start the conversation when you are ready.
              </p>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          setMessageText("");
          startTransition(() => {
            sendMessageFormAction(formData);
          });
        }}
        className="shrink-0 border-t border-zinc-100 bg-white p-3"
      >
        <input type="hidden" name="connectionId" value={connectionId} />
        <input type="hidden" name="clientMessageId" value={clientMessageId} />

        <div className="flex items-end gap-2">
          <label htmlFor="chat-message" className="sr-only">
            Message
          </label>
          <textarea
            ref={messageTextarea}
            id="chat-message"
            name="text"
            value={messageText}
            onChange={(event) => {
              setMessageText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (
                event.key !== "Enter" ||
                event.shiftKey ||
                event.nativeEvent.isComposing
              ) {
                return;
              }

              event.preventDefault();

              if (!messageText.trim() || sendMessagePending) {
                return;
              }

              const form = event.currentTarget.form;

              if (form) {
                form.requestSubmit();
              }
            }}
            required
            maxLength={2_000}
            rows={1}
            enterKeyHint="send"
            placeholder="Write a message"
            className="chat-message-textarea focus:border-brand-600/50 focus:ring-brand-600/10 max-h-32 min-h-11 flex-1 resize-none overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 leading-5 outline-none transition placeholder:text-zinc-400 focus:bg-white focus:ring-4"
          />
          <MessageSubmitButton
            messageIsEmpty={!messageText.trim()}
            pending={sendMessagePending}
          />
        </div>

        {sendMessageState.message ? (
          <p
            role="alert"
            aria-live="polite"
            className="mt-2 px-2 text-xs font-medium text-rose-700"
          >
            {sendMessageState.message}
          </p>
        ) : null}
      </form>
    </>
  );
};

/*
 * React 19 learning notes
 * - `useActionState` coordinates the manually dispatched send Action's result
 *   and pending state after the form snapshots its data and clears the draft.
 * - `useOptimistic` shows a clock-marked bubble until storage confirms it;
 *   React 18.2 required manually managed temporary-message state.
 * - The async `useTransition` Action tracks older-page loading across `await`;
 *   React 18.2 required separate pending state after asynchronous work.
 * - React 18.2 typically used submit handlers plus separate request, pending,
 *   error, and reset state. Its Effect setup/cleanup model otherwise matches
 *   the Socket.IO subscriptions used here.
 */
