"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useFormStatus } from "react-dom";
import { z } from "zod";

import { SignupConstantsCollection } from "@/features/auth/signup.constants";
import {
  initialSignupActionState,
  signupAction,
} from "@/features/auth/signup.action";
import { BrandConstantsCollection } from "@/features/brand/brand.constants";
import { BrandMark } from "@/features/brand/brand-mark";
import { ProfileConstantsCollection } from "@/features/profile/profile.constants";

import styles from "./signup-flow.module.css";

type UserInterest =
  (typeof ProfileConstantsCollection.UserInterest)[keyof typeof ProfileConstantsCollection.UserInterest];

type SignupMode =
  (typeof SignupConstantsCollection.SignupMode)[keyof typeof SignupConstantsCollection.SignupMode];

type SignupGender =
  | typeof ProfileConstantsCollection.UserGender.Female
  | typeof ProfileConstantsCollection.UserGender.Male;

enum SignupStep {
  Account = "account",
  Basics = "basics",
  Bio = "bio",
  Hook = "hook",
  People = "people",
  Vibe = "vibe",
  World = "world",
}

interface ChoiceInputProps {
  checked: boolean;
  description?: string;
  label: string;
  name: string;
  onSelect: () => void;
  type: "checkbox" | "radio";
  value: string;
}

interface GetStepInput {
  step: SignupStep;
}

interface HandleSignupSubmitInput {
  event: FormEvent<HTMLFormElement>;
}

interface HiddenProfileFieldsProps {
  draft: SignupDraft;
  mode: SignupMode;
  session: number;
}

interface ProfilePreviewProps {
  draft: SignupDraft;
}

interface SignupMessageProps {
  isError: boolean;
  message: string;
}

interface SignupSubmitButtonProps {
  disabled?: boolean;
  idleLabel: string;
  pendingLabel: string;
  resendPendingLabel?: string;
}

interface StepIntroProps {
  description: string;
  eyebrow: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  title: string;
}

interface ToggleInterestInput {
  interest: UserInterest;
}

const SIGNUP_GENDER_OPTIONS: SignupGender[] = [
  ProfileConstantsCollection.UserGender.Female,
  ProfileConstantsCollection.UserGender.Male,
];

const signupDraftSchema = z.object({
  age: z.number().int().min(0).max(120),
  bio: z.string().max(ProfileConstantsCollection.FieldLimit.Bio),
  city: z.string().max(ProfileConstantsCollection.FieldLimit.City),
  email: z.string().max(254),
  gender: z.union([z.literal(""), z.enum(SIGNUP_GENDER_OPTIONS)]).catch(""),
  interestedIn: z
    .array(z.enum(ProfileConstantsCollection.UserInterest))
    .max(Object.values(ProfileConstantsCollection.UserInterest).length),
  jobTitle: z.string().max(ProfileConstantsCollection.FieldLimit.JobTitle),
  movieNightStyle: z.union([
    z.literal(""),
    z.enum(ProfileConstantsCollection.MovieNightStyle),
  ]),
  name: z.string().max(ProfileConstantsCollection.FieldLimit.Name),
  socialBattery: z.union([
    z.literal(""),
    z.enum(ProfileConstantsCollection.SocialBattery),
  ]),
  weekdayPace: z.union([
    z.literal(""),
    z.enum(ProfileConstantsCollection.WeekdayPace),
  ]),
});

const persistedSignupSchema = z.object({
  draft: signupDraftSchema,
  step: z.enum(SignupStep),
});

type SignupDraft = z.infer<typeof signupDraftSchema>;
type PersistedSignup = z.infer<typeof persistedSignupSchema>;

const CURRENT_SIGNUP_DRAFT_STORAGE_KEY = "lets-glance:signup-draft";
const SIGNUP_DRAFT_SAVE_DELAY_MS = 200;
const SIGNUP_STEP_ORDER: SignupStep[] = [
  SignupStep.Hook,
  SignupStep.Basics,
  SignupStep.People,
  SignupStep.World,
  SignupStep.Vibe,
  SignupStep.Bio,
  SignupStep.Account,
];
const SIGNUP_STEP_COUNT = SIGNUP_STEP_ORDER.length - 1;

const INPUT_CLASS_NAME =
  "focus:border-brand-600 focus:ring-brand-600/10 min-h-14 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:ring-4 aria-invalid:border-rose-500 aria-invalid:ring-rose-500/10 disabled:cursor-wait disabled:bg-zinc-100 disabled:text-zinc-500";

const GENDER_LABEL = {
  [ProfileConstantsCollection.UserGender.Female]: "Woman",
  [ProfileConstantsCollection.UserGender.Male]: "Man",
} satisfies Record<SignupGender, string>;

const INTEREST_LABEL = {
  [ProfileConstantsCollection.UserInterest.Female]: "Women",
  [ProfileConstantsCollection.UserInterest.Male]: "Men",
} satisfies Record<UserInterest, string>;

const emptyDraft: SignupDraft = {
  age: 0,
  bio: "",
  city: "",
  email: "",
  gender: "",
  interestedIn: [],
  jobTitle: "",
  movieNightStyle: "",
  name: "",
  socialBattery: "",
  weekdayPace: "",
};

