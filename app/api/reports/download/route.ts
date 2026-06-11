import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function wrapText(text: string, font: any, size: number, maxWidth: number) {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, size);

        if (width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }

    if (line) lines.push(line);
    return lines;
}

async function generatePdfBuffer(user: any, workouts: any[], payments: any[], bookings: any[]) {
    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 40;
    const lineHeight = 16;
    const contentWidth = pageWidth - margin * 2;
    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const addTextBlock = (text: string, size: number, bold = false, indent = 0) => {
        const font = bold ? helveticaBold : helvetica;
        const lines = wrapText(text, font, size, contentWidth - indent);

        for (const line of lines) {
            if (y < margin + lineHeight) {
                page = doc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
            }

            page.drawText(line, {
                x: margin + indent,
                y,
                size,
                font,
                color: rgb(0.05, 0.05, 0.05),
            });
            y -= lineHeight;
        }

        y -= lineHeight / 2;
    };

    addTextBlock(`Report for ${user.name || user.email}`, 20, true);
    addTextBlock('User Details', 14, true);
    addTextBlock(`ID: ${user.id}`, 10);
    addTextBlock(`Name: ${user.name || ''}`, 10);
    addTextBlock(`Email: ${user.email || ''}`, 10);
    addTextBlock(`Role: ${user.role || ''}`, 10);
    addTextBlock(`Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : ''}`, 10);

    addTextBlock('Member Profile', 14, true);
    const mp = user.memberProfile || {};
    addTextBlock(`Membership Type: ${mp.membershipType || ''}`, 10);
    addTextBlock(`Height: ${mp.height ?? ''}`, 10);
    addTextBlock(`Weight: ${mp.weight ?? ''}`, 10);
    addTextBlock(`Join Date: ${mp.joinDate ? new Date(mp.joinDate).toLocaleDateString() : ''}`, 10);

    addTextBlock('Workouts', 14, true);
    if (workouts.length === 0) {
        addTextBlock('No workouts recorded.', 10);
    } else {
        for (const w of workouts) {
            addTextBlock(`${new Date(w.date).toLocaleDateString()} — ${w.duration ?? ''} mins — ${w.caloriesBurned ?? ''} cals`, 10);
            if (w.notes) addTextBlock(`Notes: ${w.notes}`, 10, false, 10);
        }
    }

    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    addTextBlock('Payments', 14, true);
    if (payments.length === 0) {
        addTextBlock('No payments recorded.', 10);
    } else {
        for (const p of payments) {
            addTextBlock(`${new Date(p.date).toLocaleDateString()} — PKR ${p.amount} — ${p.method} — ${p.status}`, 10);
        }
    }

    addTextBlock('Bookings', 14, true);
    if (bookings.length === 0) {
        addTextBlock('No bookings recorded.', 10);
    } else {
        for (const b of bookings) {
            addTextBlock(`${new Date(b.date).toLocaleDateString()} — ${b.timeSlot} — ${b.status}`, 10);
        }
    }

    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes);
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const format = (url.searchParams.get('format') || 'csv').toLowerCase();

    // Members can download their own report; admins can request for any userId
    let targetUserId = userId;
    if (session.role === 'MEMBER') targetUserId = session.id;
    if (session.role === 'ADMIN' && !targetUserId) return NextResponse.json({ error: 'userId required for admin' }, { status: 400 });

    if (!targetUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { id: targetUserId }, include: { memberProfile: true, trainerProfile: true } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const workouts = await prisma.workoutRecord.findMany({ where: { member: { userId: targetUserId } }, orderBy: { date: 'desc' } });
        const payments = await prisma.payment.findMany({ where: { member: { userId: targetUserId } }, orderBy: { date: 'desc' } });
        const bookings = await prisma.booking.findMany({ where: { member: { userId: targetUserId } }, orderBy: { date: 'desc' } });

        if (format === 'pdf') {
            const buffer = await generatePdfBuffer(user, workouts, payments, bookings);
            return new NextResponse(new Uint8Array(buffer), {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="report-${targetUserId}.pdf"`
                }
            });
        }

        // fallback to CSV if requested
        function toCSVSection(title: string, rows: any[], columns: string[]) {
            const header = `"${title}"\n`;
            const cols = columns.join(',') + '\n';
            const lines = rows.map(r => columns.map(c => {
                const v = r[c] ?? '';
                return typeof v === 'string' ? `"${v.replace(/"/g, '""') }"` : `"${String(v)}"`;
            }).join(',')).join('\n');
            return header + cols + (lines ? lines + '\n\n' : '\n');
        }

        let csv = '';
        csv += toCSVSection('User', [user], ['id', 'name', 'email', 'role', 'createdAt']);
        csv += toCSVSection('MemberProfile', [user.memberProfile ?? {}], ['id', 'height', 'weight', 'membershipType', 'level', 'joinDate']);
        csv += toCSVSection('Workouts', workouts.map(w => ({ id: w.id, date: w.date, duration: w.duration, caloriesBurned: w.caloriesBurned, notes: w.notes })), ['id', 'date', 'duration', 'caloriesBurned', 'notes']);
        csv += toCSVSection('Payments', payments.map(p => ({ id: p.id, date: p.date, amount: p.amount, method: p.method, status: p.status })), ['id', 'date', 'amount', 'method', 'status']);
        csv += toCSVSection('Bookings', bookings.map(b => ({ id: b.id, date: b.date, timeSlot: b.timeSlot, status: b.status, trainerId: b.trainerId })), ['id', 'date', 'timeSlot', 'status', 'trainerId']);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="report-${targetUserId}.csv"`
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
