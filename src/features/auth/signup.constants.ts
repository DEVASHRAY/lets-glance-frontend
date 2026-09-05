enum SignupMode {
  Otp = "otp",
  Password = "password",
}

enum OtpSignupStep {
  Code = "code",
  Email = "email",
}

enum SignupActionField {
  Email = "email",
  Otp = "otp",
  Password = "password",
}

export const SignupConstantsCollection = {
  OtpSignupStep,
  SignupActionField,
  SignupMode,
};
