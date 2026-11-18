'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Info,
  RefreshCw,
  RotateCcw,
  Send,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import {
  QuakeContextCard,
  QuakeContextStrip,
  type QuakeContextSummary,
} from './QuakeContextCard';
import { ChatMessageContent } from './ChatMessageContent';

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
  suggestedPrompts?: string[];
  latestQuakeSummary?: QuakeContextSummary | null;
  initialMessages?: ChatUiMessage[];
  initialError?: ChatUiErrorState | null;
  initialQuotaNotice?: boolean;
}

const MAX_CHARS = 500;
const CHAR_COUNTER_THRESHOLD = 380;

const CATEGORIZED_PROMPTS = [
  {
    key: 'terkini',
    title: 'Gempa terkini',
    prompts: [
      'Gempa terakhir terjadi di mana?',
      'Apakah gempa terbaru berpotensi tsunami?',
    ],
  },
  {
    key: 'darurat',
    title: 'Saat darurat',
    prompts: [
      'Apa yang harus dilakukan saat gempa di dalam bangunan?',
      'Apa yang harus dilakukan jika ada tanda tsunami di pantai?',
    ],
  },
  {
    key: 'persiapan',
    title: 'Persiapan & pengetahuan',
    prompts: ['Apa isi tas siaga bencana?', 'Apa itu skala MMI?'],
  },
] as const;

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]';

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

function getFollowUpPrompts(lastReply: string, lastUserText: string): string[] {
  const lower = lastReply.toLowerCase();
  const candidates: string[] = [];

  if (lower.includes('tsunami') || lower.includes('pantai')) {
    candidates.push(
      'Apa tanda alami tsunami yang harus diwaspadai?',
      'Berapa lama waktu evakuasi mandiri setelah gempa pesisir?'
    );
  } else if (lower.includes('mmi') || lower.includes('guncangan') || lower.includes('magnitudo')) {
    candidates.push(
      'Bagaimana cara membedakan tingkat guncangan pada skala MMI?',
      'Apa bedanya magnitudo dan skala MMI?'
    );
  } else if (lower.includes('tas siaga') || lower.includes('persiapan')) {
    candidates.push(
      'Di mana lokasi aman untuk berlindung saat gempa di rumah?',
      'Dokumen apa saja yang wajib masuk tas siaga bencana?'
    );
  } else {
    candidates.push(
      'Apa yang harus dilakukan setelah guncangan gempa berhenti?',
      'Kapan warga boleh kembali masuk ke dalam bangunan?'
    );
  }

  candidates.push('Apa isi tas siaga bencana?', 'Bagaimana cek info gempa resmi BMKG?');

  const prevLower = lastUserText.trim().toLowerCase();
  const unique = Array.from(new Set(candidates)).filter(
    (q) => q.toLowerCase() !== prevLower
  );
  return unique.slice(0, 3);
}

