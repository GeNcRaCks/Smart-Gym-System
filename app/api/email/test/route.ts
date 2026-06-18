import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/emailService.js';

export async function GET(req: NextRequest) {
  const to = process.env.SMTP_TEST_RECIPIENT || process.env.SMTP_USER || 'test@smartgym.local';

  const success = await sendTestEmail({ to });

  if (!success) {
    return NextResponse.json({ error: 'Failed to send test email. Check SMTP credentials.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, to });
}
