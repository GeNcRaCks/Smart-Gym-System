import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const totalUsers = await prisma.user.count();
        const activeMembers = await prisma.user.count({ where: { role: 'MEMBER' } });
        const trainers = await prisma.user.count({ where: { role: 'TRAINER' } });

        let pendingBookings = 0;
        let upcomingSessions = 0;

        if (session.role === 'ADMIN') {
            // Admin sees global pending?
            // Maybe just global stats
        } else if (session.role === 'TRAINER') {
            // Specific trainer stats
            const trainerProfile = await prisma.trainerProfile.findUnique({ where: { userId: session.id } });
            if (trainerProfile) {
                upcomingSessions = await prisma.booking.count({
                    where: {
                        trainerId: trainerProfile.id,
                        status: 'CONFIRMED',
                        date: { gte: new Date() }
                    }
                });
                pendingBookings = await prisma.booking.count({
                    where: {
                        trainerId: trainerProfile.id,
                        status: 'PENDING'
                    }
                });
            }
        }

        // Revenue estimate (sum of all payments)
        const revenueAgg = await prisma.payment.aggregate({
            _sum: { amount: true }
        });

        let memberStreak = 0;
        if (session.role === 'MEMBER') {
            const records = await prisma.workoutRecord.findMany({
                where: { member: { userId: session.id } },
                orderBy: { date: 'desc' },
                select: { date: true, duration: true } // Fetch date
            });

            // Simple streak logic: Consecutive days backwards from today
            // Normalize dates to midnight for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const uniqueDates = new Set(records.map(r => new Date(r.date).setHours(0, 0, 0, 0)));

            let checkDate = new Date(today);
            while (uniqueDates.has(checkDate.getTime())) {
                memberStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        return NextResponse.json({
            totalUsers,
            activeMembers,
            trainers,
            totalRevenue: revenueAgg._sum.amount || 0,
            pendingBookings,
            upcomingSessions,
            memberStreak
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
