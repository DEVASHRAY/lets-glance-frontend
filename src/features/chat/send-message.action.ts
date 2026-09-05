"use server";

import { z } from "zod";

import { ChatConstantsCollection } from "@/features/chat/chat.constants";
import { requestBackend } from "@/lib/server/backend-client";
import { getAuthenticationCookieHeader } from "@/lib/server/session";

const objectId = z.string().regex(/^[0-9a-f]{24}$/u);
const clientMessageId = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu,
  );

const sendMessageInput = z.object({
  clientMessageId,
  connectionId: objectId,
  text: z.string().trim().min(1).max(2_000),
});

const sentMessage = z.object({
  clientMessageId,
  conversationId: objectId,
  createdAt: z.iso.datetime(),
  id: objectId,
  senderId: objectId,
  sequenceNumber: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  text: z.string().trim().min(1).max(2_000),
});

const sendMessageResponse = z.object({
  data: sentMessage,
  message: z.string(),
});

export type SentMessage = z.infer<typeof sentMessage>;

export interface SendMessageActionState {
  message: string;
  outcome: (typeof ChatConstantsCollection.SendMessageOutcome)[keyof typeof ChatConstantsCollection.SendMessageOutcome];
  sentMessage?: SentMessage;
  submittedClientMessageId?: string;
}

export const sendMessageAction = async (
  _previousState: SendMessageActionState,
  formData: FormData,
): Promise<SendMessageActionState> => {
  const parsedInput = sendMessageInput.safeParse({
    clientMessageId: formData.get("clientMessageId"),
    connectionId: formData.get("connectionId"),
    text: formData.get("text"),
  });

  if (!parsedInput.success) {
    return {
      message: "Enter a message between 1 and 2,000 characters",
      outcome: ChatConstantsCollection.SendMessageOutcome.Failure,
    };
  }

  try {
    const cookieHeader = await getAuthenticationCookieHeader();

    if (!cookieHeader) {
      return {
        message: "Please log in again",
        outcome: ChatConstantsCollection.SendMessageOutcome.Unauthorized,
      };
    }

    const response = await requestBackend({
      body: JSON.stringify({
        clientMessageId: parsedInput.data.clientMessageId,
        text: parsedInput.data.text,
      }),
      cookie: cookieHeader,
      method: "POST",
      path: `/api/v1/chat/connections/${encodeURIComponent(parsedInput.data.connectionId)}/messages`,
    });

    if (response.status === 401) {
      return {
        message: "Please log in again",
        outcome: ChatConstantsCollection.SendMessageOutcome.Unauthorized,
      };
    }

    if (response.status === 409) {
      return {
        message: "This message identifier was already used. Please send again.",
        outcome: ChatConstantsCollection.SendMessageOutcome.Conflict,
        submittedClientMessageId: parsedInput.data.clientMessageId,
      };
    }

    if (!response.ok) {
      return {
        message: "Your message could not be sent. Please try again.",
        outcome: ChatConstantsCollection.SendMessageOutcome.Failure,
      };
    }

    const parsedResponse = sendMessageResponse.safeParse(await response.json());

    if (!parsedResponse.success) {
      return {
        message: "The message service returned an invalid response",
        outcome: ChatConstantsCollection.SendMessageOutcome.Failure,
      };
    }

    return {
      message: "",
      outcome: ChatConstantsCollection.SendMessageOutcome.Success,
      sentMessage: parsedResponse.data.data,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? "Unable to reach the message service"
          : "Unexpected message sending failure",
      outcome: ChatConstantsCollection.SendMessageOutcome.Failure,
    };
  }
};

/*
 * React 19 Server Action
 * - A future `useActionState` form will pass previous state and FormData to this
 *   server function while Next.js keeps authentication cookies on the server.
 * - React 18.2 commonly used a client submit handler plus manually coordinated
 *   request, pending, error, and success state.
 *
 * Next.js 16
 * - The `"use server"` module exposes this mutation to a Client Component while
 *   keeping direct Express access server-only. Next.js 14.1 supported Server
 *   Actions experimentally; Next.js 16 treats them as the standard form path.
 */
