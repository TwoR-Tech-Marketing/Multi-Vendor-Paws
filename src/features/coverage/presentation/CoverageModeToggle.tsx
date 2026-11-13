import type { CoverageMode } from "@/features/coverage/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./coverage.module.css";

type CoverageModeToggleProps = {
  mode: CoverageMode;
  strings: AppStrings;
  onChange: (mode: CoverageMode) => void;
};

const MODES: CoverageMode[] = ["zone", "governorates"];

/** Two pressed state buttons that pick how delivery coverage is drawn. Pure. */
export function CoverageModeToggle({ mode, strings, onChange }: CoverageModeToggleProps) {
  const t = strings.coverage;
  return (
    <div className={styles.modeRow} role="group" aria-label={t.modeLabel}>
      {MODES.map((id) => (
        <button
          key={id}
          type="button"
          className={styles.modeButton}
          aria-pressed={mode === id}
          onClick={() => onChange(id)}
        >
          {id === "zone" ? t.modeZone : t.modeGovernorates}
        </button>
      ))}
    </div>
  );
}