export function ChatbotWorkspace({
  initialPrefill = '',
  contextBannerText,
  latestQuakeSummary,
  initialMessages = [],
  initialError = null,
  initialQuotaNotice = false,
}: ChatbotWorkspaceProps) {
  const [messages, setMessages] = useState<ChatUiMessage[]>(initialMessages);
  const [inputText, setInputText] = useState<string>(initialPrefill);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<ChatUiErrorState | null>(initialError);
  const [quotaExhaustedBanner, setQuotaExhaustedBanner] =
    useState<boolean>(initialQuotaNotice);
  const [keyboardOffsetPx, setKeyboardOffsetPx] = useState<number>(0);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);

  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldForceScrollRef = useRef<boolean>(false);

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

  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const el = logContainerRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : behavior });
    setShowScrollButton(false);
    setIsNearBottom(true);
  };

  // Auto-scroll hanya jika pengguna berada di dekat bawah atau baru saja mengirim pesan.
  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    if (shouldForceScrollRef.current || isNearBottom) {
      shouldForceScrollRef.current = false;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
      setShowScrollButton(false);
    } else if (messages.length > 0) {
      setShowScrollButton(true);
    }
  }, [messages.length, isLoading, errorState, isNearBottom]);

  function handleLogScroll() {
    const el = logContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom < 96;
    setIsNearBottom(near);
    if (near) {
      setShowScrollButton(false);
    }
  }

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

    shouldForceScrollRef.current = true;
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

  function handleResetConversation() {
    setMessages([]);
    setErrorState(null);
    setCopiedMsgId(null);
    setShowScrollButton(false);
    setIsNearBottom(true);
    textareaRef.current?.focus();
  }

  async function handleCopyAnswer(msgId: string, text: string) {
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopiedMsgId(msgId);
    window.setTimeout(() => {
      setCopiedMsgId((prev) => (prev === msgId ? null : prev));
    }, 2000);
  }

  async function handleFeedback(msgId: string, chatLogId: string, isHelpful: boolean) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedbackPending: true, feedbackError: null } : m
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
  const lastMessage = messages[messages.length - 1];
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const followUpPrompts =
    !isLoading && !errorState && lastMessage?.role === 'assistant'
      ? getFollowUpPrompts(lastMessage.content, lastUserMessage?.content ?? '')
      : [];

  return (
    <div className="mx-auto grid w-full max-w-[1180px] flex-1 grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Kolom kiri: judul, kartu konteks BMKG, keterangan kontak 196 */}
      <aside className="px-1 pb-1 pt-1 sm:px-0 lg:sticky lg:top-6 lg:self-start lg:pb-0 lg:pt-2 space-y-5">
        <div>
          <h1 className="text-3xl font-light leading-[1.1] tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-4xl [text-wrap:balance]">
            Tanya jawab gempa dan mitigasi
          </h1>
          <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
            Jawaban memakai data gempa terbaru BMKG dan FAQ resmi BMKG serta BNPB.
          </p>
        </div>

        <div className="hidden lg:block space-y-3">
          <QuakeContextCard
            quake={latestQuakeSummary}
            onAskQuake={(q) => void sendMessage(q)}
          />

          <p className="px-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Darurat kebencanaan: BMKG Contact Center{' '}
            <strong className="font-semibold text-[var(--color-text-primary)]">196</strong> · BNPB
          </p>
        </div>
      </aside>

      {/* Kolom kanan: panggung percakapan */}
      <section
        aria-label="Panel percakapan asisten mitigasi gempa"
        style={keyboardOffsetPx > 0 ? { paddingBottom: `${keyboardOffsetPx}px` } : undefined}
        className="relative flex min-h-[calc(100dvh-160px)] w-full max-w-[800px] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] sm:rounded-[var(--radius-2xl)] bg-[var(--color-background)] sm:min-h-[640px] lg:h-[calc(100dvh-150px)] lg:min-h-[600px] lg:max-h-[880px]"
      >
        {/* Header status asisten + tombol percakapan baru */}
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)]">
              <img
                src="/logo/symbol.svg"
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px]"
              />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                Asisten SIGAP
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                Basis data BMKG &amp; panduan resmi BNPB
              </p>
            </div>
          </div>

          {(messages.length > 0 || errorState !== null) && (
            <button
              type="button"
              onClick={handleResetConversation}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] ${focusRing}`}
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Percakapan baru</span>
            </button>
          )}
        </header>

        {/* Konteks gempa ringkas kolaps untuk layar < 1024px */}
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/45 lg:hidden">
          <QuakeContextStrip
            quake={latestQuakeSummary}
            onAskQuake={(q) => void sendMessage(q)}
          />
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
          <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-text-primary)] sm:mx-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
            <p>
              <span className="font-medium">{contextBannerText}.</span> Pertanyaan sudah diisi di
              bawah dan bisa Anda sunting sebelum dikirim.
            </p>
          </div>
        )}

        {/* Area riwayat pesan */}
        <div
          ref={logContainerRef}
          onScroll={handleLogScroll}
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Riwayat pesan percakapan"
          className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-8"
        >
          {isEmpty && (
            <div className="flex min-h-full flex-col justify-center gap-7 py-2">
              <div className="space-y-2.5">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                  <img
                    src="/logo/symbol.svg"
                    alt=""
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px]"
                  />
                </span>
                <p className="text-xs font-medium text-[var(--color-primary-strong)]">
                  Asisten Kesiapsiagaan SIGAP
                </p>
                <h2 className="text-2xl font-light leading-tight tracking-[-0.01em] text-[var(--color-text-primary)] [text-wrap:balance]">
                  Apa yang ingin Anda ketahui tentang gempa?
                </h2>
                <p className="max-w-[54ch] text-sm leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
                  Tanyakan gempa terbaru BMKG, cara berlindung yang aman, tanda tsunami, atau arti skala MMI. Pilih pertanyaan di bawah untuk langsung memulai.
                </p>
              </div>

              {/* 3 kelompok pertanyaan bersih tanpa kartu bersarang */}
              <div className="space-y-5">
                {CATEGORIZED_PROMPTS.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-[var(--color-text-secondary)]">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.prompts.map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          onClick={() => handlePromptChipClick(promptText)}
                          className={`group flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-left text-sm font-medium leading-snug text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] ${focusRing}`}
                        >
                          <span>{promptText}</span>
                          <ArrowUpRight
                            className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-primary-strong)]"
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="sigap-stagger-item flex flex-col items-end">
                  <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[22px] rounded-br-[6px] bg-[var(--color-cta)] px-4 py-3 text-sm sm:text-base leading-relaxed text-[var(--color-on-cta)] sm:max-w-[75%]">
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
            const isCopied = copiedMsgId === msg.id;

            return (
              <div key={msg.id} className="sigap-stagger-item flex items-start gap-3">
                <span className="mt-0.5 hidden h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] sm:grid">
                  <img src="/logo/symbol.svg" alt="" width={16} height={16} className="h-4 w-4" />
                </span>

                <div className="min-w-0 max-w-full flex-1 sm:max-w-[90%]">
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-text-primary)]">Asisten SIGAP</span>
                    <span className="tnum">{msg.timestampWib}</span>
                    <span>·</span>
                    <span
                      className={
                        isFallback
                          ? 'font-medium text-[var(--color-warning-strong)]'
                          : 'text-[var(--color-text-secondary)]'
                      }
                    >
                      {isFallback ? 'Dijawab dari FAQ' : 'Konteks BMKG'}
                    </span>
                  </div>

                  <div className="rounded-[22px] rounded-tl-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4">
                    <ChatMessageContent content={msg.content} />
                  </div>

                  {/* Aksi pesan: Salin + Penilaian tanpa pil duplikat */}
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyAnswer(msg.id, msg.content)}
                      aria-label="Salin jawaban asisten"
                      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] ${focusRing}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[var(--color-primary-strong)]" aria-hidden="true" />
                          <span className="text-[var(--color-primary-strong)]">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    {msg.chatLogId && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {msg.feedbackGiven ? 'Penilaian tercatat.' : 'Membantu?'}
                        </span>
                        <button
                          type="button"
                          disabled={feedbackLocked}
                          aria-label="Jawaban ini membantu"
                          aria-pressed={msg.feedbackGiven === 'up'}
                          onClick={() =>
                            msg.chatLogId && void handleFeedback(msg.id, msg.chatLogId, true)
                          }
                          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${focusRing} ${
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
                          onClick={() =>
                            msg.chatLogId && void handleFeedback(msg.id, msg.chatLogId, false)
                          }
                          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${focusRing} ${
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
                    )}
                  </div>
                  {msg.feedbackError && (
                    <p className="mt-1 text-xs text-[var(--color-error-strong)]">
                      {msg.feedbackError}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Saran pertanyaan lanjutan */}
          {followUpPrompts.length > 0 && (
            <div className="space-y-2 pl-0 sm:pl-11">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Pertanyaan lanjutan:
              </p>
              <div className="flex flex-wrap gap-2">
                {followUpPrompts.map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => handlePromptChipClick(promptText)}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 text-left text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] ${focusRing}`}
                  >
                    <span>{promptText}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-start gap-3" role="status" aria-live="polite">
              <span className="mt-0.5 hidden h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] sm:grid">
                <img src="/logo/symbol.svg" alt="" width={16} height={16} className="h-4 w-4" />
              </span>
              <div className="inline-flex items-center gap-3 rounded-[22px] rounded-tl-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-3.5 text-sm text-[var(--color-text-primary)]">
                <span className="flex items-end gap-1 h-4" aria-hidden="true">
                  <span className="w-1 h-2 rounded-full bg-[var(--color-primary-strong)] motion-safe:animate-pulse" />
                  <span
                    className="w-1 h-4 rounded-full bg-[var(--color-primary-strong)] motion-safe:animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1 h-2.5 rounded-full bg-[var(--color-primary-strong)] motion-safe:animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  />
                </span>
                <span>Asisten SIGAP sedang menyusun jawaban...</span>
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
                    {errorState.isRateLimit
                      ? 'Batas pengiriman pesan tercapai'
                      : 'Pesan belum berhasil diproses'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{errorState.message}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <button
                  type="button"
                  onClick={() => handleRetry(errorState.retryText)}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] px-4 text-sm font-medium text-[var(--color-on-cta)] transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Coba lagi
                </button>
                <Link
                  href="/edukasi"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface)] ${focusRing}`}
                >
                  Buka Edukasi
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Tombol lompat ke pesan terbaru bila pengguna menggulir ke atas */}
        {showScrollButton && (
          <div className="pointer-events-none sticky bottom-[112px] z-20 flex justify-center px-4">
            <button
              type="button"
              onClick={() => scrollToLatest('smooth')}
              className={`pointer-events-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] transition-colors ${focusRing}`}
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Lihat pesan terbaru</span>
            </button>
          </div>
        )}

        {/* Composer + Disclaimer tunggal ringkas */}
        <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-[var(--color-background)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:pb-4">
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
                  remainingChars <= 25
                    ? 'text-[var(--color-error-strong)]'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {inputText.length}/{MAX_CHARS}
              </span>
            )}
            <button
              type="submit"
              disabled={isLoading || inputText.trim().length === 0}
              aria-label="Kirim pertanyaan"
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] transition-opacity hover:opacity-90 disabled:bg-[var(--color-surface)] disabled:text-[var(--color-text-secondary)] ${focusRing}`}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          {/* Disclaimer tunggal yang ringkas dengan detail opsional */}
          <details className="mt-2 px-1.5 text-xs text-[var(--color-text-secondary)]">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-2 gap-y-1 [&::-webkit-details-marker]:hidden">
              <span>
                Bukan peringatan dini resmi · Darurat:{' '}
                <strong className="font-semibold text-[var(--color-text-primary)]">BMKG 196</strong>{' '}
                · Jawaban dapat keliru
              </span>
              <span className="font-medium text-[var(--color-text-primary)] underline underline-offset-2">
                Selengkapnya
              </span>
            </summary>
            <p className="mt-1.5 leading-relaxed [text-wrap:pretty]">
              Untuk keadaan darurat, hubungi BMKG (Contact Center 196) atau BNPB/BPBD setempat.
              Jangan menulis data pribadi; percakapan disimpan selama 30 hari untuk evaluasi
              kualitas layanan.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
