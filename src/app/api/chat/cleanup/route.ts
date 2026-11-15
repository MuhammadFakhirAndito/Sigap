import { NextRequest, NextResponse } from 'next/server';
import { constantTimeEqual } from '@/lib/chat/rate-limit';
import { cleanupExpiredChatLogs } from '@/lib/chat/service';

export async function POST(req: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET;
  const authHeader =
    req.headers.get('x-sync-secret') || req.headers.get('authorization');

  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader?.trim();

  if (!constantTimeEqual(providedSecret, syncSecret)) {
    return NextResponse.json(
      {
        error:
          'Unauthorized: Header x-sync-secret tidak valid atau tidak disertakan',
      },
      { status: 401 }
    );
  }

  try {
    const { deletedCount, cutoffDate } = await cleanupExpiredChatLogs(30);
    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membersihkan catatan ChatLog lama.',
      },
      { status: 500 }
    );
  }
}

