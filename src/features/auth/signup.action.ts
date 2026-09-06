"use client";

import { z } from "zod";

import { AuthConstantsCollection } from "@/features/auth/auth.constants";
import { SignupConstantsCollection } from "@/features/auth/signup.constants";
import { BrandConstantsCollection } from "@/features/brand/brand.constants";
import { ProfileConstantsCollection } from "@/features/profile/profile.constants";

type UserGender =
  (typeof ProfileConstantsCollection.UserGender)[keyof typeof ProfileConstantsCollection.UserGender];

type UserInterest =
  (typeof ProfileConstantsCollection.UserInterest)[keyof typeof ProfileConstantsCollection.UserInterest];

type SignupMode =
  (typeof SignupConstantsCollection.SignupMode)[keyof typeof SignupConstantsCollection.SignupMode];

type OtpSignupStep =
  (typeof SignupConstantsCollection.OtpSignupStep)[keyof typeof SignupConstantsCollection.OtpSignupStep];

type SignupActionField =
  (typeof SignupConstantsCollection.SignupActionField)[keyof typeof SignupConstantsCollection.SignupActionField];

interface ReadFieldInput {
  formData: FormData;
  name: string;
}

interface ReadResponseMessageInput {
  response: Response;
}

interface ReadSessionInput {
  formData: FormData;
}

interface IsStrongPasswordInput {
  password: string;
}

interface IsValidEmailInput {
  email: string;
}

interface SignupPayload {
  age: number;
  bio?: string;
  email: string;
  gender: UserGender;
  interestedIn: UserInterest[];
  jobTitle?: string;
  life?: {
    cinema?: Record<string, string>;
    lifestyle?: Record<string, string>;
  };
  location?: {
    city: string;
  };
  name: string;
  otp?: string;
  password?: string;
}

interface PersistSignupInput {
  payload: SignupPayload;
  url: string;
}

interface SignupSuccess {
  outcome: typeof AuthConstantsCollection.SignupOutcome.Success;
}

interface SignupConflict {
  outcome: typeof AuthConstantsCollection.SignupOutcome.Conflict;
}

interface SignupFailure {
  message: string;
  outcome: typeof AuthConstantsCollection.SignupOutcome.Failure;
  status?: number;
}

type SignupResult = SignupConflict | SignupFailure | SignupSuccess;

export interface SignupActionState {
  email: string;
  field: SignupActionField | null;
  isError: boolean;
  message: string;
  mode: SignupMode;
  responseId: number;
  session: number;
  step: OtpSignupStep;
  success: boolean;
}

export const initialSignupActionState: SignupActionState = {
  email: "",
  field: null,
  isError: false,
  message: "",
  mode: SignupConstantsCollection.SignupMode.Otp,
  responseId: 0,
  session: 0,
  step: SignupConstantsCollection.OtpSignupStep.Email,
  success: false,
};

const AUTH_REQUEST_TIMEOUT_MS = 10_000;

const errorResponseSchema = z.object({
  message: z.string(),
});

const readField = ({ formData, name }: ReadFieldInput): string => {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const readSession = ({ formData }: ReadSessionInput): number => {
  const session = Number.parseInt(
    readField({ formData, name: "signupSession" }),
    10,
  );

  if (!Number.isInteger(session) || session < 0) {
    return 0;
  }

  return session;
};

const isSignupMode = (value: string): value is SignupMode => {
  return Object.values(SignupConstantsCollection.SignupMode).some(
    (mode) => mode === value,
  );
};

const isUserGender = (value: string): value is UserGender => {
  return Object.values(ProfileConstantsCollection.UserGender).some(
    (option) => option === value,
  );
};

const isUserInterest = (value: string): value is UserInterest => {
  return Object.values(ProfileConstantsCollection.UserInterest).some(
    (interest) => interest === value,
  );
};

const isStrongPassword = ({ password }: IsStrongPasswordInput): boolean => {
  if (password.length < 8 || password.length > 32) {
    return false;
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasLower && hasUpper && hasNumber && hasSymbol;
};

const isValidEmail = ({ email }: IsValidEmailInput): boolean => {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(email);
};

const readOtpSendMessage = async ({
  response,
}: ReadResponseMessageInput): Promise<string> => {
  try {
    const responseText = await response.text();

    if (
      responseText.includes(AuthConstantsCollection.OtpSendMessage.AlreadySent)
    ) {
      return AuthConstantsCollection.OtpSendMessage.AlreadySent;
    }

    if (responseText.includes(AuthConstantsCollection.OtpSendMessage.Sent)) {
      return AuthConstantsCollection.OtpSendMessage.Sent;
    }

    return "";
  } catch {
    return "";
  }
};

const readErrorMessage = async ({
  response,
}: ReadResponseMessageInput): Promise<string> => {
  try {
    const parsedError = errorResponseSchema.safeParse(await response.json());

    return parsedError.success ? parsedError.data.message : "";
  } catch {
    return "";
  }
};

const persistSignup = async ({
  payload,
  url,
}: PersistSignupInput): Promise<SignupResult> => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });

    if (response.status === 409) {
      return {
        outcome: AuthConstantsCollection.SignupOutcome.Conflict,
      };
    }

    if (response.ok) {
      return {
        outcome: AuthConstantsCollection.SignupOutcome.Success,
      };
    }

    const responseMessage = await readErrorMessage({ response });

    return {
      message:
        responseMessage ||
        "That signup could not be completed. Please try again.",
      outcome: AuthConstantsCollection.SignupOutcome.Failure,
      status: response.status,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? "Unable to reach the signup service"
          : "Unexpected signup failure",
      outcome: AuthConstantsCollection.SignupOutcome.Failure,
    };
  }
};

