import "server-only";

import { z } from "zod";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import {
  ChatSchemasCollection,
  type MessageHistoryItem,
} from "@/features/chat/chat.schemas";
import { requestBackend } from "@/lib/server/backend-client";
import { getAuthenticationCookieHeader } from "@/lib/server/session";

const objectId = z.string().regex(/^[0-9a-f]{24}$/u);
const sequenceNumber = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);

const conversationInboxItem = z.object({
  connectionId: objectId,
  conversationId: objectId,
  lastMessage: z.object({
    createdAt: z.iso.datetime(),
    deliveryAcknowledgementRequired: z.boolean(),
    deliveryStatus: z
      .enum(ChatConstantsCollection.MessageDeliveryStatus)
      .nullable(),
    sentByAuthenticatedUser: z.boolean(),
    sequenceNumber,
    textPreview: z.string().trim().min(1).max(120),
  }),
  peer: z.object({
    id: objectId,
    name: z.string().trim().min(1).max(50).nullable(),
    photoUrl: z.url().nullable(),
  }),
  unreadCount: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

const conversationInboxResponse = z.object({
  data: z.object({
    items: z.array(conversationInboxItem).max(20),
    nextCursor: z
      .string()
      .regex(/^[1-9]\d{12}:[0-9a-f]{24}$/u)
      .nullable(),
  }),
  message: z.string(),
});

export type ConversationInboxItem = z.infer<typeof conversationInboxItem>;

interface ConversationInboxLoadSuccess {
  conversations: ConversationInboxItem[];
  nextCursor: string | null;
  outcome: typeof ChatConstantsCollection.ConversationInboxLoadOutcome.Success;
}

interface ConversationInboxLoadUnauthorized {
  outcome: typeof ChatConstantsCollection.ConversationInboxLoadOutcome.Unauthorized;
}

interface ConversationInboxLoadFailure {
  message: string;
  outcome: typeof ChatConstantsCollection.ConversationInboxLoadOutcome.Failure;
}

type ConversationInboxLoadResult =
  | ConversationInboxLoadFailure
  | ConversationInboxLoadSuccess
  | ConversationInboxLoadUnauthorized;

interface LoadMessageHistoryInput {
  connectionId: string;
  lastLoadedSequenceNumber?: number;
}

interface MessageHistoryLoadSuccess {
  authenticatedUserId: string;
  messages: MessageHistoryItem[];
  nextLastLoadedSequenceNumber: number | null;
  outcome: typeof ChatConstantsCollection.MessageHistoryLoadOutcome.Success;
  readAcknowledgementRequired: boolean;
  readAcknowledgementSequenceNumber: number | null;
}

interface MessageHistoryLoadMissing {
  outcome: typeof ChatConstantsCollection.MessageHistoryLoadOutcome.Missing;
}

interface MessageHistoryLoadUnauthorized {
  outcome: typeof ChatConstantsCollection.MessageHistoryLoadOutcome.Unauthorized;
}

interface MessageHistoryLoadFailure {
  message: string;
  outcome: typeof ChatConstantsCollection.MessageHistoryLoadOutcome.Failure;
}

type MessageHistoryLoadResult =
  | MessageHistoryLoadFailure
  | MessageHistoryLoadMissing
  | MessageHistoryLoadSuccess
  | MessageHistoryLoadUnauthorized;

export const loadConversationInbox =
  async (): Promise<ConversationInboxLoadResult> => {
    try {
      const cookieHeader = await getAuthenticationCookieHeader();

      if (!cookieHeader) {
        return {
          outcome:
            ChatConstantsCollection.ConversationInboxLoadOutcome.Unauthorized,
        };
      }

      const response = await requestBackend({
        cookie: cookieHeader,
        method: "GET",
        path: "/api/v1/chat/conversations",
      });

      if (response.status === 401) {
        return {
          outcome:
            ChatConstantsCollection.ConversationInboxLoadOutcome.Unauthorized,
        };
      }

      if (!response.ok) {
        return {
          message: "Your conversations are temporarily unavailable",
          outcome: ChatConstantsCollection.ConversationInboxLoadOutcome.Failure,
        };
      }

      const parsedResponse = conversationInboxResponse.safeParse(
        await response.json(),
      );

      if (!parsedResponse.success) {
        return {
          message: "Your conversations returned an invalid response",
          outcome: ChatConstantsCollection.ConversationInboxLoadOutcome.Failure,
        };
      }

      return {
        conversations: parsedResponse.data.data.items,
        nextCursor: parsedResponse.data.data.nextCursor,
        outcome: ChatConstantsCollection.ConversationInboxLoadOutcome.Success,
      };
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? "Unable to load your conversations"
            : "Unexpected conversation inbox failure",
        outcome: ChatConstantsCollection.ConversationInboxLoadOutcome.Failure,
      };
    }
  };

export const loadMessageHistory = async ({
  connectionId,
  lastLoadedSequenceNumber,
}: LoadMessageHistoryInput): Promise<MessageHistoryLoadResult> => {
  const parsedConnectionId = objectId.safeParse(connectionId);

  if (!parsedConnectionId.success) {
    return {
      outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Missing,
    };
  }

  const parsedLastLoadedSequenceNumber = sequenceNumber
    .optional()
    .safeParse(lastLoadedSequenceNumber);

  if (!parsedLastLoadedSequenceNumber.success) {
    return {
      message: "The message-history cursor is invalid",
      outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Failure,
    };
  }

  const searchParams = new URLSearchParams();

  if (parsedLastLoadedSequenceNumber.data) {
    searchParams.set(
      "lastLoadedSequenceNumber",
      String(parsedLastLoadedSequenceNumber.data),
    );
  }

  const query = searchParams.toString();

  try {
    const cookieHeader = await getAuthenticationCookieHeader();

    if (!cookieHeader) {
      return {
        outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Unauthorized,
      };
    }

    const response = await requestBackend({
      cookie: cookieHeader,
      method: "GET",
      path: `/api/v1/chat/connections/${encodeURIComponent(parsedConnectionId.data)}/messages${query ? `?${query}` : ""}`,
    });

    if (response.status === 401) {
      return {
        outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Unauthorized,
      };
    }

    if (
      response.status === 403 ||
      response.status === 404 ||
      response.status === 422
    ) {
      return {
        outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Missing,
      };
    }

    if (!response.ok) {
      return {
        message: "Your messages are temporarily unavailable",
        outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Failure,
      };
    }

    const parsedResponse =
      ChatSchemasCollection.messageHistoryResponse.safeParse(
        await response.json(),
      );

    if (!parsedResponse.success) {
      return {
        message: "Your messages returned an invalid response",
        outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Failure,
      };
    }

    return {
      authenticatedUserId: parsedResponse.data.data.authenticatedUserId,
      messages: parsedResponse.data.data.items,
      nextLastLoadedSequenceNumber:
        parsedResponse.data.data.nextLastLoadedSequenceNumber,
      outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Success,
      readAcknowledgementRequired:
        parsedResponse.data.data.readAcknowledgementRequired,
      readAcknowledgementSequenceNumber:
        parsedResponse.data.data.readAcknowledgementSequenceNumber,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? "Unable to load your messages"
          : "Unexpected message-history failure",
      outcome: ChatConstantsCollection.MessageHistoryLoadOutcome.Failure,
    };
  }
};