const getStepIndex = ({ step }: GetStepInput): number => {
  return SIGNUP_STEP_ORDER.indexOf(step);
};

const getNextStep = ({ step }: GetStepInput): SignupStep => {
  return SIGNUP_STEP_ORDER[getStepIndex({ step }) + 1] ?? step;
};

const getPreviousStep = ({ step }: GetStepInput): SignupStep => {
  return SIGNUP_STEP_ORDER[getStepIndex({ step }) - 1] ?? step;
};

const getStepActionLabel = ({ step }: GetStepInput): string => {
  if (step === SignupStep.Hook) {
    return "Build my profile";
  }

  if (step === SignupStep.Basics) {
    return "Continue";
  }

  if (step === SignupStep.People) {
    return "Set my preferences";
  }

  if (step === SignupStep.World) {
    return "Add to my profile";
  }

  if (step === SignupStep.Vibe) {
    return "Continue";
  }

  return "Finish my profile";
};

const getStepError = ({
  draft,
  step,
}: {
  draft: SignupDraft;
  step: SignupStep;
}): string => {
  if (step === SignupStep.Basics && draft.name.trim().length < 2) {
    return "Enter at least two characters for your name.";
  }

  if (
    step === SignupStep.Basics &&
    (!Number.isInteger(draft.age) || draft.age < 18 || draft.age > 120)
  ) {
    return "Enter an age between 18 and 120.";
  }

  if (step === SignupStep.People && !draft.gender) {
    return "Choose how you want to appear on your profile.";
  }

  if (step === SignupStep.People && !draft.interestedIn.length) {
    return "Choose at least one group you would like to meet.";
  }

  return "";
};

const readPersistedSignup = (): PersistedSignup | null => {
  try {
    const serializedSignup = sessionStorage.getItem(
      CURRENT_SIGNUP_DRAFT_STORAGE_KEY,
    );

    if (!serializedSignup) {
      return null;
    }

    const parsedSignup = persistedSignupSchema.safeParse(
      JSON.parse(serializedSignup),
    );

    return parsedSignup.success ? parsedSignup.data : null;
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; signup still works in memory.
    return null;
  }
};

const ChoiceInput = ({
  checked,
  description,
  label,
  name,
  onSelect,
  type,
  value,
}: ChoiceInputProps) => {
  return (
    <label
      className={
        checked
          ? "border-brand-600 bg-brand-50 text-brand-700 focus-within:ring-brand-600/10 group flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-[0_12px_30px_-22px_rgba(79,70,229,0.7)] transition focus-within:ring-4"
          : "focus-within:border-brand-600 focus-within:ring-brand-600/10 group flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-within:ring-4"
      }
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
            {description}
          </span>
        ) : null}
      </span>
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onSelect}
        type={type}
        value={value}
      />
      <span
        aria-hidden="true"
        className={
          checked
            ? "bg-brand-600 flex size-5 shrink-0 items-center justify-center rounded-full text-white"
            : "size-5 shrink-0 rounded-full border-2 border-zinc-300 bg-white"
        }
      >
        {checked ? (
          <svg
            viewBox="0 0 20 20"
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          >
            <path d="m5 10 3 3 7-7" />
          </svg>
        ) : null}
      </span>
    </label>
  );
};

const StepIntro = ({
  description,
  eyebrow,
  headingRef,
  title,
}: StepIntroProps) => {
  return (
    <div>
      <p className="text-brand-700 text-xs font-bold tracking-[0.2em] uppercase">
        {eyebrow}
      </p>
      <h1
        ref={headingRef}
        id="signup-step-heading"
        tabIndex={-1}
        className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.045em] text-zinc-950 outline-none sm:text-4xl lg:text-5xl"
      >
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
};

