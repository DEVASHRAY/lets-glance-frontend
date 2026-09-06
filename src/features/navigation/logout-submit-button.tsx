"use client";

import { useFormStatus } from "react-dom";

export const LogoutSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={pending ? "Logging out" : "Log out"}
      disabled={pending}
      title={pending ? "Logging out…" : "Log out"}
      className="border-brand-border bg-brand-panel/80 text-brand-muted hover:border-brand-300 hover:bg-brand-panel hover:text-brand-ink focus-visible:ring-brand-600/70 flex size-10 items-center justify-center rounded-xl border shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="border-t-brand-600 size-4 animate-spin rounded-full border-2 border-zinc-300"
        />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M14 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
        </svg>
      )}
    </button>
  );
};

/*
 * Learning notes
 *
 * React 19 `useFormStatus`
 * - The button reads pending state directly from its parent logout form.
 * - React 18.2 usually required a pending prop passed down from the form.
 */
