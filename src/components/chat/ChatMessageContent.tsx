"use client";

import React from "react";

interface ChatMessageContentProps {
  content: string;
}

type Block =
  | { type: "paragraph"; text: string }
  | { type: "steps"; items: { number: string; text: string }[] }
  | { type: "bullets"; items: string[] };

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[var(--color-text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let paragraphBuf: string[] = [];
  let stepBuf: { number: string; text: string }[] = [];
  let bulletBuf: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuf.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphBuf.join("\n").trim() });
      paragraphBuf = [];
    }
  };

  const flushSteps = () => {
    if (stepBuf.length > 0) {
      blocks.push({ type: "steps", items: stepBuf });
      stepBuf = [];
    }
  };

  const flushBullets = () => {
    if (bulletBuf.length > 0) {
      blocks.push({ type: "bullets", items: bulletBuf });
      bulletBuf = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushSteps();
      flushBullets();
      continue;
    }

    const stepMatch = trimmed.match(/^(\d{1,2})[.)]\s+(.+)$/);
    if (stepMatch) {
      flushParagraph();
      flushBullets();
      stepBuf.push({
        number: stepMatch[1]!.padStart(2, "0"),
        text: stepMatch[2]!.trim(),
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^(?:[-*•])\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      flushSteps();
      bulletBuf.push(bulletMatch[1]!.trim());
      continue;
    }

    // Jika baris baru melanjutkan teks langkah bernomor terakhir, gabungkan saja.
    if (stepBuf.length > 0 && /^\s{2,}/.test(line)) {
      const last = stepBuf[stepBuf.length - 1]!;
      last.text = `${last.text} ${trimmed}`;
      continue;
    }

    flushSteps();
    flushBullets();
    paragraphBuf.push(trimmed);
  }

  flushParagraph();
  flushSteps();
  flushBullets();

  return blocks;
}

export function ChatMessageContent({ content }: ChatMessageContentProps) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return <p className="text-sm sm:text-base leading-relaxed">{content}</p>;
  }

  return (
    <div className="space-y-3 text-sm sm:text-base leading-relaxed text-[var(--color-text-primary)]">
      {blocks.map((block, idx) => {
        if (block.type === "steps") {
          return (
            <ol key={idx} className="space-y-2">
              {block.items.map((step, sIdx) => (
                <li
                  key={`${step.number}-${sIdx}`}
                  className="flex items-start gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-cta)] text-[11px] font-semibold text-[var(--color-on-cta)] tnum"
                  >
                    {step.number}
                  </span>
                  <div className="min-w-0 flex-1 [text-wrap:pretty]">
                    {renderInlineBold(step.text)}
                  </div>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "bullets") {
          return (
            <ul key={idx} className="list-disc space-y-1.5 pl-5 [text-wrap:pretty]">
              {block.items.map((item, bIdx) => (
                <li key={bIdx}>{renderInlineBold(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line break-words [text-wrap:pretty]">
            {renderInlineBold(block.text)}
          </p>
        );
      })}
    </div>
  );
}
