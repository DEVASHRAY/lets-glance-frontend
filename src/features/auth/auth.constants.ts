enum SignupOutcome {
  Conflict = "conflict",
  Failure = "failure",
  Success = "success",
}

enum LoginMode {
  Otp = "otp",
  Password = "password",
}

enum OtpLoginStep {
  Code = "code",
  Email = "email",
}

enum OtpPurpose {
  Login = "login",
  Signup = "signup",
}

enum OtpSendMessage {
  AlreadySent = "A valid verification code was already sent. Please use that code",
  Sent = "Verification code sent successfully",
}

export const AuthConstantsCollection = {
  LoginMode,
  OtpLoginStep,
  OtpPurpose,
  OtpSendMessage,
  SignupOutcome,
};
