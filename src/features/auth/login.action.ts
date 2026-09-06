"use client";

import { AuthConstantsCollection } from "@/features/auth/auth.constants";

type OtpLoginStep =
  (typeof AuthConstantsCollection.OtpLoginStep)[keyof typeof AuthConstantsCollection.OtpLoginStep];

interface ReadFieldInput {
  formData: FormData;
  name: string;
}

interface ReadResponseMessageInput {
  response: Response;
}

interface IsValidEmailInput {
  email: string;
}

export interface LoginActionState {
  message: string;
  success: boolean;
}

export interface OtpLoginActionState {
  email: string;
  isError: boolean;
  message: string;
  step: OtpLoginStep;
  success: boolean;
}

export const initialLoginActionState: LoginActionState = {
  message: "",
  success: false,
};

const AUTH_REQUEST_TIMEOUT_MS = 10_000;

const readField = ({ formData, name }: ReadFieldInput): string => {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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

const isValidEmail = ({ email }: IsValidEmailInput): boolean => {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(email);
};

export const loginAction = async (
  previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return {
      ...previousState,
      message: "Email and password are required",
      success: false,
    };
  }

  try {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        ...previousState,
        message:
          response.status === 401
            ? "Invalid email or password"
            : "Unable to log in",
        success: false,
      };
    }

    return {
      message: "Login successful",
      success: true,
    };
  } catch (error) {
    return {
      ...previousState,
      message:
        error instanceof Error
          ? "Unable to reach the authentication service"
          : "Unexpected login failure",
      success: false,
    };
  }
};

export const otpLoginAction = async (
  previousState: OtpLoginActionState,
  formData: FormData,
): Promise<OtpLoginActionState> => {
  const submittedEmail = readField({ formData, name: "email" });

  if (!isValidEmail({ email: submittedEmail })) {
    return {
      email: submittedEmail,
      isError: true,
      message: "Enter a valid email address",
      step: AuthConstantsCollection.OtpLoginStep.Email,
      success: false,
    };
  }

  const email = submittedEmail;

  if (previousState.step === AuthConstantsCollection.OtpLoginStep.Email) {
    try {
      const response = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          purpose: AuthConstantsCollection.OtpPurpose.Login,
        }),
        signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
      });
      const responseMessage = await readOtpSendMessage({ response });

      if (!response.ok) {
        return {
          email,
          isError: true,
          message:
            response.status === 429
              ? "Too many code requests. Please wait before trying again."
              : "Unable to send a verification code",
          step: AuthConstantsCollection.OtpLoginStep.Email,
          success: false,
        };
      }

      return {
        email,
        isError: false,
        message: responseMessage || "Verification code sent. Check your email.",
        step: AuthConstantsCollection.OtpLoginStep.Code,
        success: false,
      };
    } catch (error) {
      return {
        email,
        isError: true,
        message:
          error instanceof Error
            ? "Unable to reach the authentication service"
            : "Unexpected verification code failure",
        step: AuthConstantsCollection.OtpLoginStep.Email,
        success: false,
      };
    }
  }

  const otp = readField({ formData, name: "otp" });

  if (!/^\d{6}$/.test(otp)) {
    return {
      email,
      isError: true,
      message: "Enter the 6-digit verification code",
      step: AuthConstantsCollection.OtpLoginStep.Code,
      success: false,
    };
  }

  try {
    const response = await fetch("/api/v1/auth/otp/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        otp,
      }),
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        email,
        isError: true,
        message:
          response.status === 429
            ? "Too many attempts. Please wait before trying again."
            : "That code is invalid or expired. Check it and try again.",
        step: AuthConstantsCollection.OtpLoginStep.Code,
        success: false,
      };
    }

    return {
      email,
      isError: false,
      message: "Login successful",
      step: AuthConstantsCollection.OtpLoginStep.Code,
      success: true,
    };
  } catch (error) {
    return {
      email,
      isError: true,
      message:
        error instanceof Error
          ? "Unable to reach the authentication service"
          : "Unexpected login failure",
      step: AuthConstantsCollection.OtpLoginStep.Code,
      success: false,
    };
  }
};

/*
 * Learning notes
 *
 * React 19 Action
 * - Password and OTP mutations are async functions submitted by forms through
 *   `useActionState`.
 * - React supplies `previousState` and `FormData` as positional parameters, so
 *   these functions follow React's API instead of the project's named-input rule.
 * - Same-origin browser requests let Express set the HTTP-only login cookie
 *   without exposing its value to JavaScript.
 *
 * React 18.2 comparison
 * - React 18 commonly used `onSubmit`, `preventDefault`, and separate state for
 *   pending, success, and error handling.
 * - React 19 lets the form and Action participate in one submission lifecycle.
 */
