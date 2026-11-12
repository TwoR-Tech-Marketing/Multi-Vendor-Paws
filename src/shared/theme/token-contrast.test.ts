import { describe, expect, it } from "vitest";

import {
  TP_COLOR_VALUES,
  TP_MODES,
  TP_THEMES,
  type TpColorToken,
} from "@/shared/theme/tokens.generated";

const TEXT_MIN = 4.5;
const UI_MIN = 3;

type Pair = { fg: TpColorToken; bg: TpColorToken; min: number; kind: "text" | "ui" };

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`contrast needs an opaque six digit colour, got ${hex}`);
  const channels = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG 2.x contrast ratio, from 1 to 21. */
function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function buildPairs(): Pair[] {
  const pairs: Pair[] = [];
  const text = (fg: TpColorToken, bg: TpColorToken) => pairs.push({ fg, bg, min: TEXT_MIN, kind: "text" });
  const ui = (fg: TpColorToken, bg: TpColorToken) => pairs.push({ fg, bg, min: UI_MIN, kind: "ui" });

  for (const fg of ["textPrimary", "textSecondary", "textMuted"] as const) {
    for (const bg of ["bg", "surfaceSunken", "surfaceRaised", "surfaceOverlay"] as const) text(fg, bg);
  }
  text("link", "bg");
  text("link", "surfaceRaised");
  text("actionOnPrimary", "actionPrimary");
  text("actionOnPrimary", "actionPrimaryHover");
  text("selectedFg", "selectedBg");
  text("heroFg", "heroBg");
  text("statusDangerOn", "statusDangerFg");
  for (const s of ["Success", "Warning", "Danger", "Info", "Hold"] as const) {
    text(`status${s}Fg`, `status${s}Surface`);
    text(`status${s}Fg`, "surfaceRaised");
  }
  text("moneyIn", "surfaceRaised");
  text("moneyOut", "surfaceRaised");

  ui("focus", "bg");
  ui("focus", "surfaceRaised");
  ui("line", "bg");
  ui("line", "surfaceRaised");
  ui("borderInput", "surfaceInput");
  ui("chartCurrent", "surfaceRaised");
  ui("actionPrimary", "bg");
  return pairs;
}

const PAIRS = buildPairs();

describe("contrast helper", () => {
  it("matches WCAG reference points", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBe(21);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });
});

describe("pair list", () => {
  it("has 31 text pairs and 7 UI pairs", () => {
    expect(PAIRS.filter((p) => p.kind === "text")).toHaveLength(31);
    expect(PAIRS.filter((p) => p.kind === "ui")).toHaveLength(7);
  });
});

describe("token contrast in every theme and mode", () => {
  for (const theme of TP_THEMES) {
    for (const mode of TP_MODES) {
      it(`${theme} ${mode}: text pairs at 4.5:1 and UI pairs at 3:1`, () => {
        const colors: Partial<Record<TpColorToken, string>> = TP_COLOR_VALUES[theme][mode];
        const skipped: string[] = [];
        const failing: string[] = [];
        for (const pair of PAIRS) {
          const fg = colors[pair.fg];
          const bg = colors[pair.bg];
          const name = `${pair.fg} on ${pair.bg}`;
          if (fg === undefined || bg === undefined) {
            skipped.push(name);
            continue;
          }
          const ratio = contrastRatio(fg, bg);
          if (ratio < pair.min) failing.push(`${name} ${ratio.toFixed(2)}:1 (needs ${pair.min}:1)`);
        }
        // A pair a theme does not define would be listed here by name.
        expect(skipped).toEqual([]);
        expect(failing).toEqual([]);
      });
    }
  }
});
