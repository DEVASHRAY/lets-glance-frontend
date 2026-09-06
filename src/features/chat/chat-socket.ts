import "client-only";

import { io, type Socket } from "socket.io-client";
import type {
  ChatClientToServerEvents,
  ChatServerToClientEvents,
} from "@/features/chat/chat-socket.types";

// Module imports share this client; it stays disconnected until the Chat layout opens.
export const chatSocket: Socket<
  ChatServerToClientEvents,
  ChatClientToServerEvents
> = io(process.env.NEXT_PUBLIC_SOCKET_ORIGIN, {
  autoConnect: false,
  path: "/socket.io",
  reconnectionAttempts: 5,
  transports: ["websocket"],
  withCredentials: true,
  reconnectionDelay : 5_000,
  reconnectionDelayMax : 10_000,
  randomizationFactor : 0,
});
