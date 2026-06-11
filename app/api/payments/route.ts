import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'MEMBER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { amount, method, details, proofBase64 } = await req.json();
        const memberProfile = await prisma.memberProfile.findUnique({ where: { userId: session.id } });

        if (!memberProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // For JazzCash / Bank transfers we record as PENDING and allow admin to verify
        const status = method === 'JAZZCASH' || method === 'BANK_TRANSFER' ? 'PENDING' : 'COMPLETED';

        const payment = await prisma.payment.create({
            data: {
                memberId: memberProfile.id,
                amount,
                method,
                status,
                reference: details?.txId ?? null,
            }
        });

        let proofUrl = null;
        if (proofBase64) {
            try {
                const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
                await fs.mkdir(uploadsDir, { recursive: true });
                const matches = proofBase64.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
                const ext = matches && matches[2] ? (matches[2] === 'jpeg' ? 'jpg' : matches[2]) : 'png';
                const base64Data = matches ? matches[3] : proofBase64;
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = `${payment.id}.${ext}`;
                const filePath = path.join(uploadsDir, fileName);
                await fs.writeFile(filePath, buffer);
                proofUrl = `/uploads/${fileName}`;
                await prisma.payment.update({ where: { id: payment.id }, data: { proofUrl } });
            } catch (err) {
                console.error('Failed to save proof:', err);
            }
        }

        return NextResponse.json({ ...payment, reference: payment.reference, proofUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (session.role === 'ADMIN') {
            const payments = await prisma.payment.findMany({ include: { member: { include: { user: { select: { name: true } } } } } });
            return NextResponse.json(payments);
        } else if (session.role === 'MEMBER') {
            const payments = await prisma.payment.findMany({ where: { member: { userId: session.id } } });
            return NextResponse.json(payments);
        }
        return NextResponse.json([]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, status } = await req.json();
        if (!id || !status) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        const payment = await prisma.payment.update({ where: { id }, data: { status } });
        return NextResponse.json(payment);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
