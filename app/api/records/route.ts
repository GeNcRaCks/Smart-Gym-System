import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await prisma.workoutRecord.findMany({
        where: { member: { userId: session.id } },
        orderBy: { date: 'desc' }
    });
    return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { duration, caloriesBurned, notes } = await req.json();

        const memberProfile = await prisma.memberProfile.findUnique({
            where: { userId: session.id }
        });

        if (!memberProfile) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const record = await prisma.workoutRecord.create({
            data: {
                memberId: memberProfile.id,
                duration: duration,
                caloriesBurned: caloriesBurned,
                notes: notes,
                date: new Date()
            }
        });

        return NextResponse.json(record);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
