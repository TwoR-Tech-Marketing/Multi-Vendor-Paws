import { FirebaseError } from "firebase/app";

export function mapAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/user-disabled":
        return "Your account is pending admin approval. You can sign in once approved.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "functions/already-exists":
        return "An account or pending request already exists for this email.";
      case "functions/invalid-argument":
        return error.message || "Please check your information and try again.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
