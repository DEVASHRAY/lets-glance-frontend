"use client";

import { redirect } from "next/navigation";
import { useActionState, useState } from "react";

import { AuthConstantsCollection } from "@/features/auth/auth.constants";
import {
  initialLoginActionState,
  loginAction,
  otpLoginAction,
  type OtpLoginActionState,
} from "@/features/auth/login.action";
import { LoginSubmitButton } from "@/features/auth/login-submit-button";

type LoginMode =
  (typeof AuthConstantsCollection.LoginMode)[keyof typeof AuthConstantsCollection.LoginMode];

interface LoginFormProps {
  defaultEmail?: string;
  defaultPassword?: string;
}

interface ChangeEmailInput {
  email: string;
}

interface LoginMessageProps {
  isError: boolean;
  message: string;
}

interface LoginModeSwitchProps {
  disabled: boolean;
  label: string;
  onSwitch: () => void;
  prompt: string;
}

interface OtpLoginFormProps {
  email: string;
  onChangeEmail: (input: ChangeEmailInput) => void;
  onEmailInput: (input: ChangeEmailInput) => void;
  onSwitchMode: () => void;
}

interface PasswordLoginFormProps {
  defaultPassword?: string;
  email: string;
  onEmailInput: (input: ChangeEmailInput) => void;
  onSwitchMode: () => void;
}

const INPUT_CLASS_NAME =
  "border-brand-border-strong bg-brand-50/60 text-brand-ink placeholder:text-brand-subtle hover:border-brand-muted focus:border-brand-600 focus:ring-brand-600/15 focus-visible:outline-brand-600 min-h-12 w-full rounded-2xl border px-4 py-3 text-base outline-none transition focus:ring-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid aria-invalid:border-rose-500 aria-invalid:focus:border-rose-500 disabled:cursor-wait disabled:opacity-70";

const LoginMessage = ({ isError, message }: LoginMessageProps) => {
  return (
    <p
      id="login-message"
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      }
    >
      {message}
    </p>
  );
};

const LoginModeSwitch = ({
  disabled,
  label,
  onSwitch,
  prompt,
}: LoginModeSwitchProps) => {
  return (
    <p className="text-brand-subtle text-center text-sm">
      {prompt}{" "}
      <button
        type="button"
        disabled={disabled}
        onClick={onSwitch}
        className="text-brand-muted hover:text-brand-700 focus-visible:ring-brand-600/70 font-semibold underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60"
      >
        {label}
      </button>
    </p>
  );
};

const OtpLoginForm = ({
  email,
  onChangeEmail,
  onEmailInput,
  onSwitchMode,
}: OtpLoginFormProps) => {
  const initialOtpLoginActionState: OtpLoginActionState = {
    email,
    isError: false,
    message: "",
    step: AuthConstantsCollection.OtpLoginStep.Email,
    success: false,
  };
  const [state, formAction, pending] = useActionState(
    otpLoginAction,
    initialOtpLoginActionState,
  );

  if (state.success) {
    redirect("/feed");
  }

  const isCodeStep = state.step === AuthConstantsCollection.OtpLoginStep.Code;
  const visibleEmailMessage = state.email === email.trim() ? state.message : "";

  return (
    <form action={formAction} aria-busy={pending} className="mt-8 space-y-5">
      {isCodeStep ? (
        <>
          <input name="email" type="hidden" value={state.email} />
          <div className="space-y-2">
            <p
              id="otp-destination"
              className="text-brand-muted text-sm leading-6"
            >
              We sent a 6-digit code to{" "}
              <strong className="text-brand-ink/90 font-semibold">
                {state.email}
              </strong>
              {"."}
            </p>
            <label
              htmlFor="otp"
              className="text-brand-ink/90 block text-sm font-semibold"
            >
              Verification code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              autoComplete="one-time-code"
              autoFocus
              disabled={pending}
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              required
              aria-describedby="otp-destination login-message"
              aria-invalid={state.isError}
              className={`${INPUT_CLASS_NAME} text-center text-xl tracking-[0.4em]`}
            />
          </div>

          {state.message ? (
            <LoginMessage isError={state.isError} message={state.message} />
          ) : null}

          <LoginSubmitButton
            idleLabel="Verify and log in"
            pendingLabel="Verifying…"
          />

          <button
            type="button"
            disabled={pending}
            onClick={() => onChangeEmail({ email: state.email })}
            className="text-brand-muted hover:text-brand-700 focus-visible:ring-brand-600/70 min-h-10 w-full rounded-xl text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60"
          >
            Change email
          </button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label
              htmlFor="otp-email"
              className="text-brand-ink/90 block text-sm font-semibold"
            >
              Email
            </label>
            <input
              id="otp-email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={pending}
              value={email}
              onChange={(event) =>
                onEmailInput({ email: event.currentTarget.value })
              }
              inputMode="email"
              maxLength={254}
              placeholder="you@example.com"
              required
              aria-describedby={
                visibleEmailMessage ? "login-message" : undefined
              }
              aria-invalid={Boolean(visibleEmailMessage)}
              className={INPUT_CLASS_NAME}
            />
          </div>

          {visibleEmailMessage ? (
            <LoginMessage isError message={visibleEmailMessage} />
          ) : null}

          <LoginSubmitButton
            idleLabel="Email me a code"
            pendingLabel="Sending code…"
          />
        </>
      )}

      <LoginModeSwitch
        disabled={pending}
        label="Use password instead"
        onSwitch={onSwitchMode}
        prompt="Prefer your password?"
      />
    </form>
  );
};

