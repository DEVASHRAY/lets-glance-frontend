"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import { chatSocket } from "@/features/chat/chat-socket";

const ChatLayout = ({ children }: LayoutProps<"/chat">) => {
  const pathname = usePathname();
  const conversationIsOpen = pathname.startsWith("/chat/");

  useEffect(() => {
    // Entering any Chat page opens the one shared connection.
    chatSocket.connect();

    return () => {
      // Leaving the Chat section releases its connection and heartbeat work.
      chatSocket.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    if (!conversationIsOpen) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const lockedScrollX = window.scrollX;
    const lockedScrollY = window.scrollY;

    // The class fixes both viewport-defining elements before the browser paints
    // the focused textarea, preventing WebKit from scrolling the document.
    root.classList.add("chat-document-locked");
    body.classList.add("chat-document-locked");

    return () => {
      root.classList.remove("chat-document-locked");
      body.classList.remove("chat-document-locked");

      if (
        window.scrollX !== lockedScrollX ||
        window.scrollY !== lockedScrollY
      ) {
        window.scrollTo({
          behavior: "auto",
          left: lockedScrollX,
          top: lockedScrollY,
        });
      }
    };
  }, [conversationIsOpen]);

  useLayoutEffect(() => {
    if (!conversationIsOpen) {
      return;
    }

    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      return;
    }

    const root = document.documentElement;

    const clearChatViewport = () => {
      root.style.removeProperty("--chat-visual-viewport-height");
      root.style.removeProperty("--chat-visual-viewport-top");
    };

    // iOS Safari shrinks and pans the visual viewport for its keyboard without
    // resizing CSS viewport units, so fixed chat controls need both live values.
    const synchronizeChatViewport = () => {
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

    synchronizeChatViewport();
    visualViewport.addEventListener("resize", synchronizeChatViewport);
    visualViewport.addEventListener("scroll", synchronizeChatViewport);

    return () => {
      visualViewport.removeEventListener("resize", synchronizeChatViewport);
      visualViewport.removeEventListener("scroll", synchronizeChatViewport);
      clearChatViewport();
    };
  }, [conversationIsOpen]);

  return children;
};

export default ChatLayout;

/*
 * This nested layout remains mounted while navigating between the Chat inbox
 * and conversations, so those pages reuse one socket. Next.js 14.1 App Router
 * layouts had the same persistence behavior; Next.js 16 keeps that model.
 * Next.js 16 generated `LayoutProps` supplies route-aware layout typing;
 * Next.js 14.1 commonly used a handwritten `{ children: ReactNode }` prop.
 * `usePathname` scopes the pre-paint document lock to conversation routes;
 * Next.js 14.1 exposed the same client-side pathname API.
 */
