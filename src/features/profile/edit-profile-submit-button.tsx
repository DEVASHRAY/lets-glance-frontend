"use client";

import { useFormStatus } from "react-dom";

interface EditProfileSubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

export const EditProfileSubmitButton = ({
  idleLabel,
  pendingLabel,
}: EditProfileSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="from-brand-600 to-brand-accent-600 focus-visible:ring-brand-600/25 group relative flex min-h-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r px-8 py-3 font-semibold text-white shadow-[0_14px_30px_-14px_rgba(79,70,229,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(79,70,229,0.82)] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
};

/*
 * Learning notes
 *
 * React 19 `useFormStatus`
 * - The save button reads the parent profile form's pending state instead of
 *   receiving a boolean prop.
 *
 * React 18.2 comparison
 * - React 18 usually passed `pending` down from the form component.
 */
