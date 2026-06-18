import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendBookingApprovalEmail, sendTrainerRequestNotification } from '@/lib/emailService.js';

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
            },
            include: {
                member: { include: { user: true } },
                trainer: { include: { user: true } }
            }
        });

        // Send email to trainer about new booking request
        await sendTrainerRequestNotification({
            trainerEmail: booking.trainer.user.email,
            trainerName: booking.trainer.user.name,
            memberName: booking.member.user.name,
            bookingDate: booking.date,
            timeSlot: booking.timeSlot,
            bookingType: booking.type
        });

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { bookingId, status, meetingLink } = await req.json();

        // Get booking and verify ownership
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { 
                trainer: { include: { user: true } }, 
                member: { include: { user: true } } 
            }
        });

        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

        // Member cancellation logic
        if (session.role === 'MEMBER') {
            if (booking.member.userId !== session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            if (status !== 'CANCELLED') return NextResponse.json({ error: 'Members can only cancel bookings' }, { status: 400 });
            
            const updated = await prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' }
            });
            return NextResponse.json(updated);
        }

        // Trainer logic
        if (session.role === 'TRAINER') {
            if (booking.trainer.userId !== session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

            // Time validation for COMPLETED
            if (status === 'COMPLETED') {
                const [time, period] = booking.timeSlot.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

                const bookingDateTime = new Date(booking.date);
                bookingDateTime.setHours(hours, minutes, 0, 0);

                if (new Date() < bookingDateTime) {
                    return NextResponse.json({ error: 'Cannot complete a session before its start time' }, { status: 400 });
                }
            }

            const updated = await prisma.booking.update({
                where: { id: bookingId },
                data: { status, meetingLink }
            });

            // Email on CONFIRMED
            if (status === 'CONFIRMED' && booking.status !== 'CONFIRMED') {
                await sendBookingApprovalEmail({
                    memberEmail: booking.member.user.email,
                    memberName: booking.member.user.name,
                    trainerName: booking.trainer.user.name,
                    bookingDate: booking.date,
                    timeSlot: booking.timeSlot,
                    bookingType: booking.type,
                    meetingLink: meetingLink || null
                });
            }

            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
