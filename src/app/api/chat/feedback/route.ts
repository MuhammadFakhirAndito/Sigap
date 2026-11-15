import { NextRequest, NextResponse } from 'next/server';
import { submitChatFeedback } from '@/lib/chat/service';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Format permintaan JSON tidak valid.' },
      { status: 400 }
    );
  }

  const chatLogId = typeof body.chatLogId === 'string' ? body.chatLogId : '';
  const isHelpful = body.isHelpful;

  if (typeof isHelpful !== 'boolean') {
    return NextResponse.json(
      { error: 'Parameter isHelpful wajib berupa boolean.' },
      { status: 400 }
    );
  }

  try {
    const result = await submitChatFeedback(chatLogId, isHelpful);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Gagal menyimpan penilaian ke basis data.' },
      { status: 503 }
    );
  }
}

