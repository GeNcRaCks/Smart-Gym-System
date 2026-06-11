import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const reports = await prisma.report.findMany({ orderBy: { generatedDate: 'desc' } });
    return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { type } = await req.json();

        // Generate data based on type
        let data = {};
        if (type === 'FINANCIAL') {
            const payments = await prisma.payment.findMany();
            const totalRevenue = payments.reduce((acc: number, curr: any) => acc + curr.amount, 0);
            data = { totalRevenue, transactionCount: payments.length };
        } else if (type === 'FITNESS') {
            const workouts = await prisma.workoutRecord.findMany();
            const totalDuration = workouts.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0);
            data = { totalWorkouts: workouts.length, totalDuration };
        } else {
            const users = await prisma.user.count();
            data = { totalUsers: users };
        }

        const report = await prisma.report.create({
            data: {
                type,
                data: JSON.stringify(data)
            }
        });

        return NextResponse.json(report);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
