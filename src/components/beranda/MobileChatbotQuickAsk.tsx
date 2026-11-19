"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

export function MobileChatbotQuickAsk() {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = question.trim();
    router.push(trimmed ? `/chatbot?q=${encodeURIComponent(trimmed)}` : "/chatbot");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <label htmlFor="mobile-home-chat-input" className="sr-only">
        Tulis pertanyaan gempa
      </label>
      <input
        id="mobile-home-chat-input"
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Tulis pertanyaan gempa..."
        className={`h-[54px] w-full rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-5 text-sm text-center text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors ${focusRing}`}
      />
      <button
        type="submit"
        className={`h-[54px] w-full rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] transition-colors ${focusRing}`}
      >
        Mulai percakapan
      </button>
    </form>
  );
}
