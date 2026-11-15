import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  extractClientIp,
  hashClientIp,
} from '@/lib/chat/rate-limit';
import { processChatTurn } from '@/lib/chat/service';
import type { ChatTurnMessage } from '@/lib/chat/provider';

export async function POST(req: NextRequest) {
  const rawIp = extractClientIp(req.headers);
  const ipHash = hashClientIp(rawIp);

  const rateLimit = checkRateLimit(ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: rateLimit.message,
        retryAfterSec: rateLimit.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSec),
        },
      }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Format permintaan JSON tidak valid.' },
      { status: 400 }
    );
  }

  const message = typeof body.message === 'string' ? body.message : '';
  const pageContextNote =
    typeof body.pageContextNote === 'string' ? body.pageContextNote : undefined;

  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history: ChatTurnMessage[] = rawHistory
    .filter(
      (item): item is { role: 'user' | 'model'; content: string } =>
        Boolean(
          item &&
            typeof item === 'object' &&
            ((item as Record<string, unknown>).role === 'user' ||
              (item as Record<string, unknown>).role === 'model') &&
            typeof (item as Record<string, unknown>).content === 'string'
        )
    )
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 1000),
    }));

  const result = await processChatTurn({
    message,
    history,
    pageContextNote,
    ipHash,
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { error: result.error ?? 'Gagal memproses pesan.' },
      { status: result.status }
    );
  }

  return NextResponse.json({
    reply: result.reply,
    source: result.source,
    model: result.model,
    chatLogId: result.chatLogId,
    quotaExhausted: result.quotaExhausted,
    contextAvailable: result.contextAvailable,
    faqMatched: result.faqMatched,
  });
}

