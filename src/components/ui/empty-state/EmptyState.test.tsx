import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { getStrings } from "@/shared/i18n/get-strings";

describe("EmptyState", () => {
  it("renders the theme art, one title and one line", () => {
    const html = renderToStaticMarkup(<EmptyState title="No orders" description="Orders show here." />);
    expect(html).toContain('data-testid="empty-state-art"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<h3");
    expect(html).toContain("No orders</h3>");
    expect(html).toContain("Orders show here.</p>");
    expect(html).not.toContain('role="status"');
  });

  it("renders an action, a heading level and a polite live region when asked", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Nothing new" headingLevel={2} live action={<button type="button">Go</button>} />,
    );
    expect(html).toContain("<h2");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("<button");
  });

  it("uses custom art instead of the default when given", () => {
    const html = renderToStaticMarkup(<EmptyState title="Empty" art={<span data-x="art" />} />);
    expect(html).toContain('data-x="art"');
    expect(html).not.toContain("empty-state-art");
  });

  it("renders Arabic copy", () => {
    const ar = getStrings("ar");
    const html = renderToStaticMarkup(
      <EmptyState title={ar.orders.emptyTitle} description={ar.orders.emptyDescription} />,
    );
    expect(html).toContain(ar.orders.emptyTitle);
    expect(html).toContain(ar.orders.emptyDescription);
  });
});