const ProfilePreview = ({ draft }: ProfilePreviewProps) => {
  const initial = draft.name.trim().charAt(0).toUpperCase() || "✦";
  const detailParts = [draft.jobTitle.trim(), draft.city.trim()].filter(
    (part) => Boolean(part),
  );
  const vibeLabels: string[] = [];

  if (draft.weekdayPace) {
    vibeLabels.push(
      ProfileConstantsCollection.WeekdayPaceLabel[draft.weekdayPace],
    );
  }

  if (draft.socialBattery) {
    vibeLabels.push(
      ProfileConstantsCollection.SocialBatteryLabel[draft.socialBattery],
    );
  }

  if (draft.movieNightStyle) {
    vibeLabels.push(
      ProfileConstantsCollection.MovieNightStyleLabel[draft.movieNightStyle],
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-4">
        <p className="text-xs font-bold tracking-[0.18em] text-zinc-500 uppercase">
          Live profile preview
        </p>
      </div>
      <article className="relative overflow-hidden rounded-[2rem] bg-zinc-950 text-white shadow-[0_36px_90px_-32px_rgba(30,41,59,0.55)]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#93c5fd_0%,#4f46e5_34%,#2563eb_72%,#172554_100%)]">
          <div
            aria-hidden="true"
            className="absolute -top-12 -right-10 size-52 rounded-full border border-white/20 bg-white/10 blur-sm"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-16 -left-12 size-44 rounded-full border border-white/15 bg-zinc-950/15"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-32 items-center justify-center rounded-full border border-white/25 bg-white/15 text-6xl font-semibold shadow-2xl backdrop-blur-md">
              {initial}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent px-6 pt-28 pb-6">
            <h2 className="text-3xl font-semibold tracking-[-0.045em]">
              {draft.name.trim() || "Your name"}
              {draft.age ? `, ${String(draft.age)}` : ""}
            </h2>
            <p className="mt-1 min-h-5 text-sm text-white/70">
              {detailParts.length
                ? detailParts.join(" · ")
                : "Your details will appear here"}
            </p>
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="min-h-12 text-sm leading-6 text-white/80">
            {draft.bio.trim() ||
              "Add a short bio that gives someone an easy way to start a conversation."}
          </p>
          {vibeLabels.length ? (
            <ul
              className="flex flex-wrap gap-2"
              aria-label="Selected profile vibes"
            >
              {vibeLabels.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-white/45">
              Your selected vibes will make this card feel more personal.
            </p>
          )}
        </div>
      </article>
    </div>
  );
};

const SignupMessage = ({ isError, message }: SignupMessageProps) => {
  return (
    <p
      id="signup-message"
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
          : "mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
      }
    >
      {message}
    </p>
  );
};

const SignupSubmitButton = ({
  disabled = false,
  idleLabel,
  pendingLabel,
  resendPendingLabel,
}: SignupSubmitButtonProps) => {
  const { data, pending } = useFormStatus();
  const submissionIsOtpResend = pending && data?.get("resendOtp") === "true";
  const visiblePendingLabel =
    submissionIsOtpResend && resendPendingLabel
      ? resendPendingLabel
      : pendingLabel;

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="from-brand-600 to-brand-accent-600 focus-visible:ring-brand-600/25 group flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 text-base font-semibold text-white shadow-[0_18px_40px_-16px_rgba(79,70,229,0.68)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-16px_rgba(79,70,229,0.82)] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-65 disabled:hover:translate-y-0"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="mr-2 size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
          />
          {visiblePendingLabel}
        </>
      ) : (
        <>
          {idleLabel}
          <span
            aria-hidden="true"
            className="ml-2 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
          >
            →
          </span>
        </>
      )}
    </button>
  );
};

const HiddenProfileFields = ({
  draft,
  mode,
  session,
}: HiddenProfileFieldsProps) => {
  return (
    <>
      <input name="signupMode" type="hidden" value={mode} />
      <input name="signupSession" type="hidden" value={session} />
      <input name="name" type="hidden" value={draft.name.trim()} />
      <input name="age" type="hidden" value={draft.age} />
      <input name="gender" type="hidden" value={draft.gender} />
      <input name="bio" type="hidden" value={draft.bio.trim()} />
      <input name="jobTitle" type="hidden" value={draft.jobTitle.trim()} />
      <input name="city" type="hidden" value={draft.city.trim()} />
      <input name="weekdayPace" type="hidden" value={draft.weekdayPace} />
      <input name="socialBattery" type="hidden" value={draft.socialBattery} />
      <input
        name="movieNightStyle"
        type="hidden"
        value={draft.movieNightStyle}
      />
      {draft.interestedIn.map((interest) => (
        <input
          key={interest}
          name="interestedIn"
          type="hidden"
          value={interest}
        />
      ))}
    </>
  );
};

const OptionalStepActions = ({
  children,
  onSkip,
}: {
  children: ReactNode;
  onSkip: () => void;
}) => {
  return (
    <div className="space-y-3">
      {children}
      <button
        type="button"
        onClick={onSkip}
        className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
      >
        Skip for now
      </button>
    </div>
  );
};

