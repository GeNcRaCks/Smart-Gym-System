import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session || session.role !== 'MEMBER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: bookingId } = await params;
        const body = await req.json();
        const { rating, feedback } = body;

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating. Must be between 1 and 5' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { member: true, trainer: true }
        });

        if (!booking || booking.member.userId !== session.id) {
            return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 403 });
        }

        if (booking.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Can only rate completed sessions' }, { status: 400 });
        }

        if (booking.isRated) {
            return NextResponse.json({ error: 'Booking is already rated' }, { status: 400 });
        }

        // Calculate new average rating
        const currentRating = booking.trainer.rating;
        const currentCount = booking.trainer.ratingCount;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;

        // Transaction to update trainer, booking, and create rating record
        await prisma.$transaction([
            // Create rating record for history
            prisma.trainerRating.create({
                data: {
                    trainerId: booking.trainerId,
                    memberId: booking.memberId,
                    rating: rating,
                    feedback: feedback || null
                }
            }),
            prisma.trainerProfile.update({
                where: { id: booking.trainerId },
                data: {
                    rating: newRating,
                    ratingCount: newCount
                }
            }),
            prisma.booking.update({
                where: { id: bookingId },
                data: { isRated: true }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