export const signupAction = async (
  previousState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> => {
  const name = readField({ formData, name: "name" });
  const email = readField({ formData, name: "email" });
  const password = formData.get("password");
  const submittedMode = readField({ formData, name: "signupMode" });
  const mode = isSignupMode(submittedMode)
    ? submittedMode
    : SignupConstantsCollection.SignupMode.Otp;
  const session = readSession({ formData });
  const gender = readField({ formData, name: "gender" });
  const ageText = readField({ formData, name: "age" });
  const age = Number.parseInt(ageText, 10);
  const bio = readField({ formData, name: "bio" });
  const jobTitle = readField({ formData, name: "jobTitle" });
  const city = readField({ formData, name: "city" });
  const weekdayPace = readField({ formData, name: "weekdayPace" });
  const socialBattery = readField({ formData, name: "socialBattery" });
  const movieNightStyle = readField({ formData, name: "movieNightStyle" });
  const resendOtp = readField({ formData, name: "resendOtp" }) === "true";
  const interestedIn: UserInterest[] = [];
  const currentState: SignupActionState = {
    email,
    field: null,
    isError: true,
    message: "",
    mode,
    responseId: previousState.responseId + 1,
    session,
    step: SignupConstantsCollection.OtpSignupStep.Email,
    success: false,
  };

  if (!isSignupMode(submittedMode)) {
    return {
      ...currentState,
      message: "Choose how you want to sign up",
    };
  }

  for (const value of formData.getAll("interestedIn")) {
    if (typeof value === "string" && isUserInterest(value)) {
      interestedIn.push(value);
    }
  }

  if (
    name.length < 2 ||
    name.length > ProfileConstantsCollection.FieldLimit.Name
  ) {
    return {
      ...currentState,
      message: "Name needs 2 to 50 characters",
    };
  }

  if (!isValidEmail({ email })) {
    return {
      ...currentState,
      field: SignupConstantsCollection.SignupActionField.Email,
      message: "Enter a valid email address",
    };
  }

  if (!isUserGender(gender)) {
    return {
      ...currentState,
      message: "Choose how you show up",
    };
  }

  if (!Number.isInteger(age) || age < 18 || age > 120) {
    return {
      ...currentState,
      message: "Enter an age between 18 and 120",
    };
  }

  if (!interestedIn.length) {
    return {
      ...currentState,
      message: "Pick who you want to meet",
    };
  }

  if (bio.length > ProfileConstantsCollection.FieldLimit.Bio) {
    return {
      ...currentState,
      message: `Bio must be ${String(ProfileConstantsCollection.FieldLimit.Bio)} characters or fewer`,
    };
  }

  if (jobTitle.length > ProfileConstantsCollection.FieldLimit.JobTitle) {
    return {
      ...currentState,
      message: `Job title must be ${String(ProfileConstantsCollection.FieldLimit.JobTitle)} characters or fewer`,
    };
  }

  if (city.length > ProfileConstantsCollection.FieldLimit.City) {
    return {
      ...currentState,
      message: `City must be ${String(ProfileConstantsCollection.FieldLimit.City)} characters or fewer`,
    };
  }

  const payload: SignupPayload = {
    age,
    email,
    gender,
    interestedIn,
    name,
  };

  if (bio) {
    payload.bio = bio;
  }

  if (jobTitle) {
    payload.jobTitle = jobTitle;
  }

  if (city) {
    payload.location = { city };
  }

  const lifestyle: Record<string, string> = {};
  const cinema: Record<string, string> = {};

  if (weekdayPace) {
    lifestyle.weekdayPace = weekdayPace;
  }

  if (socialBattery) {
    lifestyle.socialBattery = socialBattery;
  }

  if (movieNightStyle) {
    cinema.movieNightStyle = movieNightStyle;
  }

  if (Object.keys(lifestyle).length || Object.keys(cinema).length) {
    payload.life = {
      ...(Object.keys(cinema).length ? { cinema } : {}),
      ...(Object.keys(lifestyle).length ? { lifestyle } : {}),
    };
  }

  let signupUrl = "/api/v1/auth/signup";

  if (mode === SignupConstantsCollection.SignupMode.Password) {
    if (typeof password !== "string" || !isStrongPassword({ password })) {
      return {
        ...currentState,
        field: SignupConstantsCollection.SignupActionField.Password,
        message:
          "Password needs 8–32 characters with upper, lower, a number, and a symbol",
      };
    }

    payload.password = password;
  } else {
    const isCurrentCodeStep =
      previousState.mode === SignupConstantsCollection.SignupMode.Otp &&
      previousState.session === session &&
      previousState.email === email &&
      previousState.step === SignupConstantsCollection.OtpSignupStep.Code;

    if (!isCurrentCodeStep || resendOtp) {
      try {
        const response = await fetch("/api/v1/auth/otp/send", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
        });
        const responseMessage = await readOtpSendMessage({ response });

        if (!response.ok) {
          return {
            ...currentState,
            field: SignupConstantsCollection.SignupActionField.Email,
            message:
              response.status === 429
                ? "Too many code requests. Please wait before trying again."
                : "Unable to send a verification code",
          };
        }

        return {
          ...currentState,
          isError: false,
          message:
            responseMessage ||
            "Verification code sent. Check your email to continue.",
          step: SignupConstantsCollection.OtpSignupStep.Code,
        };
      } catch (error) {
        return {
          ...currentState,
          field: SignupConstantsCollection.SignupActionField.Email,
          message:
            error instanceof Error
              ? "Unable to reach the authentication service"
              : "Unexpected verification code failure",
        };
      }
    }

    const otp = readField({ formData, name: "otp" });

    if (!/^\d{6}$/.test(otp)) {
      return {
        ...currentState,
        field: SignupConstantsCollection.SignupActionField.Otp,
        message: "Enter the 6-digit verification code",
        step: SignupConstantsCollection.OtpSignupStep.Code,
      };
    }

    payload.otp = otp;
    signupUrl = "/api/v1/auth/otp/signup";
    currentState.step = SignupConstantsCollection.OtpSignupStep.Code;
  }

  try {
    const result = await persistSignup({ payload, url: signupUrl });

    if (result.outcome === AuthConstantsCollection.SignupOutcome.Conflict) {
      return {
        ...currentState,
        field: SignupConstantsCollection.SignupActionField.Email,
        message: `That email is already on ${BrandConstantsCollection.DisplayName}`,
      };
    }

    if (result.outcome === AuthConstantsCollection.SignupOutcome.Failure) {
      const isOtpSignup = mode === SignupConstantsCollection.SignupMode.Otp;
      const isInvalidOtpStatus =
        result.status === 400 || result.status === 401 || result.status === 422;

      return {
        ...currentState,
        field:
          isOtpSignup && isInvalidOtpStatus
            ? SignupConstantsCollection.SignupActionField.Otp
            : null,
        message:
          isOtpSignup && result.status === 429
            ? "Too many attempts. Please wait before trying again."
            : isOtpSignup && isInvalidOtpStatus
              ? "That code is invalid or expired. Check it and try again."
              : result.message,
      };
    }

    return {
      ...currentState,
      isError: false,
      message: "You're in",
      success: true,
    };
  } catch (error) {
    return {
      ...currentState,
      message:
        error instanceof Error
          ? "Unable to create your account"
          : "Unexpected signup failure",
    };
  }
};

/*
 * Learning notes
 *
 * React 19 Action
 * - One Action advances OTP send and verification or performs password signup.
 * - React passes previous state and `FormData` positionally, so this function
 *   follows React's API instead of the project's named-input rule.
 * - Whitelisted profile fields are rebuilt for the same-origin BFF request;
 *   seed-only metadata is never read from or sent by the browser.
 *
 * React 18.2 comparison
 * - React 18 typically used `onSubmit`, `preventDefault`, and separate pending
 *   and OTP-step state around `fetch`.
 */
