import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'MEMBER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await req.json();
        const memberProfile = await prisma.memberProfile.findUnique({ where: { userId: session.id } });

        if (!memberProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        if (memberProfile.membershipType !== 'ELITE') {
            return NextResponse.json({ error: 'Elite membership required' }, { status: 403 });
        }

        const report = await prisma.report.create({
            data: {
                type: 'NUTRITION',
                memberId: memberProfile.id,
                data: JSON.stringify(data)
            }
        });

        // Optionally update member profile with latest weight and height
        if (data.weight || data.height) {
            await prisma.memberProfile.update({
                where: { id: memberProfile.id },
                data: { 
                    weight: data.weight ? parseFloat(data.weight) : undefined,
                    height: data.height ? parseFloat(data.height) : undefined
                }
            });
        }

        return NextResponse.json({ success: true, report });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'MEMBER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const memberProfile = await prisma.memberProfile.findUnique({ where: { userId: session.id } });
        if (!memberProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        const reports = await prisma.report.findMany({
            where: {
                memberId: memberProfile.id,
                type: 'NUTRITION'
            },
            orderBy: { generatedDate: 'desc' }
        });

        return NextResponse.json({ success: true, history: reports });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