export const SignupFlow = () => {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>(SignupStep.Hook);
  const [resumeStep, setResumeStep] = useState<SignupStep | null>(null);
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [hint, setHint] = useState("");
  const [mode, setMode] = useState<SignupMode>(
    SignupConstantsCollection.SignupMode.Otp,
  );
  const [signupSession, setSignupSession] = useState(0);
  const [draftPersistenceEnabled, setDraftPersistenceEnabled] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [dismissedResponseId, setDismissedResponseId] = useState<number | null>(
    null,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialSignupActionState,
  );

  const stepIndex = getStepIndex({ step });
  const isAccountStep = step === SignupStep.Account;
  const isCurrentActionState =
    state.mode === mode && state.session === signupSession;
  const isOtpCodeStep =
    isAccountStep &&
    mode === SignupConstantsCollection.SignupMode.Otp &&
    isCurrentActionState &&
    state.step === SignupConstantsCollection.OtpSignupStep.Code;
  const isPending = isAccountStep && pending;
  const visibleActionMessage =
    state.responseId !== dismissedResponseId &&
    isCurrentActionState &&
    (isOtpCodeStep || state.email === draft.email.trim())
      ? state.message
      : "";
  const transitionKey = `${step}:${isOtpCodeStep ? "code" : "default"}`;
  const optionalStep =
    step === SignupStep.World ||
    step === SignupStep.Vibe ||
    step === SignupStep.Bio;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const persistedSignup = readPersistedSignup();

      if (persistedSignup) {
        setDraft(persistedSignup.draft);
        setDraftPersistenceEnabled(true);

        if (persistedSignup.step !== SignupStep.Hook) {
          setResumeStep(persistedSignup.step);
        }
      }

      setStorageReady(true);
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    if (!draftPersistenceEnabled || !storageReady || state.success) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(
          CURRENT_SIGNUP_DRAFT_STORAGE_KEY,
          JSON.stringify({
            draft,
            step: step === SignupStep.Hook && resumeStep ? resumeStep : step,
          }),
        );
      } catch {
        // A blocked or full storage area must not prevent account creation.
      }
    }, SIGNUP_DRAFT_SAVE_DELAY_MS);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [
    draft,
    draftPersistenceEnabled,
    resumeStep,
    state.success,
    step,
    storageReady,
  ]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    headingRef.current?.focus();
  }, [step, storageReady]);

  useEffect(() => {
    if (state.field === SignupConstantsCollection.SignupActionField.Email) {
      emailInputRef.current?.focus();
      return;
    }

    if (state.field === SignupConstantsCollection.SignupActionField.Otp) {
      otpInputRef.current?.focus();
      return;
    }

    if (state.field === SignupConstantsCollection.SignupActionField.Password) {
      passwordInputRef.current?.focus();
      return;
    }

    if (
      !state.isError &&
      state.step === SignupConstantsCollection.OtpSignupStep.Code
    ) {
      otpInputRef.current?.focus();
    }
  }, [state.field, state.isError, state.responseId, state.step]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    try {
      sessionStorage.removeItem(CURRENT_SIGNUP_DRAFT_STORAGE_KEY);
    } catch {
      // Redirect even if privacy settings prevent storage cleanup.
    }

    router.replace("/feed");
  }, [router, state.success]);

  const clearLocalFeedback = () => {
    setHint("");
    setDismissedResponseId(state.responseId);
  };

  const discardSavedDraft = () => {
    setDraftPersistenceEnabled(false);

    try {
      sessionStorage.removeItem(CURRENT_SIGNUP_DRAFT_STORAGE_KEY);
    } catch {
      // Reset the in-memory draft even when browser storage is unavailable.
    }

    setDraft(emptyDraft);
    setResumeStep(null);
    setStep(SignupStep.Hook);
    setPassword("");
    setOtp("");
    setPasswordVisible(false);
    setHint("");
    setMode(SignupConstantsCollection.SignupMode.Otp);
    setDismissedResponseId(state.responseId);
    setSignupSession((currentSession) => currentSession + 1);
  };

  const goNext = () => {
    if (step === SignupStep.Hook && resumeStep) {
      setStep(resumeStep);
      setResumeStep(null);
      return;
    }

    const stepError = getStepError({ draft, step });

    if (stepError) {
      setHint(stepError);
      return;
    }

    setHint("");

    if (step === SignupStep.Hook) {
      setDraftPersistenceEnabled(true);
    }

    setStep(getNextStep({ step }));
  };

  const goBack = () => {
    setHint("");
    setDismissedResponseId(state.responseId);

    if (isOtpCodeStep) {
      setOtp("");
      setSignupSession((currentSession) => currentSession + 1);
      return;
    }

    if (isAccountStep) {
      setSignupSession((currentSession) => currentSession + 1);
    }

    setStep(getPreviousStep({ step }));
  };

  const skipOptionalStep = () => {
    setHint("");
    setStep(getNextStep({ step }));
  };

  const showOtpSignup = () => {
    setMode(SignupConstantsCollection.SignupMode.Otp);
    setOtp("");
    setHint("");
    setDismissedResponseId(state.responseId);
    setSignupSession((currentSession) => currentSession + 1);
  };

  const showPasswordSignup = () => {
    setMode(SignupConstantsCollection.SignupMode.Password);
    setHint("");
    setDismissedResponseId(state.responseId);
    setSignupSession((currentSession) => currentSession + 1);
  };

  const changeOtpEmail = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      email: state.email,
    }));
    setOtp("");
    setDismissedResponseId(state.responseId);
    setSignupSession((currentSession) => currentSession + 1);
  };

  const toggleInterest = ({ interest }: ToggleInterestInput) => {
    clearLocalFeedback();
    setDraft((currentDraft) => {
      if (currentDraft.interestedIn.includes(interest)) {
        return {
          ...currentDraft,
          interestedIn: currentDraft.interestedIn.filter(
            (value) => value !== interest,
          ),
        };
      }

      return {
        ...currentDraft,
        interestedIn: [...currentDraft.interestedIn, interest],
      };
    });
  };

  const handleSignupSubmit = ({ event }: HandleSignupSubmitInput) => {
    if (isAccountStep) {
      return;
    }

    event.preventDefault();
    goNext();
  };

  const passwordRequirements = [
    {
      label: "8–32 characters",
      met: password.length >= 8 && password.length <= 32,
    },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <form
      action={formAction}
      aria-busy={isPending || state.success}
      onSubmit={(event) => handleSignupSubmit({ event })}
      className="bg-brand-surface relative isolate min-h-svh overflow-x-hidden text-zinc-950"
    >
      <HiddenProfileFields draft={draft} mode={mode} session={signupSession} />

      <div
        aria-hidden="true"
        className={`${styles.ambientOrb} bg-brand-400/20 absolute -top-40 -left-40 size-[28rem] rounded-full blur-3xl`}
      />
      <div
        aria-hidden="true"
        className={`${styles.ambientOrbDelayed} bg-brand-accent-300/20 absolute right-[-12rem] bottom-[-12rem] size-[34rem] rounded-full blur-3xl`}
      />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link
          href="/login"
          className="focus-visible:ring-brand-600/20 flex min-h-11 items-center gap-2.5 rounded-xl pr-3 font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-4"
        >
          <BrandMark className="shadow-brand-600/20 size-9 shadow-lg" />
          {BrandConstantsCollection.DisplayName}
        </Link>

        {step === SignupStep.Hook ? (
          <Link
            href="/login"
            className="focus-visible:ring-brand-600/15 flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4"
          >
            Log in
          </Link>
        ) : (
          <button
            type="button"
            disabled={isPending || state.success}
            onClick={goBack}
            className="focus-visible:ring-brand-600/15 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-50"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        )}
      </header>

      {step === SignupStep.Hook ? null : (
        <div className="relative z-20 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <div
            aria-hidden="true"
            className="flex items-center justify-between text-xs font-semibold text-zinc-500"
          >
            <span>Signup progress</span>
            <span>
              Step {String(stepIndex)} of {String(SIGNUP_STEP_COUNT)}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Signup progress"
            aria-valuemax={SIGNUP_STEP_COUNT}
            aria-valuemin={0}
            aria-valuenow={stepIndex}
            aria-valuetext={`Step ${String(stepIndex)} of ${String(SIGNUP_STEP_COUNT)}`}
            className="pointer-events-none mt-2 h-0.5 w-full overflow-hidden bg-zinc-300"
          >
            <div
              aria-hidden="true"
              className="bg-brand-700 h-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${String((stepIndex / SIGNUP_STEP_COUNT) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto grid min-h-[calc(100svh-7.5rem)] w-full max-w-7xl gap-12 px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:px-12 lg:py-12 xl:gap-20">
        <section
          aria-labelledby="signup-step-heading"
          className="mx-auto flex w-full max-w-2xl flex-col"
        >
          <div key={transitionKey} className={styles.stage}>
            {step === SignupStep.Hook ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow="A profile worth opening"
                  title="Meet people worth a second glance."
                  description="A few thoughtful choices create a profile that feels like you. You can finish in your own time, and optional details can always wait."
                />
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["01", "Tell us the basics"],
                    ["02", "Choose your vibe"],
                    ["03", "Start connecting"],
                  ].map(([number, label]) => (
                    <div
                      key={number}
                      className="rounded-2xl border border-white bg-white/75 p-4 shadow-sm backdrop-blur-sm"
                    >
                      <span className="text-brand-700 text-xs font-bold">
                        {number}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-zinc-800">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {step === SignupStep.Basics ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow="The essentials"
                  title="Let’s start with you."
                  description="Use the name and age you want people to see on your profile."
                />
                <div className="mt-8 grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="mb-2 block text-sm font-semibold text-zinc-800"
                    >
                      First name
                    </label>
                    <input
                      id="signup-name"
                      autoComplete="name"
                      value={draft.name}
                      maxLength={ProfileConstantsCollection.FieldLimit.Name}
                      onChange={(event) => {
                        clearLocalFeedback();
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          name: event.target.value,
                        }));
                      }}
                      placeholder="Your name"
                      aria-describedby={hint ? "signup-message" : undefined}
                      aria-invalid={Boolean(
                        hint && draft.name.trim().length < 2,
                      )}
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="signup-age"
                      className="mb-2 block text-sm font-semibold text-zinc-800"
                    >
                      Age
                    </label>
                    <input
                      id="signup-age"
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={120}
                      step={1}
                      value={draft.age || ""}
                      onChange={(event) => {
                        const nextAge = Number.parseInt(event.target.value, 10);
                        clearLocalFeedback();
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          age: Number.isNaN(nextAge) ? 0 : nextAge,
                        }));
                      }}
                      placeholder="18+"
                      aria-describedby={hint ? "signup-message" : undefined}
                      aria-invalid={Boolean(
                        hint &&
                        (draft.age < 18 ||
                          draft.age > 120 ||
                          !Number.isInteger(draft.age)),
                      )}
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  {BrandConstantsCollection.DisplayName} is for adults aged 18
                  and over.
                </p>
              </div>
            ) : null}

            {step === SignupStep.People ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow="Your preferences"
                  title="Who would you like to meet?"
                  description="These choices shape what you see. You can update them from your profile later."
                />
                <div className="mt-8 space-y-8">
                  <fieldset>
                    <legend className="text-sm font-semibold text-zinc-800">
                      I am a
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {SIGNUP_GENDER_OPTIONS.map((gender) => (
                        <ChoiceInput
                          key={gender}
                          checked={draft.gender === gender}
                          label={GENDER_LABEL[gender]}
                          name="signup-gender-choice"
                          onSelect={() => {
                            clearLocalFeedback();
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              gender,
                            }));
                          }}
                          type="radio"
                          value={gender}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-semibold text-zinc-800">
                      I’m interested in
                    </legend>
                    <p className="mt-1 text-xs text-zinc-500">
                      Choose one or both.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {Object.values(
                        ProfileConstantsCollection.UserInterest,
                      ).map((interest) => (
                        <ChoiceInput
                          key={interest}
                          checked={draft.interestedIn.includes(interest)}
                          label={INTEREST_LABEL[interest]}
                          name="signup-interest-choice"
                          onSelect={() => toggleInterest({ interest })}
                          type="checkbox"
                          value={interest}
                        />
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            ) : null}

            {step === SignupStep.World ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow="A little context · Optional"
                  title="Where does life happen for you?"
                  description="A city and job can make introductions feel more natural, but neither is required."
                />
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="signup-city"
                      className="mb-2 block text-sm font-semibold text-zinc-800"
                    >
                      City
                    </label>
                    <input
                      id="signup-city"
                      autoComplete="address-level2"
                      value={draft.city}
                      maxLength={ProfileConstantsCollection.FieldLimit.City}
                      onChange={(event) => {
                        clearLocalFeedback();
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          city: event.target.value,
                        }));
                      }}
                      placeholder="Mumbai"
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="signup-job-title"
                      className="mb-2 block text-sm font-semibold text-zinc-800"
                    >
                      Job title
                    </label>
                    <input
                      id="signup-job-title"
                      autoComplete="organization-title"
                      value={draft.jobTitle}
                      maxLength={ProfileConstantsCollection.FieldLimit.JobTitle}
                      onChange={(event) => {
                        clearLocalFeedback();
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          jobTitle: event.target.value,
                        }));
                      }}
                      placeholder="Product designer"
                      className={INPUT_CLASS_NAME}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === SignupStep.Vibe ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow="More about you · Optional"
                  title="Choose what sounds most like you."
                  description="Choose the closest answer in each section. You can leave any section blank and change these later."
                />
                <div className="mt-8 space-y-7">
                  <fieldset>
                    <legend className="text-sm font-semibold text-zinc-800">
                      Which comes closest to your usual weekday?
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {Object.values(
                        ProfileConstantsCollection.WeekdayPace,
                      ).map((value) => (
                        <ChoiceInput
                          key={value}
                          checked={draft.weekdayPace === value}
                          label={
                            ProfileConstantsCollection.WeekdayPaceLabel[value]
                          }
                          name="signup-weekday-pace"
                          onSelect={() => {
                            clearLocalFeedback();
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              weekdayPace: value,
                            }));
                          }}
                          type="radio"
                          value={value}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-semibold text-zinc-800">
                      Which kind of plan sounds best to you?
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {Object.values(
                        ProfileConstantsCollection.SocialBattery,
                      ).map((value) => (
                        <ChoiceInput
                          key={value}
                          checked={draft.socialBattery === value}
                          label={
                            ProfileConstantsCollection.SocialBatteryLabel[value]
                          }
                          name="signup-social-battery"
                          onSelect={() => {
                            clearLocalFeedback();
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              socialBattery: value,
                            }));
                          }}
                          type="radio"
                          value={value}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-semibold text-zinc-800">
                      Which movie night sounds best to you?
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {Object.values(
                        ProfileConstantsCollection.MovieNightStyle,
                      ).map((value) => (
                        <ChoiceInput
                          key={value}
                          checked={draft.movieNightStyle === value}
                          label={
                            ProfileConstantsCollection.MovieNightStyleLabel[
                              value
                            ]
                          }
                          name="signup-movie-night"
                          onSelect={() => {
                            clearLocalFeedback();
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              movieNightStyle: value,
                            }));
                          }}
                          type="radio"
                          value={value}
                        />
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            ) : null}

            {step === SignupStep.Bio ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow="Your introduction · Optional"
                  title="Give them an easy opening line."
                  description="A few honest details are better than a perfect paragraph."
                />
                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="signup-bio"
                      className="text-sm font-semibold text-zinc-800"
                    >
                      About me
                    </label>
                    <span
                      id="signup-bio-count"
                      className="text-xs tabular-nums text-zinc-500"
                    >
                      {String(draft.bio.length)}/
                      {String(ProfileConstantsCollection.FieldLimit.Bio)}
                    </span>
                  </div>
                  <textarea
                    id="signup-bio"
                    value={draft.bio}
                    maxLength={ProfileConstantsCollection.FieldLimit.Bio}
                    rows={5}
                    onChange={(event) => {
                      clearLocalFeedback();
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        bio: event.target.value,
                      }));
                    }}
                    placeholder="A great weekend, what you’re learning, or the thing your friends always ask you about…"
                    aria-describedby="signup-bio-count"
                    className={`${INPUT_CLASS_NAME} mt-2 min-h-36 resize-none overflow-y-auto leading-6`}
                  />
                </div>
                <div className="mt-8 lg:hidden">
                  <ProfilePreview draft={draft} />
                </div>
              </div>
            ) : null}

            {step === SignupStep.Account ? (
              <div>
                <StepIntro
                  headingRef={headingRef}
                  eyebrow={
                    isOtpCodeStep ? "Check your inbox" : "Secure your profile"
                  }
                  title={
                    isOtpCodeStep
                      ? "Enter your six-digit code."
                      : mode === SignupConstantsCollection.SignupMode.Otp
                        ? "Join without a password."
                        : "Create a password."
                  }
                  description={
                    isOtpCodeStep
                      ? `We sent a code to ${state.email}. It expires after 10 minutes.`
                      : mode === SignupConstantsCollection.SignupMode.Otp
                        ? "We’ll email you a one-time code. No password to remember."
                        : "Use a strong password that you do not reuse anywhere else."
                  }
                />

                <fieldset
                  disabled={isPending || state.success}
                  className="mt-8"
                >
                  {mode === SignupConstantsCollection.SignupMode.Otp ? (
                    isOtpCodeStep ? (
                      <div>
                        <input name="email" type="hidden" value={state.email} />
                        <label
                          htmlFor="signup-otp"
                          className="mb-2 block text-sm font-semibold text-zinc-800"
                        >
                          Verification code
                        </label>
                        <input
                          ref={otpInputRef}
                          id="signup-otp"
                          name="otp"
                          type="text"
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          maxLength={6}
                          minLength={6}
                          pattern="[0-9]{6}"
                          value={otp}
                          onChange={(event) => {
                            setOtp(
                              event.target.value
                                .replace(/\D/gu, "")
                                .slice(0, 6),
                            );
                            setDismissedResponseId(state.responseId);
                          }}
                          placeholder="000000"
                          required
                          aria-describedby={
                            visibleActionMessage
                              ? "signup-otp-help signup-message"
                              : "signup-otp-help"
                          }
                          aria-invalid={Boolean(
                            visibleActionMessage &&
                            state.field ===
                              SignupConstantsCollection.SignupActionField.Otp,
                          )}
                          className={`${INPUT_CLASS_NAME} text-center text-xl font-semibold tracking-[0.45em] tabular-nums`}
                        />
                        <p
                          id="signup-otp-help"
                          className="mt-2 text-xs leading-5 text-zinc-500"
                        >
                          You can paste the full code from your email.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={changeOtpEmail}
                            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-zinc-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                          >
                            Change email
                          </button>
                          <button
                            type="submit"
                            name="resendOtp"
                            value="true"
                            formNoValidate
                            className="text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-600/15 min-h-11 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4"
                          >
                            Send code again
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="signup-otp-email"
                          className="mb-2 block text-sm font-semibold text-zinc-800"
                        >
                          Email address
                        </label>
                        <input
                          ref={emailInputRef}
                          id="signup-otp-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          maxLength={254}
                          required
                          value={draft.email}
                          onChange={(event) => {
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              email: event.target.value,
                            }));
                            setDismissedResponseId(state.responseId);
                          }}
                          placeholder="you@example.com"
                          aria-describedby={
                            visibleActionMessage
                              ? "signup-email-help signup-message"
                              : "signup-email-help"
                          }
                          aria-invalid={Boolean(
                            visibleActionMessage &&
                            state.field ===
                              SignupConstantsCollection.SignupActionField.Email,
                          )}
                          className={INPUT_CLASS_NAME}
                        />
                        <p
                          id="signup-email-help"
                          className="mt-2 text-xs leading-5 text-zinc-500"
                        >
                          We use this only to secure and recover your account.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="signup-password-email"
                          className="mb-2 block text-sm font-semibold text-zinc-800"
                        >
                          Email address
                        </label>
                        <input
                          ref={emailInputRef}
                          id="signup-password-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          maxLength={254}
                          required
                          value={draft.email}
                          onChange={(event) => {
                            setDraft((currentDraft) => ({
                              ...currentDraft,
                              email: event.target.value,
                            }));
                            setDismissedResponseId(state.responseId);
                          }}
                          placeholder="you@example.com"
                          aria-describedby={
                            visibleActionMessage ? "signup-message" : undefined
                          }
                          aria-invalid={Boolean(
                            visibleActionMessage &&
                            state.field ===
                              SignupConstantsCollection.SignupActionField.Email,
                          )}
                          className={INPUT_CLASS_NAME}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="signup-password"
                          className="mb-2 block text-sm font-semibold text-zinc-800"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            ref={passwordInputRef}
                            id="signup-password"
                            name="password"
                            type={passwordVisible ? "text" : "password"}
                            autoComplete="new-password"
                            maxLength={32}
                            minLength={8}
                            required
                            value={password}
                            onChange={(event) => {
                              setPassword(event.target.value);
                              setDismissedResponseId(state.responseId);
                            }}
                            placeholder="Create a password"
                            aria-describedby={
                              visibleActionMessage
                                ? "signup-password-requirements signup-message"
                                : "signup-password-requirements"
                            }
                            aria-invalid={Boolean(
                              visibleActionMessage &&
                              state.field ===
                                SignupConstantsCollection.SignupActionField
                                  .Password,
                            )}
                            className={`${INPUT_CLASS_NAME} pr-20`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPasswordVisible(
                                (currentVisibility) => !currentVisibility,
                              )
                            }
                            className="absolute inset-y-0 right-2 my-auto min-h-10 rounded-xl px-3 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                            aria-label={
                              passwordVisible
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {passwordVisible ? "Hide" : "Show"}
                          </button>
                        </div>
                        <ul
                          id="signup-password-requirements"
                          className="mt-3 grid gap-2 text-xs sm:grid-cols-2"
                          aria-label="Password requirements"
                        >
                          {passwordRequirements.map((requirement) => (
                            <li
                              key={requirement.label}
                              className={
                                requirement.met
                                  ? "flex items-center gap-2 text-emerald-700"
                                  : "flex items-center gap-2 text-zinc-500"
                              }
                            >
                              <span aria-hidden="true">
                                {requirement.met ? "✓" : "○"}
                              </span>
                              {requirement.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
            ) : null}
          </div>

          {hint ? (
            <SignupMessage isError message={hint} />
          ) : visibleActionMessage ? (
            <SignupMessage
              isError={state.isError}
              message={visibleActionMessage}
            />
          ) : null}

          <div className="sticky bottom-0 z-20 mt-auto -mx-2 px-2 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:mt-8 lg:px-0 lg:pt-0 lg:pb-0">
            {isAccountStep ? (
              <div className="space-y-4">
                <SignupSubmitButton
                  disabled={state.success}
                  idleLabel={
                    mode === SignupConstantsCollection.SignupMode.Password
                      ? "Create my account"
                      : isOtpCodeStep
                        ? "Verify and start exploring"
                        : "Email me a code"
                  }
                  pendingLabel={
                    mode === SignupConstantsCollection.SignupMode.Password
                      ? "Creating your account…"
                      : isOtpCodeStep
                        ? "Verifying your code…"
                        : "Sending your code…"
                  }
                  resendPendingLabel="Sending another code…"
                />
                <p className="text-center text-sm text-zinc-500">
                  {mode === SignupConstantsCollection.SignupMode.Otp
                    ? "Prefer using a password?"
                    : "Want the faster option?"}{" "}
                  <button
                    type="button"
                    disabled={isPending || state.success}
                    onClick={
                      mode === SignupConstantsCollection.SignupMode.Otp
                        ? showPasswordSignup
                        : showOtpSignup
                    }
                    className="text-brand-700 focus-visible:ring-brand-600/15 min-h-11 rounded-lg px-2 font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 disabled:cursor-wait disabled:opacity-50"
                  >
                    {mode === SignupConstantsCollection.SignupMode.Otp
                      ? "Use a password"
                      : "Email me a code"}
                  </button>
                </p>
              </div>
            ) : optionalStep ? (
              <OptionalStepActions onSkip={skipOptionalStep}>
                <button
                  type="submit"
                  className="from-brand-600 to-brand-accent-600 focus-visible:ring-brand-600/25 group flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 text-base font-semibold text-white shadow-[0_18px_40px_-16px_rgba(79,70,229,0.68)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-16px_rgba(79,70,229,0.82)] focus-visible:outline-none focus-visible:ring-4"
                >
                  {getStepActionLabel({ step })}
                  <span
                    aria-hidden="true"
                    className="ml-2 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </button>
              </OptionalStepActions>
            ) : (
              <div className="space-y-3">
                <button
                  type="submit"
                  className="from-brand-600 to-brand-accent-600 focus-visible:ring-brand-600/25 group flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r px-6 text-base font-semibold text-white shadow-[0_18px_40px_-16px_rgba(79,70,229,0.68)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-16px_rgba(79,70,229,0.82)] focus-visible:outline-none focus-visible:ring-4"
                >
                  {step === SignupStep.Hook && resumeStep
                    ? "Continue my profile"
                    : getStepActionLabel({ step })}
                  <span
                    aria-hidden="true"
                    className="ml-2 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </button>
                {step === SignupStep.Hook && resumeStep ? (
                  <button
                    type="button"
                    onClick={discardSavedDraft}
                    aria-label="Discard saved signup draft and start over"
                    className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100/70 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                  >
                    Start over
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <aside
          aria-label="Profile preview"
          className="hidden items-center justify-center lg:flex"
        >
          <ProfilePreview draft={draft} />
        </aside>
      </main>
    </form>
  );
};

/*
 * React 19 learning notes
 * - `useActionState` keeps OTP/password mutation results attached to the form.
 * - `useFormStatus` lets the nested account button read pending state and the
 *   submitted `FormData`, so OTP retries receive an accurate pending label.
 * - React 18.2 typically required separate request, pending, error, and result
 *   state plus manual tracking of which submit button started the request.
 *
 * Next.js 16 learning notes
 * - The route remains a Server Component shell while this focused Client
 *   Component owns browser-only draft storage and interactive step state.
 * - Next.js 14.1 used the same Server/Client boundary, but the current app uses
 *   the Next.js 16 async routing and metadata conventions around that boundary.
 */
