import { NextRequest, NextResponse } from 'next/server';
import { askChatbot } from '@/lib/chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pertanyaan } = body;

    if (!pertanyaan || typeof pertanyaan !== 'string' || pertanyaan.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pertanyaan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Ekstrak IP klien untuk rate limiter aman
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

    const result = await askChatbot({
      pertanyaan: pertanyaan.trim(),
      ip,
    });

    if (result.rateLimitExceeded) {
      return NextResponse.json(
        {
          error: 'Rate limit terlampaui',
          jawaban: result.jawaban,
          source: result.source,
          responseTimeMs: result.responseTimeMs,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('⚠️ Error pada endpoint chat:', err);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan sistem',
        jawaban: 'Mohon maaf, sistem chat sedang mengalami kendala. Tetap utamakan keselamatan dan ikuti arahan resmi BMKG/BNPB.',
        source: 'FALLBACK',
        responseTimeMs: 0,
      },
      { status: 500 }
    );
  }
}

