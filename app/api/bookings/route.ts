import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (session.role === 'MEMBER') {
            // Get member's bookings
            const bookings = await prisma.booking.findMany({
                where: { member: { userId: session.id } },
                include: { trainer: { include: { user: { select: { name: true } } } } }
            });
            return NextResponse.json(bookings);
        } else if (session.role === 'TRAINER') {
            // Get bookings for this trainer
            const bookings = await prisma.booking.findMany({
                where: { trainer: { userId: session.id } },
                include: { member: { include: { user: { select: { name: true } } } } }
            });
            return NextResponse.json(bookings);
        } else if (session.role === 'ADMIN') {
            const bookings = await prisma.booking.findMany();
            return NextResponse.json(bookings);
        }
        return NextResponse.json([]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'MEMBER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { trainerId, date, timeSlot, type } = await req.json(); // trainerId is TrainerProfile ID

        // Get member profile ID
        const memberProfile = await prisma.memberProfile.findUnique({ where: { userId: session.id } });
        if (!memberProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // Check for double booking
        const existingBooking = await prisma.booking.findFirst({
            where: {
                trainerId,
                date: new Date(date),
                timeSlot,
                status: {
                    notIn: ['CANCELLED', 'REJECTED']
                }
            }
        });

        if (existingBooking) {
            return NextResponse.json({ error: 'This time slot is already booked for this trainer.' }, { status: 409 });
        }

        const booking = await prisma.booking.create({
            data: {
                memberId: memberProfile.id,
                trainerId,
                date: new Date(date),
                timeSlot,
                type,
                status: 'PENDING'
            }
        });

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'TRAINER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { bookingId, status, meetingLink } = await req.json();

        // Verify trainer owns this booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { trainer: true }
        });

        if (!booking || booking.trainer.userId !== session.id) {
            return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 403 });
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { status, meetingLink }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
