import { z } from "zod";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";

const objectId = z.string().regex(/^[0-9a-f]{24}$/u);
const sequenceNumber = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const clientMessageId = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
  );

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

export type MessageHistoryItem = z.infer<typeof messageHistoryItem>;

export const ChatSchemasCollection = {
  messageHistoryResponse,
};
