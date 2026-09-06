"use client";

import { useEffect } from "react";

import { chatSocket } from "@/features/chat/chat-socket";

const ChatLayout = ({ children }: LayoutProps<"/chat">) => {
  useEffect(() => {
    // Entering any Chat page opens the one shared connection.
    chatSocket.connect();

    return () => {
      // Leaving the Chat section releases its connection and heartbeat work.
      chatSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      return;
    }

    const root = document.documentElement;
    let animationFrameId = 0;

    const clearChatViewport = () => {
      root.style.removeProperty("--chat-visual-viewport-height");
      root.style.removeProperty("--chat-visual-viewport-top");
    };

    // iOS Safari shrinks and pans the visual viewport for its keyboard without
    // resizing CSS viewport units, so fixed chat controls need both live values.
    const synchronizeChatViewport = () => {
      animationFrameId = 0;

      if (visualViewport.scale !== 1) {
        clearChatViewport();
        return;
      }

      root.style.setProperty(
        "--chat-visual-viewport-height",
        `${String(visualViewport.height)}px`,
      );
      root.style.setProperty(
        "--chat-visual-viewport-top",
        `${String(visualViewport.offsetTop)}px`,
      );
    };

    const requestChatViewportSynchronization = () => {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(synchronizeChatViewport);
    };

    synchronizeChatViewport();
    visualViewport.addEventListener(
      "resize",
      requestChatViewportSynchronization,
    );
    visualViewport.addEventListener(
      "scroll",
      requestChatViewportSynchronization,
    );

    return () => {
      visualViewport.removeEventListener(
        "resize",
        requestChatViewportSynchronization,
      );
      visualViewport.removeEventListener(
        "scroll",
        requestChatViewportSynchronization,
      );

      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      clearChatViewport();
    };
  }, []);

  return children;
};

export default ChatLayout;

/*
 * This nested layout remains mounted while navigating between the Chat inbox
 * and conversations, so those pages reuse one socket. Next.js 14.1 App Router
 * layouts had the same persistence behavior; Next.js 16 keeps that model.
 * Next.js 16 generated `LayoutProps` supplies route-aware layout typing;
 * Next.js 14.1 commonly used a handwritten `{ children: ReactNode }` prop.
 */
