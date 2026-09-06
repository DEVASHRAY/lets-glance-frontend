"use client";

import { useRouter } from "next/navigation";
import { useActionState, useOptimistic } from "react";

import { ConnectionsConstantsCollection } from "@/features/connections/connections.constants";
import {
  decideProfileAction,
  initialDecideProfileActionState,
} from "@/features/connections/decide-profile.action";
import { ReviewLikeButton } from "@/features/connections/review-like-button";

interface DecideProfileFormProps {
  personName: string;
  receiverId: string;
}

export const DecideProfileForm = ({
  personName,
  receiverId,
}: DecideProfileFormProps) => {
  const router = useRouter();
  const [isHidden, hideForm] = useOptimistic(
    false,
    (_current, nextHidden: boolean) => nextHidden,
  );
  const [state, formAction] = useActionState(
    async (
      previousState: typeof initialDecideProfileActionState,
      formData: FormData,
    ) => {
      hideForm(true);
      const nextState = await decideProfileAction(previousState, formData);

      if (nextState.success) {
        router.refresh();
      }

      return nextState;
    },
    initialDecideProfileActionState,
  );

  if (state.success) {
    const isInterested =
      state.decision ===
      ConnectionsConstantsCollection.ConnectionStatus.Interested;

    return (
      <p
        role="status"
        className="bg-brand-panel text-brand-ink rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_16px_36px_-18px_rgba(72,24,50,0.5)]"
      >
        {isInterested ? "Liked" : "Passed"}
      </p>
    );
  }

  return (
    <div className={isHidden ? "hidden" : undefined}>
      <form action={formAction} className="flex items-end justify-center gap-5">
        <input type="hidden" name="receiverId" value={receiverId} />
        <ReviewLikeButton
          label={`Ignore ${personName}`}
          status={ConnectionsConstantsCollection.ConnectionStatus.Ignored}
          variant="reject"
        />
        <ReviewLikeButton
          label={`Interested in ${personName}`}
          status={ConnectionsConstantsCollection.ConnectionStatus.Interested}
          variant="accept"
        />
      </form>
      {state.message ? (
        <p
          role="alert"
          className="mt-3 rounded-full bg-rose-50 px-3 py-1 text-center text-xs font-medium text-rose-700"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
};

/*
 * Learning notes
 *
 * React 19 `useActionState` and `useOptimistic`
 * - Details use this form when there is no received like to accept or reject.
 *   Interested and Ignore POST the same connection create as the feed.
 *
 * React 18.2 comparison
 * - React 18 usually kept a local pending flag and swapped the buttons after
 *   `fetch` resolved.
 */
