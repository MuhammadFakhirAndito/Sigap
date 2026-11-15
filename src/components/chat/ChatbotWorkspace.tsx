'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpen,
  Check,
  RefreshCw,
  Send,
  ThumbsDown,
  ArrowUpRight,
  Info,
  ThumbsUp,
} from 'lucide-react';
import { QuakeContextCard, QuakeContextStrip } from './QuakeContextCard';

export interface ChatUiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestampWib: string;
  source?: 'LLM' | 'FALLBACK';
  model?: string | null;
  chatLogId?: string | null;
  quotaExhausted?: boolean;
  feedbackGiven?: 'up' | 'down' | null;
  feedbackPending?: boolean;
  feedbackError?: string | null;
}

export interface ChatUiErrorState {
  message: string;
  retryText: string;
  isRateLimit?: boolean;
  retryAfterSec?: number;
}

export interface ChatbotWorkspaceProps {
  initialPrefill?: string;
  contextBannerText?: string;
  suggestedPrompts: string[];
  latestQuakeSummary?: {
    waktuWib: string;
    magnitudo: number;
    kedalamanKm: number;
    wilayah: string;
    koordinat: string;
    potensiTeks: string;
  } | null;
  initialMessages?: ChatUiMessage[];
  initialError?: ChatUiErrorState | null;
  initialQuotaNotice?: boolean;
}

const MAX_CHARS = 500;
const CHAR_COUNTER_THRESHOLD = 380;

