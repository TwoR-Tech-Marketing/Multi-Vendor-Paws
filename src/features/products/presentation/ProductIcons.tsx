import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="M13.5 6.5l3 3" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1-3h10l1 3" />
      <path d="M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" />
    </svg>
  );
}

export function IconImageAdd(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M20 16l-5-5-8 8" />
      <path d="M16 5v4M14 7h4" />
    </svg>
  );
}

/** POS staff directory — filter funnel */
export function IconFilter(props: IconProps) {
  return (
    <svg {...base} width={24} height={24} {...props}>
      <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
    </svg>
  );
}

/** POS staff directory — export */
export function IconExport(props: IconProps) {
  return (
    <svg {...base} width={24} height={24} {...props}>
      <path d="M9 11V17L11 19V11L7 7H17L13 11V14" />
      <path d="M22 22L2 2" />
    </svg>
  );
}

/** POS staff header — add circle */
export function IconAddCircle(props: IconProps) {
  return (
    <svg {...base} width={24} height={24} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 16V8" />
    </svg>
  );
}
