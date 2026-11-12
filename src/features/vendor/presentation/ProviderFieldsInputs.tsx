import type { ProviderTextFields } from "@/features/vendor/domain/provider-profile-schema";
import { getProviderConfig } from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

type ProviderFieldsInputsProps = {
  strings: AppStrings;
  vendorType: string;
  value: ProviderTextFields;
  onChange: (value: ProviderTextFields) => void;
  fieldClassName?: string;
  disabled?: boolean;
};

/** Per-type provider inputs driven by getProviderConfig (S1.7). */
export function ProviderFieldsInputs({
  strings,
  vendorType,
  value,
  onChange,
  fieldClassName,
  disabled,
}: ProviderFieldsInputsProps) {
  const t = strings.vendorTypes.providerFields;
  const fields = getProviderConfig(vendorType).providerFields;

  function update(key: keyof ProviderTextFields, next: string) {
    onChange({ ...value, [key]: next });
  }

  return (
    <>
      {fields.includes("specialty") ? (
        <label className={fieldClassName}>
          {t.specialty} *
          <input
            required
            maxLength={80}
            value={value.specialty}
            disabled={disabled}
            onChange={(event) => update("specialty", event.target.value)}
            placeholder={t.specialtyPlaceholder}
          />
        </label>
      ) : null}
      {(["education", "experience"] as const)
        .filter((key) => fields.includes(key))
        .map((key) => (
          <label key={key} className={fieldClassName}>
            {`${t[key]} (${t.optional})`}
            <textarea
              rows={3}
              maxLength={1000}
              value={value[key]}
              disabled={disabled}
              onChange={(event) => update(key, event.target.value)}
            />
          </label>
        ))}
    </>
  );
}
