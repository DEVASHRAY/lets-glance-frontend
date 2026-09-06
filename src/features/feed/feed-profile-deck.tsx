"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TransitionEvent,
} from "react";

import { BrandMark } from "@/features/brand/brand-mark";
import { FeedConstantsCollection } from "@/features/feed/feed.constants";
import { persistSwipeAction } from "@/features/feed/feed-swipe.action";
import type { FeedProfile, SwipeDirection } from "@/features/feed/feed.types";

interface FeedProfileDeckProps {
  profiles: FeedProfile[];
}

interface DragSession {
  hasHorizontalIntent: boolean;
  pointerId: number;
  startX: number;
  startY: number;
}

interface InteractiveGestureTargetInput {
  target: EventTarget;
}

interface CompleteSwipeInput {
  direction: SwipeDirection;
}

interface CardTransformInput {
  dragOffset: number;
  isTopCard: boolean;
  position: number;
}

const SWIPE_THRESHOLD = 92;
const TAP_MOVE_LIMIT = 10;
const VISIBLE_CARD_COUNT = 3;
const INTERACTIVE_GESTURE_SELECTOR =
  "a, button, input, select, textarea, [contenteditable='true'], [role='button']";
const FEED_PILL_CLASS_NAME =
  "rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md";

const isInteractiveGestureTarget = ({
  target,
}: InteractiveGestureTargetInput): boolean =>
  target instanceof Element &&
  Boolean(target.closest(INTERACTIVE_GESTURE_SELECTOR));

const getCardTransform = ({
  dragOffset,
  isTopCard,
  position,
}: CardTransformInput): string => {
  if (isTopCard) {
    const rotation = Math.max(-11, Math.min(11, dragOffset / 24));

    return `translate3d(${dragOffset}px, 0, 0) rotate(${rotation}deg)`;
  }

  const scale = 1 - position * 0.045;
  const translateY = position * 14;

  return `translate3d(0, ${translateY}px, 0) scale(${scale})`;
};

