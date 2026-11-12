import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const presentationDir = path.resolve(__dirname);
const css = readFileSync(path.join(presentationDir, "notifications.module.css"), "utf8");

/** Every `styles.<name>` used by the inbox components that share this module. */
function classNamesUsedIn(file: string): string[] {
  const source = readFileSync(path.join(presentationDir, file), "utf8");
  return [...new Set([...source.matchAll(/\bstyles\.(\w+)/g)].map((m) => m[1]))];
}

describe("notifications.module.css", () => {
  it("is not empty", () => {
    expect(css.trim().length).toBeGreaterThan(0);
  });

  it.each(["NotificationsView.tsx", "NotificationItem.tsx", "NotificationsSkeleton.tsx"])(
    "defines every class used by %s",
    (file) => {
      const used = classNamesUsedIn(file);
      expect(used.length).toBeGreaterThan(0);
      const missing = used.filter((name) => !new RegExp(`\\.${name}\\b`).test(css));
      expect(missing).toEqual([]);
    },
  );
});
