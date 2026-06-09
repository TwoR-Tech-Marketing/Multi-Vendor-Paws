import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconStore(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

export function IconSmartphone(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3z" />
      <path d="M5 3v2M19 19v2M3 19h2M19 5h2" />
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M22 12h-6l-2 4H10l-2-4H2" />
      <path d="M5.5 5h13a2 2 0 0 1 1.9 1.4L22 12v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5l1.6-5.6A2 2 0 0 1 5.5 5z" />
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <path d="M16 12h5M16 12a2 2 0 1 0 0-4h3v4z" />
    </svg>
  );
}

export function IconHandshake(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M11 12l2 2 4-4" />
      <path d="M7 12l2 2" />
      <path d="M3 8l3 3M21 8l-3 3" />
      <path d="M12 3l-2 5h4l-2-5z" />
    </svg>
  );
}

export function IconPackage(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h4l3 3v2h-7v-5z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-3M12 15V8M16 15v-5" />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 15.8 7.2 17.8l.9-5.3L4.2 8.7l5.4-.8L12 3z" />
    </svg>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M6 3h12a1 1 0 0 1 1 1v16l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V4a1 1 0 0 1 1-1z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M18 16H6l-1-2v-4a7 7 0 0 1 14 0v4l-1 2z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

export function IconLifebuoy(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
    </svg>
  );
}

export function IconCoins(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <ellipse cx="9" cy="9" rx="6" ry="3" />
      <path d="M3 9v6c0 1.7 2.7 3 6 3s6-1.3 6-3V9" />
      <path d="M15 11c0 1.7 2.7 3 6 3" />
      <path d="M21 11v4c0 1.7-2.7 3-6 3" />
    </svg>
  );
}

export function IconPaw(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <ellipse cx="12" cy="16" rx="4" ry="3.5" />
      <circle cx="7" cy="11" r="2" />
      <circle cx="10" cy="8" r="2" />
      <circle cx="14" cy="8" r="2" />
      <circle cx="17" cy="11" r="2" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}
