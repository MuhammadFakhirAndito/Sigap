import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { logId, isHelpful } = body;

    if (!logId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Parameter logId dan isHelpful (boolean) wajib disertakan.' },
        { status: 400 }
      );
    }

    const updated = await prisma.chatLog.update({
      where: { id: logId },
      data: { isHelpful },
    });

    return NextResponse.json({
      message: 'Umpan balik evaluasi berhasil dicatat.',
      logId: updated.id,
      isHelpful: updated.isHelpful,
    });
  } catch (err: any) {
    console.error('⚠️ Gagal memperbarui feedback chat:', err);
    return NextResponse.json(
      { error: 'Gagal mencatat feedback', message: err.message },
      { status: 500 }
    );
  }
}

