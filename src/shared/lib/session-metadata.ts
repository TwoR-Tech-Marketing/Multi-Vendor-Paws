import type { PortalUserDto } from "@/features/auth/domain/session-dto";

export type VendorSessionMetadata = {
  deviceLabel: string;
  signedInLabel: string;
  lastLoginLabel: string;
  accountCreatedLabel: string;
  locationLabel: string;
};

export function formatSessionTimestamp(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) return `Today at ${time}`;

  const dateLabel = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  return `${dateLabel} at ${time}`;
}

export function parseDeviceFromUserAgent(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) return "—";

  const isEdg = /Edg\//i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !isEdg;
  const chromeMatch = ua.match(/Chrome\/(\d+)\./i);
  const isSafari = /Safari\//i.test(ua) && !isChrome && !isEdg;
  const safariMatch = ua.match(/Version\/(\d+)/i);
  const isFirefox = /Firefox\//i.test(ua);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/i);

  const isMac = /Mac OS X/i.test(ua);
  const isWin = /Windows/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !/Android/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);

  const os = isIos
    ? "iOS"
    : isAndroid
      ? "Android"
      : isMac
        ? "macOS"
        : isWin
          ? "Windows"
          : isLinux
            ? "Linux"
            : "Unknown OS";

  if (isChrome && chromeMatch?.[1]) return `Chrome ${chromeMatch[1]} · ${os}`;
  if (isEdg && ua.match(/Edg\/(\d+)/i)?.[1]) {
    return `Edge ${ua.match(/Edg\/(\d+)/i)?.[1]} · ${os}`;
  }
  if (isSafari && safariMatch?.[1]) return `Safari ${safariMatch[1]} · ${os}`;
  if (isFirefox && firefoxMatch?.[1]) return `Firefox ${firefoxMatch[1]} · ${os}`;

  return os;
}

function resolveLocationLabel(): string {
  if (typeof window === "undefined") return "—";

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language;
    if (timezone && locale) return `${timezone} (${locale})`;
    if (timezone) return timezone;
  } catch {
    /* ignore */
  }

  return "—";
}

export function getVendorSessionMetadata(user: PortalUserDto): VendorSessionMetadata {
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : "";

  return {
    deviceLabel: parseDeviceFromUserAgent(userAgent),
    signedInLabel: formatSessionTimestamp(user.metadata.lastSignInTime),
    lastLoginLabel: formatSessionTimestamp(user.metadata.lastSignInTime),
    accountCreatedLabel: formatSessionTimestamp(user.metadata.creationTime),
    locationLabel: resolveLocationLabel(),
  };
}
