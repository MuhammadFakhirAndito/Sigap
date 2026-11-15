import React from 'react';
import type { Metadata } from 'next';
import { NotchNavbar } from '@/components/ui/NotchNavbar';
import { Footer } from '@/components/ui/Footer';
import {
  ChatbotWorkspace,
  type ChatUiErrorState,
  type ChatUiMessage,
} from '@/components/chat/ChatbotWorkspace';
import { buildEarthquakeContext } from '@/lib/chat/context';
import { STATIC_FAQS } from '@/data/fallback/faq';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Chatbot Mitigasi Gempa | SIGAP Gempa',
  description:
    'Tanya jawab seputar data gempa bumi BMKG, arti skala MMI, potensi tsunami, dan langkah kesiapsiagaan bencana.',
};

interface ChatbotPageProps {
  searchParams: Promise<{
    q?: string;
    topik?: string;
    m?: string;
    d?: string;
    lat?: string;
    lon?: string;
    wilayah?: string;
    mmi?: string;
    view?: string;
  }>;
}

const DEFAULT_SUGGESTED_PROMPTS = [
  'Gempa terakhir terjadi di mana?',
  'Apa yang harus dilakukan saat gempa di dalam bangunan?',
  'Apa isi tas siaga bencana?',
  'Apa itu skala MMI?',
];

function buildPrefillFromSearchParams(params: {
  q?: string;
  topik?: string;
  m?: string;
  d?: string;
  lat?: string;
  lon?: string;
  wilayah?: string;
  mmi?: string;
}): { initialPrefill: string; contextBannerText?: string } {
  const rawQuestion = (params.q ?? params.topik ?? '').trim();
  if (rawQuestion) {
    const isQuestionSentence =
      rawQuestion.endsWith('?') ||
      /^(apa|bagaimana|mengapa|kenapa|kapan|di mana|berapa)/i.test(rawQuestion);
    return {
      initialPrefill: isQuestionSentence
        ? rawQuestion
        : `Saya ingin bertanya mengenai materi "${rawQuestion}": apa poin kesiapsiagaan utama yang perlu saya perhatikan?`,
      contextBannerText: `Topik dari halaman Edukasi (${rawQuestion})`,
    };
  }

  const m = params.m?.trim();
  const d = params.d?.trim();
  const wilayah = params.wilayah?.trim();
  const mmi = params.mmi?.trim();

  if (m && d) {
    const lokasiPart = wilayah ? ` di wilayah ${wilayah}` : '';
    const mmiPart = mmi ? ` (estimasi intensitas MMI ${mmi})` : '';
    return {
      initialPrefill: `Bagaimana langkah kesiapsiagaan untuk skenario gempa magnitudo M ${m} dengan kedalaman ${d} km${lokasiPart}${mmiPart}?`,
      contextBannerText: `Parameter dari Simulasi/Riwayat (M ${m}, kedalaman ${d} km${lokasiPart})`,
    };
  }

  return { initialPrefill: '' };
}

