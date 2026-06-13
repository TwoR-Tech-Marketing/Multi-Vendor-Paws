import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3.2 7.4-7 9-3.8-1.6-7-4.5-7-9V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

export function IconStore(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10h16" />
      <path d="M5 10l1.5-5h11L19 10" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

export function IconProducts(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h13v13H8z" />
      <path d="M3 6h3v13H3z" />
      <path d="M8 6V4h9v2" />
    </svg>
  );
}

export function IconOrders(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4h10l2 4H5l2-4z" />
      <path d="M6 8v11h12V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function IconEarnings(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconStorefront(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10h16" />
      <path d="M6 10V7l2-3h8l2 3v3" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3z" />
      <path d="M18 14l.8 2.8L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
    </svg>
  );
}
