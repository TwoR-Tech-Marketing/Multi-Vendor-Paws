import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatTime } from "@/shared/lib/format-date";

// 13 Nov 2026 22:30 UTC is 14 Nov 2026 00:30 in Cairo (UTC+2 in winter).
const LATE = new Date("2026-11-13T22:30:00.000Z");

describe("portal date formatting", () => {
  it("shows the Cairo calendar date, not the machine one", () => {
    expect(formatDate(LATE, "en")).toContain("14");
    expect(formatDate(LATE, "en")).toContain("2026");
  });

  it("keeps Western digits in Arabic", () => {
    const texts = [formatDate(LATE, "ar"), formatTime(LATE, "ar"), formatDateTime(LATE, "ar")];
    for (const text of texts) {
      expect(text).not.toMatch(/[٠-٩]/);
      expect(text).toMatch(/[0-9]/);
    }
  });

  it("shows the Cairo time of day", () => {
    expect(formatTime(LATE, "en")).toMatch(/12:30/);
  });
});
