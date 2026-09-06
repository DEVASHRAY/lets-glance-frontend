"use client";

import { useFormStatus } from "react-dom";

interface LoginSubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

export const LoginSubmitButton = ({
  idleLabel,
  pendingLabel,
}: LoginSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="from-brand-600 to-brand-accent-600 focus-visible:ring-brand-600/25 group relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r px-5 py-3 font-semibold text-white shadow-[0_14px_30px_-14px_rgba(79,70,229,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(79,70,229,0.82)] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="mr-2 size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {pendingLabel}
        </>
      ) : (
        <>
          {idleLabel}
          <span
            aria-hidden="true"
            className="ml-2 transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </>
      )}
    </button>
  );
};

/*
 * Learning notes
 *
 * React 19 `useFormStatus`
 * - The hook reads the nearest parent form's submission state without passing
 *   pending props through the form component.
 * - It must run in a child of the form whose status it observes.
 *
 * React 18.2 comparison
 * - React 18 usually lifted pending state into the form and passed a boolean
 *   prop to the submit button.
 */