export const FeedProfileDeck = ({ profiles }: FeedProfileDeckProps) => {
  const router = useRouter();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeError, setSwipeError] = useState("");
  const [isSwipePending, startSwipeTransition] = useTransition();
  const [exitDirection, setExitDirection] = useState<
    SwipeDirection | undefined
  >();
  const [optimisticProfileIndex, setOptimisticProfileIndex] = useOptimistic(
    currentProfileIndex,
    (confirmedIndex, nextIndex: number) => Math.max(confirmedIndex, nextIndex),
  );
  const dragSessionRef = useRef<DragSession | null>(null);
  const frameRequestRef = useRef(0);
  const pointerTravelRef = useRef(0);
  const didOpenProfileRef = useRef(false);
  const queuedOffsetRef = useRef(0);

  const currentProfile = profiles[optimisticProfileIndex];
  const visibleProfiles = profiles.slice(
    optimisticProfileIndex,
    optimisticProfileIndex + VISIBLE_CARD_COUNT,
  );

  const cancelPendingFrame = () => {
    if (!frameRequestRef.current) {
      return;
    }

    window.cancelAnimationFrame(frameRequestRef.current);
    frameRequestRef.current = 0;
  };

  const openCurrentProfile = () => {
    if (
      didOpenProfileRef.current ||
      exitDirection ||
      isSwipePending ||
      !currentProfile
    ) {
      return;
    }

    didOpenProfileRef.current = true;
    router.push(`/people/${currentProfile.id}`);
  };

  const completeSwipe = ({ direction }: CompleteSwipeInput) => {
    if (exitDirection || isSwipePending || !currentProfile) {
      return;
    }

    const viewportExitDistance = Math.max(window.innerWidth, 700);
    const nextOffset =
      direction === FeedConstantsCollection.SwipeDirection.Right
        ? viewportExitDistance
        : -viewportExitDistance;

    cancelPendingFrame();
    setIsDragging(false);
    setSwipeError("");
    setExitDirection(direction);
    setDragOffset(nextOffset);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      !event.isPrimary ||
      exitDirection ||
      isSwipePending ||
      isInteractiveGestureTarget({ target: event.target })
    ) {
      return;
    }

    pointerTravelRef.current = 0;
    didOpenProfileRef.current = false;
    queuedOffsetRef.current = 0;
    dragSessionRef.current = {
      hasHorizontalIntent: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    const horizontalOffset = event.clientX - dragSession.startX;
    const verticalOffset = event.clientY - dragSession.startY;
    pointerTravelRef.current = Math.hypot(horizontalOffset, verticalOffset);

    if (!dragSession.hasHorizontalIntent) {
      if (pointerTravelRef.current < TAP_MOVE_LIMIT) {
        return;
      }

      if (Math.abs(horizontalOffset) <= Math.abs(verticalOffset)) {
        dragSessionRef.current = null;
        queuedOffsetRef.current = 0;
        cancelPendingFrame();
        return;
      }

      dragSession.hasHorizontalIntent = true;

      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      setIsDragging(true);
    }

    queuedOffsetRef.current = horizontalOffset;

    if (frameRequestRef.current) {
      return;
    }

    frameRequestRef.current = window.requestAnimationFrame(() => {
      setDragOffset(queuedOffsetRef.current);
      frameRequestRef.current = 0;
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    const finalOffset = event.clientX - dragSession.startX;
    const verticalTravel = event.clientY - dragSession.startY;
    pointerTravelRef.current = Math.hypot(finalOffset, verticalTravel);
    const isHorizontalGesture =
      dragSession.hasHorizontalIntent ||
      (pointerTravelRef.current >= TAP_MOVE_LIMIT &&
        Math.abs(finalOffset) > Math.abs(verticalTravel));

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragSessionRef.current = null;
    cancelPendingFrame();
    setIsDragging(false);

    if (!isHorizontalGesture) {
      setDragOffset(0);

      if (pointerTravelRef.current < TAP_MOVE_LIMIT) {
        openCurrentProfile();
      }

      return;
    }

    setDragOffset(finalOffset);

    if (Math.abs(finalOffset) < SWIPE_THRESHOLD) {
      setDragOffset(0);
      return;
    }

    completeSwipe({
      direction:
        finalOffset > 0
          ? FeedConstantsCollection.SwipeDirection.Right
          : FeedConstantsCollection.SwipeDirection.Left,
    });
  };

  const handlePointerCancel = (event: PointerEvent<HTMLElement>) => {
    const dragSession = dragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragSessionRef.current = null;
    cancelPendingFrame();
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      openCurrentProfile();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      completeSwipe({
        direction: FeedConstantsCollection.SwipeDirection.Left,
      });
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      completeSwipe({
        direction: FeedConstantsCollection.SwipeDirection.Right,
      });
    }
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (
      pointerTravelRef.current >= TAP_MOVE_LIMIT ||
      isInteractiveGestureTarget({ target: event.target })
    ) {
      return;
    }

    openCurrentProfile();
  };

  const handleCardTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || !exitDirection) {
      return;
    }

    const swipedProfile = currentProfile;
    const swipedDirection = exitDirection;
    const nextProfileIndex = optimisticProfileIndex + 1;

    setExitDirection(undefined);
    setDragOffset(0);

    if (!swipedProfile) {
      return;
    }

    startSwipeTransition(async () => {
      setOptimisticProfileIndex(nextProfileIndex);

      try {
        const result = await persistSwipeAction({
          receiverId: swipedProfile.id,
          status:
            swipedDirection === FeedConstantsCollection.SwipeDirection.Right
              ? FeedConstantsCollection.SwipeDecision.Interested
              : FeedConstantsCollection.SwipeDecision.Ignored,
        });

        if (
          result.outcome ===
          FeedConstantsCollection.SwipeMutationOutcome.Unauthorized
        ) {
          router.replace("/login");
          return;
        }

        if (
          result.outcome ===
          FeedConstantsCollection.SwipeMutationOutcome.Failure
        ) {
          setSwipeError(result.message);
          return;
        }

        setCurrentProfileIndex(nextProfileIndex);

        if (nextProfileIndex >= profiles.length) {
          router.refresh();
        }
      } catch (error) {
        setSwipeError(
          error instanceof Error
            ? "Your choice could not be saved. Please try again."
            : "Unexpected connection failure",
        );
      }
    });
  };

  if (!profiles.length) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center px-4">
        <div className="border-brand-border bg-brand-panel/80 shadow-brand-panel max-w-md rounded-[2rem] border p-10 text-center backdrop-blur-xl">
          <BrandMark className="shadow-brand-glow mx-auto size-16" />
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">
            You&apos;ve explored enough for today
          </h2>
          <p className="text-brand-muted mt-3 leading-7">
            Come back tomorrow for a fresh collection of people to discover.
          </p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center px-4">
        <div className="border-brand-border bg-brand-panel/85 shadow-brand-panel max-w-md rounded-[2rem] border p-10 text-center backdrop-blur-xl">
          <span
            aria-hidden="true"
            className="bg-brand-50 text-brand-600 mx-auto flex size-16 items-center justify-center rounded-full text-3xl"
          >
            ✦
          </span>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">
            {isSwipePending ? "Saving your choice…" : "Finding someone new…"}
          </h2>
          <p className="text-brand-muted mt-3 leading-7">
            {isSwipePending
              ? "Your final decision is being stored."
              : "Hang tight while we look for more people you might like."}
          </p>
        </div>
      </div>
    );
  }

  const rightIntent = Math.max(0, Math.min(1, dragOffset / SWIPE_THRESHOLD));
  const leftIntent = Math.max(0, Math.min(1, -dragOffset / SWIPE_THRESHOLD));

  return (
    <div className="mx-auto flex w-full max-w-[29rem] flex-col items-center">
      <p className="sr-only" aria-live="polite">
        Viewing {currentProfile.name}, profile {optimisticProfileIndex + 1} of{" "}
        {profiles.length}
      </p>

      <div className="relative h-[min(62svh,38rem)] min-h-[31rem] w-full">
        {visibleProfiles.map((profile, position) => {
          const isTopCard = position === 0;
          const transform = getCardTransform({
            dragOffset,
            isTopCard,
            position,
          });

          return (
            <article
              key={profile.id}
              aria-hidden={!isTopCard}
              aria-label={`${profile.name}, ${profile.age}. Open profile`}
              tabIndex={isTopCard ? 0 : -1}
              onClick={isTopCard ? handleCardClick : undefined}
              onKeyDown={isTopCard ? handleKeyDown : undefined}
              onPointerCancel={isTopCard ? handlePointerCancel : undefined}
              onPointerDown={isTopCard ? handlePointerDown : undefined}
              onPointerMove={isTopCard ? handlePointerMove : undefined}
              onPointerUp={isTopCard ? handlePointerUp : undefined}
              onTransitionEnd={isTopCard ? handleCardTransitionEnd : undefined}
              className={`absolute inset-0 overflow-hidden rounded-[2.25rem] border border-white/80 bg-zinc-900 shadow-[0_38px_100px_-36px_rgba(72,24,50,0.62)] select-none ${
                isTopCard ? "touch-pan-y" : ""
              } ${
                isDragging && isTopCard
                  ? "cursor-grabbing"
                  : "cursor-pointer transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
              } focus-visible:ring-brand-600/70 focus-visible:outline-none focus-visible:ring-4`}
              style={{
                opacity: 1 - position * 0.16,
                pointerEvents: isTopCard ? "auto" : "none",
                transform,
                zIndex: VISIBLE_CARD_COUNT - position,
              }}
            >
              {profile.photoUrl ? (
                <Image
                  fill
                  alt={`Portrait of ${profile.name}`}
                  draggable={false}
                  priority={isTopCard}
                  sizes="(max-width: 640px) calc(100vw - 32px), 464px"
                  src={profile.photoUrl}
                  className="pointer-events-none object-cover"
                />
              ) : (
                <div className="from-brand-700 via-brand-600 to-brand-accent-600 absolute inset-0 flex items-center justify-center bg-gradient-to-br text-8xl font-semibold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent" />

              {isTopCard ? (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute top-24 left-6 -rotate-12 rounded-xl border-4 border-white px-4 py-2 text-2xl font-black tracking-[0.12em] text-white shadow-lg"
                    style={{ opacity: rightIntent }}
                  >
                    HELLO
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute top-24 right-6 rotate-12 rounded-xl border-4 border-white px-4 py-2 text-2xl font-black tracking-[0.12em] text-white shadow-lg"
                    style={{ opacity: leftIntent }}
                  >
                    NEXT
                  </div>
                </>
              ) : null}

              <div className="absolute right-0 bottom-0 left-0 p-7 text-center text-white sm:p-9">
                <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {profile.name}
                </h2>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className={`${FEED_PILL_CLASS_NAME} tabular-nums`}>
                    {profile.age}
                  </span>
                  {profile.jobTitle ? (
                    <span className={FEED_PILL_CLASS_NAME}>
                      {profile.jobTitle}
                    </span>
                  ) : null}
                  {profile.location?.city ? (
                    <span className={FEED_PILL_CLASS_NAME}>
                      {profile.location.city}
                    </span>
                  ) : null}
                  <span className={`${FEED_PILL_CLASS_NAME} capitalize`}>
                    {profile.gender}
                  </span>
                </div>
                {profile.bio ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/85">
                    {profile.bio}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-brand-border bg-brand-panel/90 shadow-brand-panel relative z-40 -mt-6 flex items-center rounded-[1.6rem] border p-2 backdrop-blur-xl">
        <button
          type="button"
          aria-label={`Move past ${currentProfile.name}`}
          disabled={Boolean(exitDirection) || isSwipePending}
          onClick={() =>
            completeSwipe({
              direction: FeedConstantsCollection.SwipeDirection.Left,
            })
          }
          className="bg-brand-100 text-brand-muted hover:bg-brand-ink focus-visible:ring-brand-600/70 group flex size-12 items-center justify-center rounded-[1.1rem] transition duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-50 sm:size-14"
        >
          <span
            aria-hidden="true"
            className="transition-transform group-hover:-rotate-12"
          >
            ✕
          </span>
        </button>
        <span aria-hidden="true" className="bg-brand-border mx-2 h-7 w-px" />
        <button
          type="button"
          aria-label={`Continue with ${currentProfile.name}`}
          disabled={Boolean(exitDirection) || isSwipePending}
          onClick={() =>
            completeSwipe({
              direction: FeedConstantsCollection.SwipeDirection.Right,
            })
          }
          className="from-brand-600 to-brand-accent-600 shadow-brand-glow focus-visible:ring-brand-600/70 group flex size-12 items-center justify-center rounded-[1.1rem] bg-gradient-to-br text-xl text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-50 sm:size-14"
        >
          <span
            aria-hidden="true"
            className="transition-transform group-hover:scale-110"
          >
            ♥
          </span>
        </button>
      </div>

      <Link
        href={`/people/${currentProfile.id}`}
        className="text-brand-700 hover:text-brand-600 focus-visible:ring-brand-600/70 relative z-40 mt-5 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4"
      >
        View profile
      </Link>

      {swipeError ? (
        <p
          role="alert"
          className="mt-5 rounded-full bg-rose-50 px-4 py-2 text-center text-xs font-medium text-rose-700"
        >
          {swipeError}
        </p>
      ) : (
        <p role="status" className="text-brand-subtle mt-5 text-center text-xs">
          {isSwipePending
            ? "Saving your choice…"
            : "Your choices are saved securely."}
        </p>
      )}
    </div>
  );
};

/*
 * Learning notes
 *
 * Focused Client Component
 * - Only the swipe deck hydrates because pointer, keyboard, and local card state
 *   require browser interactivity. Feed fetching and validation stay on the server.
 * - Three cards are mounted at once, limiting image requests and DOM work even
 *   when Express returns a larger page.
 *
 * React 19 and React 18.2
 * - `useOptimistic` shows the next profile while the Action persists the current
 *   decision, then restores the previous card automatically if the Action fails.
 * - `useTransition` supplies pending state and keeps that optimistic update in
 *   the React 19 Action lifecycle.
 * - React 18.2 required separate request, pending, optimistic, and rollback state
 *   coordinated manually inside event handlers.
 *
 * Card tap vs swipe
 * - `touch-action: pan-y` leaves vertical panning native while preventing the
 *   browser from treating horizontal card gestures as page panning.
 * - A 10px direction lock separates taps from drags. Pointer capture and card
 *   transforms start only after horizontal motion wins; vertical motion clears
 *   deck tracking so iOS Safari or Android Chrome can take over page scrolling.
 * - A `<Link>` wrapping the swipe surface would fight dragging; interactive
 *   descendants are excluded if controls are added to a card later.
 * - Next.js 16 still recommends `<Link>` for ordinary navigation; this is the
 *   swipe exception. Next.js 14.1 used the same App Router `useRouter().push`.
 *
 * Next batch refresh
 * - `router.refresh()` requests a new Server Component payload without a full
 *   document reload after the final profile is swiped. The server validates the
 *   next feed batch before it reaches this Client Component.
 * - Next.js 14.1 exposed the same refresh API. This feed requests page one again
 *   because persisted swipes change the filtered result set; offset page two
 *   would skip unseen profiles.
 */
