import { marked, type Tokens } from "marked";

function escapeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Buat ID anchor aman dari teks heading untuk navigasi daftar isi.
 */
export function slugifyHeading(rawText: string): string {
  const cleaned = rawText
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return cleaned || "bagian";
}

export interface MarkdownHeadingItem {
  id: string;
  text: string;
  depth: number;
}

/**
 * Ekstrak daftar sub-bagian (H2/H3) dari isi markdown untuk daftar isi artikel.
 */
export function extractMarkdownHeadings(content: string): MarkdownHeadingItem[] {
  if (!content) return [];
  const tokens = marked.lexer(content);
  const items: MarkdownHeadingItem[] = [];

  for (const token of tokens) {
    if (token.type === "heading" && (token.depth === 2 || token.depth === 3)) {
      const plainText = token.text.replace(/[*_`~]/g, "").trim();
      if (plainText) {
        items.push({
          id: slugifyHeading(plainText),
          text: plainText,
          depth: token.depth,
        });
      }
    }
  }

  return items;
}

/**
 * Batasi href ke protokol web aman (http/https) atau path/anchor internal
 * untuk mencegah injeksi skema javascript:/data:.
 */
function sanitizeHref(href: string | null | undefined): string {
  const trimmed = (href || "").trim();
  if (/^(https?:\/\/|\/(?!\/)|#)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return "#";
}

/**
 * Render Markdown aman ke string HTML terstruktur dengan identitas editorial SIGAP.
 */
export async function renderSafeMarkdown(content: string): Promise<string> {
  if (!content) return "";

  let h2Index = 0;
  const renderer = new marked.Renderer();

  // Escape raw HTML tanpa membungkus <p> agar HTML inline tidak merusak struktur blok.
  renderer.html = function ({ text }: Tokens.HTML | Tokens.Tag) {
    return escapeHtml(text);
  };

  // Tolak render <img> bebas di markdown artikel (konten teks resmi tanpa gambar dekoratif).
  renderer.image = function ({ text }: Tokens.Image) {
    const alt = escapeHtml(text || "");
    return alt ? `<span>${alt}</span>` : "";
  };

  renderer.link = function ({ href, title, tokens }: Tokens.Link) {
    const safeHref = sanitizeHref(href);
    const isExternal = /^https?:\/\//i.test(safeHref);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    const label = this.parser.parseInline(tokens);

    return `<a href="${safeHref}"${titleAttr}${externalAttrs} class="text-[var(--color-text-primary)] font-medium underline decoration-[var(--color-primary)] decoration-2 underline-offset-4 hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)] rounded-xs">${label}</a>`;
  };

  renderer.heading = function ({ tokens, depth, text: rawText }: Tokens.Heading) {
    const text = this.parser.parseInline(tokens);
    const id = slugifyHeading(rawText);

    if (depth <= 2) {
      h2Index += 1;
      const num = String(h2Index).padStart(2, "0");
      return `<h2 id="${id}" class="scroll-mt-24 max-w-[58ch] [text-wrap:balance] text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-text-primary)] mt-10 mb-4 pt-6 border-t border-[var(--color-border)] flex items-baseline gap-3"><span class="text-xs sm:text-sm font-semibold tabular-nums text-[var(--color-primary-strong)] shrink-0">${num}.</span><span>${text}</span></h2>`;
    }
    if (depth === 3) {
      return `<h3 id="${id}" class="scroll-mt-24 max-w-[58ch] [text-wrap:balance] text-lg sm:text-xl font-medium tracking-tight text-[var(--color-text-primary)] mt-7 mb-3">${text}</h3>`;
    }
    return `<h4 id="${id}" class="scroll-mt-24 max-w-[58ch] [text-wrap:balance] text-base sm:text-lg font-medium text-[var(--color-text-primary)] mt-5 mb-2">${text}</h4>`;
  };

  renderer.paragraph = function ({ tokens }: Tokens.Paragraph) {
    const text = this.parser.parseInline(tokens);
    return `<p class="max-w-[58ch] [text-wrap:pretty] text-[var(--color-text-primary)] text-base sm:text-lg leading-[1.75] mb-5">${text}</p>`;
  };

  renderer.list = function (token: Tokens.List) {
    const tag = token.ordered ? "ol" : "ul";
    const listClass = token.ordered
      ? "max-w-[58ch] list-decimal pl-6 mb-6 space-y-3 text-[var(--color-text-primary)] text-base sm:text-lg leading-[1.7]"
      : "max-w-[58ch] list-none pl-0 mb-6 space-y-3 text-[var(--color-text-primary)] text-base sm:text-lg leading-[1.7]";

    let body = "";
    for (const item of token.items) {
      if (token.ordered) {
        const inner = this.parser.parse(item.tokens);
        body += `<li class="pl-1 [&>p]:mb-1.5 [&>p:last-child]:mb-0">${inner}</li>`;
      } else {
        const inner = this.parser.parse(item.tokens);
        body += `<li class="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-[0.68em] before:w-2 before:h-2 before:rounded-full before:bg-[var(--color-primary-strong)] [&>p]:mb-1.5 [&>p:last-child]:mb-0">${inner}</li>`;
      }
    }
    return `<${tag} class="${listClass}">${body}</${tag}>`;
  };

  renderer.blockquote = function ({ tokens }: Tokens.Blockquote) {
    const body = this.parser.parse(tokens);
    return `<blockquote class="max-w-[58ch] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-4 my-6 text-[var(--color-text-primary)] [&>p]:mb-2 [&>p:last-child]:mb-0">${body}</blockquote>`;
  };

  return marked.parse(content, {
    renderer,
    gfm: true,
    breaks: false,
    async: true,
  });
}
