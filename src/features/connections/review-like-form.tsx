"use client";

import { useRouter } from "next/navigation";
import { useActionState, useOptimistic } from "react";

import { ConnectionsConstantsCollection } from "@/features/connections/connections.constants";
import { ReviewLikeButton } from "@/features/connections/review-like-button";
import {
  initialReviewLikeActionState,
  reviewLikeAction,
} from "@/features/connections/review-like.action";

interface ReviewLikeFormProps {
  compact?: boolean;
  connectionId: string;
  personName: string;
}

export const ReviewLikeForm = ({
  compact = false,
  connectionId,
  personName,
}: ReviewLikeFormProps) => {
  const router = useRouter();
  const [isHidden, hideForm] = useOptimistic(
    false,
    (_current, nextHidden: boolean) => nextHidden,
  );
  const [state, formAction] = useActionState(
    async (
      previousState: typeof initialReviewLikeActionState,
      formData: FormData,
    ) => {
      hideForm(true);
      const nextState = await reviewLikeAction(previousState, formData);

      if (nextState.success) {
        router.refresh();
      }

      return nextState;
    },
    initialReviewLikeActionState,
  );

  if (state.success) {
    const isMatch =
      state.decision ===
      ConnectionsConstantsCollection.LikeReviewStatus.Accepted;

    return (
      <p
        role="status"
        className="bg-brand-panel text-brand-ink rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_16px_36px_-18px_rgba(72,24,50,0.5)]"
      >
        {isMatch ? "It's a match" : "Passed"}
      </p>
    );
  }

  return (
    <div className={isHidden ? "hidden" : undefined}>
      <form
        action={formAction}
        className={
          compact
            ? "flex items-end justify-center gap-2"
            : "flex items-end justify-center gap-5"
        }
      >
        <input type="hidden" name="connectionId" value={connectionId} />
        <ReviewLikeButton
          compact={compact}
          label={`Pass on ${personName}`}
          status={ConnectionsConstantsCollection.LikeReviewStatus.Rejected}
          variant="reject"
        />
        <ReviewLikeButton
          compact={compact}
          label={`Like ${personName}`}
          status={ConnectionsConstantsCollection.LikeReviewStatus.Accepted}
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
 * - One form Action reviews a received like from either Likes you or a profile
 *   details page. `useOptimistic` hides the controls immediately; a failed
 *   Express update restores them when the Action finishes.
 *
 * React 18.2 comparison
 * - React 18 usually kept a local pending flag and swapped the buttons after
 *   `fetch` resolved.
 */
