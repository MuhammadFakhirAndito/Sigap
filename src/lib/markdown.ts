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

  return `<a href="${safeHref}"${titleAttr}${externalAttrs} class="text-[var(--color-text-primary)] font-medium underline decoration-[var(--color-primary)] decoration-2 underline-offset-4 hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] rounded-xs">${label}</a>`;
};

renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
  const text = this.parser.parseInline(tokens);
  if (depth <= 2) {
    return `<h2 class="max-w-[58ch] [text-wrap:balance] text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-text-primary)] mt-10 mb-3 pt-4 border-t border-[var(--color-border)]">${text}</h2>`;
  }
  if (depth === 3) {
    return `<h3 class="max-w-[58ch] [text-wrap:balance] text-lg sm:text-xl font-normal tracking-tight text-[var(--color-text-primary)] mt-7 mb-2.5">${text}</h3>`;
  }
  return `<h4 class="max-w-[58ch] [text-wrap:balance] text-base sm:text-lg font-medium text-[var(--color-text-primary)] mt-5 mb-2">${text}</h4>`;
};

renderer.paragraph = function ({ tokens }: Tokens.Paragraph) {
  const text = this.parser.parseInline(tokens);
  return `<p class="max-w-[58ch] [text-wrap:pretty] text-[var(--color-text-primary)] text-base sm:text-lg leading-[1.75] mb-5">${text}</p>`;
};

renderer.list = function (token: Tokens.List) {
  const tag = token.ordered ? "ol" : "ul";
  const listClass = token.ordered
    ? "max-w-[58ch] list-decimal pl-6 mb-6 space-y-2 text-[var(--color-text-primary)] text-base sm:text-lg leading-[1.75]"
    : "max-w-[58ch] list-disc pl-6 mb-6 space-y-2 text-[var(--color-text-primary)] text-base sm:text-lg leading-[1.75]";

  let body = "";
  for (const item of token.items) {
    body += this.listitem(item);
  }
  return `<${tag} class="${listClass}">${body}</${tag}>`;
};

renderer.listitem = function (item: Tokens.ListItem) {
  const inner = this.parser.parse(item.tokens);
  return `<li class="pl-1 [&>p]:mb-2 [&>p:last-child]:mb-0">${inner}</li>`;
};

renderer.blockquote = function ({ tokens }: Tokens.Blockquote) {
  const body = this.parser.parse(tokens);
  return `<blockquote class="max-w-[58ch] border-l border-[var(--color-text-secondary)]/40 pl-4 py-1 my-6 text-[var(--color-text-primary)] [&>p]:mb-2 [&>p:last-child]:mb-0">${body}</blockquote>`;
};

/**
 * Render Markdown aman ke string HTML terstruktur untuk konten edukasi.
 */
export async function renderSafeMarkdown(content: string): Promise<string> {
  if (!content) return "";

  return marked.parse(content, {
    renderer,
    gfm: true,
    breaks: false,
    async: true,
  });
}
