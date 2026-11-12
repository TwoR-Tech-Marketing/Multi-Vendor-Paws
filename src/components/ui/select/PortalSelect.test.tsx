import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PortalSelect } from "@/components/ui/select/PortalSelect";

const options = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

describe("PortalSelect", () => {
  it("renders a closed listbox trigger with the selected label", () => {
    const html = renderToStaticMarkup(
      <PortalSelect id="lang" value="ar" options={options} onChange={() => undefined} ariaLabel="Language" />,
    );
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="lang-listbox"');
    expect(html).toContain('aria-label="Language"');
    expect(html).toContain(">العربية</button>");
    expect(html).not.toContain('role="listbox"');
  });
});
