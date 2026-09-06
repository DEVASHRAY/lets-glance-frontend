"use client";

import { useFormStatus } from "react-dom";

import { ConnectionsConstantsCollection } from "@/features/connections/connections.constants";

type ConnectionButtonStatus =
  | (typeof ConnectionsConstantsCollection.LikeReviewStatus)[keyof typeof ConnectionsConstantsCollection.LikeReviewStatus]
  | typeof ConnectionsConstantsCollection.ConnectionStatus.Ignored
  | typeof ConnectionsConstantsCollection.ConnectionStatus.Interested;

interface ReviewLikeButtonProps {
  compact?: boolean;
  label: string;
  status: ConnectionButtonStatus;
  variant: "accept" | "reject";
}

const PassIcon = () => {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.4"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
};

const LikeIcon = () => {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-7"
      fill="currentColor"
    >
      <path d="M12.8 20.6c-.2.1-.5.2-.8.2s-.6-.1-.8-.2C7.4 18.4 3 14.7 3 10.4 3 7.5 5.2 5.4 8 5.4c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2 2.8 0 5 2.1 5 5 0 4.3-4.4 8-7.2 10.2Z" />
    </svg>
  );
};

export const ReviewLikeButton = ({
  compact = false,
  label,
  status,
  variant,
}: ReviewLikeButtonProps) => {
  const { pending } = useFormStatus();
  const isAccept = variant === "accept";

  return (
    <button
      type="submit"
      disabled={pending}
      name="status"
      value={status}
      aria-label={pending ? "Saving" : label}
      className={
        isAccept
          ? `from-brand-600 to-brand-accent-600 focus-visible:ring-brand-600/35 flex items-center justify-center rounded-full bg-gradient-to-br text-white shadow-[0_18px_40px_-12px_rgba(79,70,229,0.82)] transition duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-50 disabled:hover:scale-100 ${compact ? "size-11 [&_svg]:size-5" : "size-16"}`
          : `hover:text-brand-600 flex items-center justify-center rounded-full bg-white text-zinc-900 shadow-[0_14px_32px_-12px_rgba(15,15,15,0.45)] transition duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 disabled:cursor-wait disabled:opacity-50 disabled:hover:scale-100 ${compact ? "size-10 [&_svg]:size-4" : "size-14"}`
      }
    >
      {isAccept ? <LikeIcon /> : <PassIcon />}
    </button>
  );
};

/*
 * Learning notes
 *
 * React 19 `useFormStatus`
 * - Each button reads the parent form's pending state instead of receiving a
 *   boolean prop from the card.
 *
 * React 18.2 comparison
 * - React 18 usually passed `pending` down from the form component.
 */
