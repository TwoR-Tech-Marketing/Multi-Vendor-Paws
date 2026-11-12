import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SkeletonBox, SkeletonButton, SkeletonField, SkeletonText } from "@/components/ui/skeleton";

describe("skeleton primitives", () => {
  it.each([
    ["box", <SkeletonBox key="b" width={40} height={12} />],
    ["text", <SkeletonText key="t" />],
    ["field", <SkeletonField key="f" />],
    ["button", <SkeletonButton key="u" />],
  ])("renders a hidden shimmer %s", (_name, node) => {
    const html = renderToStaticMarkup(node);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toMatch(/class="[^"]*shimmer/);
  });
});
