import { describe, it, expect } from "vitest";
import { renderSafeMarkdown } from "../src/lib/markdown";

describe("Safe Markdown Renderer", () => {
  it("harus melakukan escape pada tag HTML mentah berbahaya baik blok maupun inline", async () => {
    const rawInput =
      "Halo <script>alert('xss')</script> dunia <img src=x onerror=alert(1)> dan <b>teks</b>";
    const html = await renderSafeMarkdown(rawInput);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });

  it("harus menetralkan tautan dengan skema berbahaya seperti javascript: dan data:", async () => {
    const xssMarkdown =
      "Uji [skrip](javascript:alert(1)) dan [data](data:text/html,<script>1</script>) dan [lokal](/edukasi).";
    const html = await renderSafeMarkdown(xssMarkdown);

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain('href="#"');
    expect(html).toContain('href="/edukasi"');
  });

  it("harus menyematkan target='_blank' dan rel='noopener noreferrer' pada tautan eksternal", async () => {
    const inputWithLink = "Rujuk ke [Situs BMKG](https://www.bmkg.go.id/gempabumi) untuk data resmi.";
    const html = await renderSafeMarkdown(inputWithLink);

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="https://www.bmkg.go.id/gempabumi"');
  });

  it("harus merender heading h2, list, dan paragraf dengan benar", async () => {
    const input = "## Informasi Resmi\n\nData dari BMKG.\n\n- Poin pertama\n- Poin kedua";
    const html = await renderSafeMarkdown(input);

    expect(html).toContain("<h2");
    expect(html).toContain("Informasi Resmi</h2>");
    expect(html).toContain("<p");
    expect(html).toContain("Data dari BMKG.</p>");
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
  });
});
