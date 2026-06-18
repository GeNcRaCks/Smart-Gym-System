import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'TRAINER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: trainerId } = await params;

        // Verify that the trainer is requesting their own ratings
        const trainer = await prisma.trainerProfile.findUnique({
            where: { id: trainerId },
            include: { user: true }
        });

        if (!trainer || trainer.user.id !== session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all ratings for this trainer
        const ratings = await prisma.trainerRating.findMany({
            where: { trainerId: trainerId },
            orderBy: { createdAt: 'desc' }
        });

        const memberIds = [...new Set(ratings.map(r => r.memberId))];
        const members = await prisma.memberProfile.findMany({
            where: { id: { in: memberIds } },
            include: { user: true }
        });
        const memberMap = new Map(members.map(member => [member.id, member.user.name]));

        // Calculate statistics
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0 
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2)
            : 0;

        const ratingDistribution = {
            5: ratings.filter(r => r.rating === 5).length,
            4: ratings.filter(r => r.rating === 4).length,
            3: ratings.filter(r => r.rating === 3).length,
            2: ratings.filter(r => r.rating === 2).length,
            1: ratings.filter(r => r.rating === 1).length
        };

        return NextResponse.json({
            ratings: ratings.map(r => ({
                id: r.id,
                rating: r.rating,
                feedback: r.feedback,
                memberName: memberMap.get(r.memberId) || 'Member',
                createdAt: r.createdAt
            })),
            statistics: {
                totalRatings,
                averageRating,
                ratingDistribution
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
