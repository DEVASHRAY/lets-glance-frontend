import { z } from "zod";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";

const objectId = z.string().regex(/^[0-9a-f]{24}$/u);
const sequenceNumber = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const clientMessageId = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
  );

const chatPeer = z.object({
  id: objectId,
  name: z.string().trim().min(1).max(50).nullable(),
  photoUrl: z.url().nullable(),
});

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
  peer: chatPeer,
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

const messageHistoryItem = z.object({
  clientMessageId,
  conversationId: objectId,
  createdAt: z.iso.datetime(),
  deliveryStatus: z
    .enum(ChatConstantsCollection.MessageDeliveryStatus)
    .nullable(),
  id: objectId,
  senderId: objectId,
  sequenceNumber,
  text: z.string().trim().min(1).max(2_000),
});

const messageHistoryResponse = z.object({
  data: z
    .object({
      authenticatedUserId: objectId,
      items: z.array(messageHistoryItem).max(20),
      nextLastLoadedSequenceNumber: sequenceNumber.nullable(),
      peer: chatPeer,
      readAcknowledgementRequired: z.boolean(),
      readAcknowledgementSequenceNumber: sequenceNumber.nullable(),
    })
    .refine(
      ({ readAcknowledgementRequired, readAcknowledgementSequenceNumber }) =>
        readAcknowledgementRequired ===
        Boolean(readAcknowledgementSequenceNumber),
      {
        message: "Read acknowledgement fields are inconsistent",
      },
    ),
  message: z.string(),
});

export type ChatPeer = z.infer<typeof chatPeer>;
export type ConversationInboxItem = z.infer<typeof conversationInboxItem>;
export type MessageHistoryItem = z.infer<typeof messageHistoryItem>;

export const ChatSchemasCollection = {
  conversationInboxResponse,
  messageHistoryResponse,
};