export default async function ChatbotPage({ searchParams }: ChatbotPageProps) {
  const params = await searchParams;
  const { initialPrefill, contextBannerText } = buildPrefillFromSearchParams(params);

  const quakeContext = await buildEarthquakeContext();
  const latestQuakeSummary = quakeContext.autogempa;

  let initialMessages: ChatUiMessage[] = [];
  let initialError: ChatUiErrorState | null = null;
  let initialQuotaNotice = false;

  // Mode pratinjau deterministik khusus lingkungan non-produksi untuk tangkapan layar verifikasi
  // memakai data nyata BMKG dan FAQ resmi tanpa mengonsumsi kuota API Gemini.
  if (process.env.NODE_ENV !== 'production' && params.view) {
    const viewMode = params.view.trim().toLowerCase();
    const faqBangunan =
      STATIC_FAQS.find((f) => f.pertanyaan.includes('di dalam bangunan')) ??
      STATIC_FAQS[2]!;
    const faqTasSiaga =
      STATIC_FAQS.find((f) => f.pertanyaan.includes('tas siaga')) ??
      STATIC_FAQS[8]!;

    if (viewMode === 'normal') {
      const quakeReply = latestQuakeSummary
        ? `Berdasarkan data resmi BMKG yang diperbarui pada ${latestQuakeSummary.waktuWib}, gempa terbaru tercatat dengan magnitudo M ${latestQuakeSummary.magnitudo.toFixed(
            1
          )} pada kedalaman ${latestQuakeSummary.kedalamanKm} km di ${
            latestQuakeSummary.wilayah
          } (koordinat ${latestQuakeSummary.koordinat}). Status BMKG: ${
            latestQuakeSummary.potensiTeks
          }.\n\nJika Anda berada di sekitar wilayah tersebut dan merasakan guncangan, tetap tenang, lindungi kepala dari potensi benda jatuh, dan pantau pembaruan resmi melalui kanal BMKG atau Contact Center 196.`
        : `Berdasarkan panduan resmi BMKG, saat terjadi guncangan gempa di dalam gedung, segera lindungi kepala dan tubuh di bawah meja yang kokoh, jauhi kaca, dan jangan menggunakan lift.`;

      initialMessages = [
        {
          id: 'preview-user-1',
          role: 'user',
          content: 'Gempa terakhir terjadi di mana?',
          timestampWib: '09:15 WIB',
        },
        {
          id: 'preview-assistant-1',
          role: 'assistant',
          content: quakeReply,
          timestampWib: '09:15 WIB',
          source: 'LLM',
          model: 'gemini-3.5-flash-lite',
          chatLogId: 'cmmpreviewnormalchatlog01',
          feedbackGiven: 'up',
        },
      ];
    } else if (viewMode === 'faq') {
      initialMessages = [
        {
          id: 'preview-user-faq',
          role: 'user',
          content: faqBangunan.pertanyaan,
          timestampWib: '09:18 WIB',
        },
        {
          id: 'preview-assistant-faq',
          role: 'assistant',
          content: faqBangunan.jawaban,
          timestampWib: '09:18 WIB',
          source: 'FALLBACK',
          model: 'faq_db',
          chatLogId: 'cmmpreviewfaqchatlog0002',
          feedbackGiven: null,
        },
      ];
    } else if (viewMode === 'quota') {
      initialQuotaNotice = true;
      initialMessages = [
        {
          id: 'preview-user-quota',
          role: 'user',
          content: faqTasSiaga.pertanyaan,
          timestampWib: '09:20 WIB',
        },
        {
          id: 'preview-assistant-quota',
          role: 'assistant',
          content: `Kuota asisten AI sedang penuh atau layanan model sedang mengalami gangguan. Berikut jawaban dari FAQ SIGAP:\n\n${faqTasSiaga.jawaban}`,
          timestampWib: '09:20 WIB',
          source: 'FALLBACK',
          model: 'faq_db',
          chatLogId: 'cmmpreviewquotachatlog03',
          quotaExhausted: true,
          feedbackGiven: null,
        },
      ];
    } else if (viewMode === 'error') {
      initialMessages = [
        {
          id: 'preview-user-err',
          role: 'user',
          content: 'Apa yang harus dilakukan setelah guncangan gempa berhenti?',
          timestampWib: '09:22 WIB',
        },
      ];
      initialError = {
        message: 'Terlalu banyak pesan. Coba lagi dalam 42 detik.',
        retryText: 'Apa yang harus dilakukan setelah guncangan gempa berhenti?',
        isRateLimit: true,
        retryAfterSec: 42,
      };
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col">
        <NotchNavbar variant="notch" />

        <main className="w-full rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-4 sm:px-8 lg:px-10 pt-5 sm:pt-7 pb-6 sm:pb-8 flex-1 flex flex-col">
          <ChatbotWorkspace
            initialPrefill={initialPrefill}
            contextBannerText={contextBannerText}
            suggestedPrompts={DEFAULT_SUGGESTED_PROMPTS}
            latestQuakeSummary={latestQuakeSummary}
            initialMessages={initialMessages}
            initialError={initialError}
            initialQuotaNotice={initialQuotaNotice}
          />
        </main>
      </div>

      <div className="hidden sm:block">
        <Footer />
      </div>
    </div>
  );
}