const PasswordLoginForm = ({
  defaultPassword,
  email,
  onEmailInput,
  onSwitchMode,
}: PasswordLoginFormProps) => {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginActionState,
  );

  if (state.success) {
    redirect("/feed");
  }

  return (
    <form action={formAction} aria-busy={pending} className="mt-8 space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-brand-ink/90 block text-sm font-semibold"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={pending}
          value={email}
          onChange={(event) =>
            onEmailInput({ email: event.currentTarget.value })
          }
          inputMode="email"
          maxLength={254}
          placeholder="you@example.com"
          required
          aria-describedby={state.message ? "login-message" : undefined}
          aria-invalid={Boolean(state.message)}
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-brand-ink/90 block text-sm font-semibold"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue={defaultPassword}
          disabled={pending}
          maxLength={32}
          placeholder="Enter your password"
          required
          aria-describedby={state.message ? "login-message" : undefined}
          aria-invalid={Boolean(state.message)}
          className={INPUT_CLASS_NAME}
        />
      </div>

      {state.message ? (
        <LoginMessage isError={!state.success} message={state.message} />
      ) : null}

      <LoginSubmitButton
        idleLabel="Log in with password"
        pendingLabel="Logging in…"
      />

      <LoginModeSwitch
        disabled={pending}
        label="Email me a code"
        onSwitch={onSwitchMode}
        prompt="Forgot your password?"
      />
    </form>
  );
};

export const LoginForm = ({
  defaultEmail,
  defaultPassword,
}: LoginFormProps) => {
  const [mode, setMode] = useState<LoginMode>(
    AuthConstantsCollection.LoginMode.Otp,
  );
  const [email, setEmail] = useState(defaultEmail || "");
  const [otpFormVersion, setOtpFormVersion] = useState(0);

  const updateEmail = ({ email: nextEmail }: ChangeEmailInput) => {
    setEmail(nextEmail);
  };

  const changeEmail = ({ email: nextEmail }: ChangeEmailInput) => {
    setEmail(nextEmail);
    setOtpFormVersion((currentVersion) => currentVersion + 1);
  };

  const showOtpLogin = () => {
    setMode(AuthConstantsCollection.LoginMode.Otp);
  };

  const showPasswordLogin = () => {
    setMode(AuthConstantsCollection.LoginMode.Password);
  };

  if (mode === AuthConstantsCollection.LoginMode.Password) {
    return (
      <PasswordLoginForm
        defaultPassword={defaultPassword}
        email={email}
        onEmailInput={updateEmail}
        onSwitchMode={showOtpLogin}
      />
    );
  }

  return (
    <OtpLoginForm
      key={otpFormVersion}
      email={email}
      onChangeEmail={changeEmail}
      onEmailInput={updateEmail}
      onSwitchMode={showPasswordLogin}
    />
  );
};

/*
 * Learning notes
 *
 * React 19 `useActionState`
 * - Each login mode connects its form Action to the latest result and pending
 *   state. Remounting a mode intentionally discards errors from the old flow.
 * - The OTP Action returns the next form step, so sending and verifying stay in
 *   React's submission lifecycle without an Effect-driven state bridge.
 * - A successful Action triggers a render-time Client Component redirect.
 *
 * React 18.2 comparison
 * - React 18 commonly used an `onSubmit` handler plus separate `useState`
 *   values for pending, result messages, and the OTP request step.
 * - This focused Client Component keeps interactive JavaScript out of the
 *   surrounding Server Component page.
 */
