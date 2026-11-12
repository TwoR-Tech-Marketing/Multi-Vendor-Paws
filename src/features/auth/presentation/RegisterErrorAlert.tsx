"use client";

import {
  resolveRegisterError,
  type RegisterError,
} from "@/features/auth/domain/register-errors";
import { useStrings } from "@/shared/preferences/PreferencesContext";
import styles from "./auth.module.css";

type RegisterErrorAlertProps = {
  error: RegisterError | null;
};

export function RegisterErrorAlert({ error }: RegisterErrorAlertProps) {
  const strings = useStrings();
  if (!error) return null;
  return (
    <div className={`${styles.alert} ${styles.alertError}`} role="alert">
      {resolveRegisterError(error, strings)}
    </div>
  );
}