function getCurrentWibTime(): string {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${formatter.format(new Date()).replace(/\./g, ':')} WIB`;
  } catch {
    return 'WIB';
  }
}

export function ChatbotWorkspace({
  initialPrefill = '',
  contextBannerText,
  suggestedPrompts,
  latestQuakeSummary,
  initialMessages = [],
  initialError = null,
  initialQuotaNotice = false,
}: ChatbotWorkspaceProps) {
  const [messages, setMessages] = useState<ChatUiMessage[]>(initialMessages);
  const [inputText, setInputText] = useState<string>(initialPrefill);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<ChatUiErrorState | null>(initialError);
  const [quotaExhaustedBanner, setQuotaExhaustedBanner] = useState<boolean>(
    initialQuotaNotice
  );
  const [keyboardOffsetPx, setKeyboardOffsetPx] = useState<number>(0);

  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Jaga agar kotak input tidak tertutup keyboard layar pada perangkat mobile (visualViewport).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }
    const vv = window.visualViewport;
    const handleViewportChange = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffsetPx(Math.round(offset));
    };
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Gulir ke pesan terbaru saat daftar pesan bertambah atau status loading berubah.
  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, isLoading, errorState]);

  async function sendMessage(rawText: string) {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    if (trimmed.length > MAX_CHARS) {
      setErrorState({
        message: `Pesan terlalu panjang (${trimmed.length}/${MAX_CHARS} karakter). Mohon ringkas pertanyaan Anda.`,
        retryText: trimmed.slice(0, MAX_CHARS),
      });
      return;
    }

    const userMsg: ChatUiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestampWib: getCurrentWibTime(),
    };

    const priorHistory = messages.slice(-6).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setErrorState(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: priorHistory,
          pageContextNote: contextBannerText,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        source?: 'LLM' | 'FALLBACK';
        model?: string | null;
        chatLogId?: string | null;
        quotaExhausted?: boolean;
        error?: string;
        retryAfterSec?: number;
      };

      if (!res.ok) {
        setErrorState({
          message:
            data.error ??
            (res.status === 429
              ? 'Terlalu banyak pesan. Silakan tunggu beberapa detik sebelum mencoba kembali.'
              : 'Layanan asisten sedang mengalami gangguan koneksi. Silakan coba lagi.'),
          retryText: trimmed,
          isRateLimit: res.status === 429,
          retryAfterSec: data.retryAfterSec,
        });
        setIsLoading(false);
        textareaRef.current?.focus();
        return;
      }

      if (data.quotaExhausted) {
        setQuotaExhaustedBanner(true);
      }

      const assistantMsg: ChatUiMessage = {
        id: data.chatLogId ?? `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply ?? 'Maaf, jawaban tidak tersedia saat ini.',
        timestampWib: getCurrentWibTime(),
        source: data.source ?? 'FALLBACK',
        model: data.model ?? null,
        chatLogId: data.chatLogId ?? null,
        quotaExhausted: Boolean(data.quotaExhausted),
        feedbackGiven: null,
        feedbackPending: false,
        feedbackError: null,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setErrorState({
        message:
          'Gagal terhubung ke server SIGAP. Periksa koneksi internet Anda lalu tekan tombol Coba lagi.',
        retryText: trimmed,
      });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendMessage(inputText);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputText);
    }
  }

  function handlePromptChipClick(promptText: string) {
    void sendMessage(promptText);
  }

  function handleRetry(retryText: string) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'user' && lastMsg.content === retryText) {
      setMessages((prev) => prev.slice(0, -1));
    }
    void sendMessage(retryText);
  }

  async function handleFeedback(msgId: string, chatLogId: string, isHelpful: boolean) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, feedbackPending: true, feedbackError: null }
          : m
      )
    );

    try {
      const res = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatLogId, isHelpful }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  feedbackPending: false,
                  feedbackError: body.error ?? 'Gagal menyimpan penilaian.',
                }
              : m
          )
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                feedbackPending: false,
                feedbackGiven: isHelpful ? 'up' : 'down',
                feedbackError: null,
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                feedbackPending: false,
                feedbackError: 'Gagal mengirim penilaian karena gangguan jaringan.',
              }
            : m
        )
      );
    }
  }

  // Tinggi textarea mengikuti isi sampai batas 160px agar composer tetap ringkas.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputText]);

  const remainingChars = MAX_CHARS - inputText.length;
  const showCharCounter = inputText.length >= CHAR_COUNTER_THRESHOLD;
  const isEmpty = messages.length === 0 && !isLoading && !errorState;

  return (
    <div className="mx-auto grid w-full max-w-[1140px] flex-1 grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-[310px_minmax(0,1fr)]">
      {/* Kolom kiri: judul, konteks BMKG, catatan */}
      <aside className="px-1 pb-2 pt-1 sm:px-0 lg:sticky lg:top-6 lg:self-start lg:pb-0 lg:pt-2">
        <h1 className="text-3xl font-light leading-[1.1] tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-4xl [text-wrap:balance]">
          Tanya jawab gempa dan mitigasi
        </h1>
        <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
          Jawaban memakai data gempa terbaru BMKG dan FAQ resmi BMKG serta BNPB.
        </p>

        <div className="mt-6 hidden lg:block">
          <QuakeContextCard quake={latestQuakeSummary} />
          <div className="mt-5 space-y-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              Chatbot ini bukan peringatan dini resmi. Untuk keadaan darurat, rujuk BMKG
              (Contact Center 196) dan BNPB.
            </p>
            <p>Jangan menulis data pribadi. Percakapan disimpan 30 hari untuk evaluasi.</p>
          </div>
        </div>
      </aside>

      {/* Panel percakapan */}
      <section
        aria-label="Panel percakapan asisten mitigasi gempa"
        style={keyboardOffsetPx > 0 ? { paddingBottom: `${keyboardOffsetPx}px` } : undefined}
        className="flex min-h-[calc(100dvh-160px)] w-full max-w-[780px] flex-col overflow-hidden rounded-[24px] sm:rounded-[var(--radius-2xl)] bg-[var(--color-background)] sm:min-h-[620px] lg:h-[calc(100dvh-160px)] lg:min-h-[580px] lg:max-h-[860px]"
      >
        {/* Konteks gempa ringkas untuk layar kecil */}
        <div className="border-b border-[var(--color-border)] lg:hidden">
          <QuakeContextStrip quake={latestQuakeSummary} />
        </div>

        {quotaExhaustedBanner && (
          <div
            role="status"
            className="mx-4 mt-4 flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-warning-strong)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-primary)] sm:mx-6"
          >
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning-strong)]" aria-hidden="true" />
            <p>
              <span className="font-medium text-[var(--color-warning-strong)]">
                Model utama sedang dibatasi, dijawab dari FAQ.
              </span>{' '}
              Anda tetap bisa bertanya seperti biasa.
            </p>
          </div>
        )}

        {contextBannerText && (
          <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-primary)] sm:mx-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
            <p>
              <span className="font-medium">{contextBannerText}.</span> Pertanyaan sudah diisi di
              bawah dan bisa Anda sunting sebelum dikirim.
            </p>
          </div>
        )}

        {/* Daftar pesan */}
        <div
          ref={logContainerRef}
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Riwayat pesan percakapan"
          className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-8"
        >
          {isEmpty && (
            <div className="flex min-h-full flex-col justify-center gap-6 py-4">
              <div className="space-y-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-surface-raised)]">
                  <img src="/logo/symbol.svg" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
                </span>
                <h2 className="text-2xl font-light leading-tight tracking-[-0.01em] text-[var(--color-text-primary)] [text-wrap:balance]">
                  Apa yang ingin Anda ketahui tentang gempa?
                </h2>
                <p className="max-w-[52ch] text-sm leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
                  Tanyakan gempa terbaru dari BMKG, arti skala MMI, cara berlindung saat guncangan,
                  atau isi tas siaga. Pilih contoh di bawah atau tulis pertanyaan sendiri.
                </p>
              </div>

              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
                {suggestedPrompts.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => handlePromptChipClick(promptText)}
                    className="group flex min-h-[64px] w-[240px] shrink-0 items-start justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-raised)] px-4 py-3.5 text-left text-sm font-medium leading-snug text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background)] sm:w-auto"
                  >
                    <span>{promptText}</span>
                    <ArrowUpRight
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-primary-strong)]"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex flex-col items-end">
                  <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-md bg-[var(--color-cta)] px-4 py-3 text-sm sm:text-base leading-relaxed text-[var(--color-on-cta)] sm:max-w-[75%]">
                    {msg.content}
                  </div>
                  <span className="mt-1.5 text-xs text-[var(--color-text-secondary)] tnum">
                    {msg.timestampWib}
                  </span>
                </div>
              );
            }

            const isFallback = msg.source === 'FALLBACK';
            const feedbackLocked = Boolean(msg.feedbackGiven) || Boolean(msg.feedbackPending);

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <span className="mt-0.5 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-raised)] sm:grid">
                  <img src="/logo/symbol.svg" alt="" width={16} height={16} className="h-4 w-4" />
                </span>

                <div className="min-w-0 max-w-full flex-1 sm:max-w-[88%]">
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-text-primary)]">Asisten SIGAP</span>
                    <span className="tnum">{msg.timestampWib}</span>
                    {isFallback ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-warning-strong)] px-2 py-0.5 font-medium text-[var(--color-warning-strong)]">
                        <BookOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Dijawab dari FAQ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] px-2 py-0.5 font-medium text-[var(--color-text-secondary)]">
                        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Konteks BMKG
                      </span>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap break-words rounded-[20px] rounded-tl-md bg-[var(--color-surface-raised)] px-5 py-4 text-sm sm:text-base leading-relaxed text-[var(--color-text-primary)]">
                    {msg.content}
                  </div>

                  {msg.chatLogId && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {msg.feedbackGiven ? 'Penilaian tercatat.' : 'Apakah jawaban ini membantu?'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={feedbackLocked}
                          aria-label="Jawaban ini membantu"
                          aria-pressed={msg.feedbackGiven === 'up'}
                          onClick={() => msg.chatLogId && void handleFeedback(msg.id, msg.chatLogId, true)}
                          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                            msg.feedbackGiven === 'up'
                              ? 'bg-[var(--color-surface-raised)] text-[var(--color-primary-strong)]'
                              : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] disabled:text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {msg.feedbackGiven === 'up' ? (
                            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <ThumbsUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          <span>Ya</span>
                        </button>
                        <button
                          type="button"
                          disabled={feedbackLocked}
                          aria-label="Jawaban ini kurang tepat"
                          aria-pressed={msg.feedbackGiven === 'down'}
                          onClick={() => msg.chatLogId && void handleFeedback(msg.id, msg.chatLogId, false)}
                          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                            msg.feedbackGiven === 'down'
                              ? 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]'
                              : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] disabled:text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {msg.feedbackGiven === 'down' ? (
                            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          <span>Kurang tepat</span>
                        </button>
                      </div>
                      {msg.feedbackError && (
                        <p className="w-full text-xs text-[var(--color-error-strong)]">{msg.feedbackError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3" role="status" aria-live="polite">
              <span className="mt-0.5 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-raised)] sm:grid">
                <img src="/logo/symbol.svg" alt="" width={16} height={16} className="h-4 w-4" />
              </span>
              <div className="inline-flex items-center gap-2.5 rounded-[20px] rounded-tl-md bg-[var(--color-surface-raised)] px-5 py-3.5 text-sm text-[var(--color-text-primary)]">
                <span
                  className="h-2 w-2 rounded-full bg-[var(--color-primary)] motion-safe:animate-pulse"
                  aria-hidden="true"
                />
                Sedang menyusun jawaban...
              </div>
            </div>
          )}

          {errorState && (
            <div
              role="alert"
              className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-error-strong)] bg-[var(--color-surface-raised)] p-4"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-error-strong)]" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {errorState.isRateLimit ? 'Batas pengiriman pesan tercapai' : 'Pesan belum berhasil diproses'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{errorState.message}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <button
                  type="button"
                  onClick={() => handleRetry(errorState.retryText)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] px-4 text-sm font-medium text-[var(--color-on-cta)] transition-opacity hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Coba lagi
                </button>
                <Link
                  href="/edukasi"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)]"
                >
                  Buka Edukasi
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 bg-[var(--color-background)] px-3 pb-3 pt-2 sm:px-6 sm:pb-5">
          <form
            onSubmit={handleFormSubmit}
            className="flex items-end gap-2 rounded-[var(--radius-2xl)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] py-1.5 pl-5 pr-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary-strong)]"
          >
            <label htmlFor="chat-message-input" className="sr-only">
              Pertanyaan Anda. Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.
            </label>
            <textarea
              id="chat-message-input"
              ref={textareaRef}
              rows={1}
              maxLength={MAX_CHARS}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pertanyaan tentang gempa atau mitigasi..."
              className="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent py-2.5 text-sm sm:text-base leading-snug text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] outline-none focus:outline-none focus-visible:!outline-none"
            />
            {showCharCounter && (
              <span
                aria-live="polite"
                className={`self-center text-xs font-medium tnum ${
                  remainingChars <= 25 ? 'text-[var(--color-error-strong)]' : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {inputText.length}/{MAX_CHARS}
              </span>
            )}
            <button
              type="submit"
              disabled={isLoading || inputText.trim().length === 0}
              aria-label="Kirim pertanyaan"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] transition-opacity hover:opacity-90 disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-secondary)]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-2 px-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Jawaban dapat keliru dan bukan peringatan dini resmi. Rujuk BMKG untuk informasi resmi.
            <span className="lg:hidden"> Jangan menulis data pribadi; percakapan disimpan 30 hari.</span>
          </p>
        </div>
      </section>
    </div>
  );
}
