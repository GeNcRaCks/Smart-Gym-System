import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        return NextResponse.json(users);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();

        // Allow users to update their own profile
        if (session.role === 'MEMBER') {
            const { height, weight, level } = body;
            // Update MemberProfile
            const updated = await prisma.memberProfile.update({
                where: { userId: session.id },
                data: { height, weight, level }
            });
            return NextResponse.json(updated);
        }

        // Trainers can update their specialty/availability
        if (session.role === 'TRAINER') {
            const { specialty, availability } = body;
            const updated = await prisma.trainerProfile.update({
                where: { userId: session.id },
                data: { specialty, availability }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Not implemented for this role' }, { status: 400 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        // Prevent admin deleting themselves
        if (id === session.id) {
            return NextResponse.json({ error: 'Cannot delete the currently logged-in admin account' }, { status: 403 });
        }

        // Proceed with deletion
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
