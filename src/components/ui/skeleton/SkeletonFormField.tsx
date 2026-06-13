import { SkeletonField } from "./SkeletonField";
import { SkeletonText } from "./SkeletonText";
import styles from "./skeleton.module.css";

type SkeletonFormFieldProps = {
  labelWidth?: number | string;
  className?: string;
};

export function SkeletonFormField({
  labelWidth = "36%",
  className,
}: SkeletonFormFieldProps) {
  const rootClassName = [styles.formField, className].filter(Boolean).join(" ");

  return (
    <div className={rootClassName}>
      <SkeletonText size="sm" width={labelWidth} />
      <SkeletonField />
    </div>
  );
}
