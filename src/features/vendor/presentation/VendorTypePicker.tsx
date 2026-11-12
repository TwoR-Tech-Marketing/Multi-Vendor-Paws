import { VENDOR_TYPES, type VendorType } from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./vendorTypePicker.module.css";

type VendorTypePickerProps = {
  strings: AppStrings;
  /** null when no known type is selected yet. */
  value: VendorType | null;
  onChange: (type: VendorType) => void;
  disabled?: boolean;
};

/** Signup and reapply account type choice (S1.7). One type per account. */
export function VendorTypePicker({ strings, value, onChange, disabled }: VendorTypePickerProps) {
  const t = strings.vendorTypes;
  return (
    <fieldset className={styles.picker} disabled={disabled}>
      <legend className={styles.legend}>{t.title}</legend>
      <p className={styles.hint}>{t.hint}</p>
      <div className={styles.options} role="radiogroup" aria-label={t.title}>
        {VENDOR_TYPES.map((type) => (
          <label
            key={type}
            className={`${styles.option} ${value === type ? styles.optionSelected : ""}`}
          >
            <input
              type="radio"
              name="vendorType"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
            />
            <span className={styles.label}>{t[type].label}</span>
            <span className={styles.description}>{t[type].description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
