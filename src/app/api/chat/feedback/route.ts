import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logId, chatLogId, isHelpful } = body;
    const targetId = chatLogId || logId;

    if (!targetId || typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Parameter chatLogId dan isHelpful (boolean) wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Validasi apakah chatLogId ada di database (TC-DB-19)
    const existing = await prisma.chatLog.findUnique({
      where: { id: targetId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Ditolak: Log percakapan tidak ditemukan atau chatLogId palsu/tidak valid (TC-DB-19).' },
        { status: 404 }
      );
    }

    // 2. Cegah penilaian ganda (satu penilaian per jawaban, FR-DB-21, TC-DB-19)
    if (existing.isHelpful !== null) {
      return NextResponse.json(
        { error: 'Ditolak: Penilaian sudah pernah dikirimkan sebelumnya untuk pesan ini. Hanya satu penilaian yang diperbolehkan per jawaban (TC-DB-19).' },
        { status: 400 }
      );
    }

    // 3. Simpan feedback
    const updated = await prisma.chatLog.update({
      where: { id: targetId },
      data: { isHelpful },
    });

    return NextResponse.json({
      message: 'Umpan balik evaluasi berhasil dicatat.',
      chatLogId: updated.id,
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

export async function PATCH(req: NextRequest) {
  return POST(req);
}
