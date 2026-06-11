import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Filter based on role?
    // Members: see assigned plans? Or all public plans?
    // Trainers: see plans they created?
    // For now, return all or filtered by query param.

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        const workoutPlans = await prisma.workoutPlan.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } }
                ]
            } : undefined,
            include: {
                exercises: true,
                creator: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
        return NextResponse.json(workoutPlans);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    // Only TRAINER or ADMIN can create workouts
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, difficulty, duration, exercises, userId } = body;
        // userId is the Creator ID from the session usually.

        // We need the TrainerProfile ID for this user.
        let creatorId;

        if (session.role === 'TRAINER') {
            const profile = await prisma.trainerProfile.findUnique({ where: { userId: session.id } });
            if (!profile) return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 });
            creatorId = profile.id;
        } else {
            // If Admin creates, we might need a default trainer profile or admin profile?
            // Schema says `creator: TrainerProfile`. So Admin can't create unless they have a TrainerProfile.
            // Let's assume admins can create by borrowing a trainer profile or self-assigning if they have one.
            // For simplicity, strict check:
            const profile = await prisma.trainerProfile.findUnique({ where: { userId: session.id } });
            if (!profile) return NextResponse.json({ error: 'Must have Trainer profile to create plans' }, { status: 403 });
            creatorId = profile.id;
        }

        const plan = await prisma.workoutPlan.create({
            data: {
                name,
                description,
                difficulty,
                duration,
                creatorId,
                exercises: {
                    create: exercises // Expect array of { name, sets, reps, duration }
                }
            },
            include: { exercises: true }
        });

        return NextResponse.json(plan);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await req.json();

        // Verify ownership if needed, for simplicity allow Trainer to delete
        await prisma.workoutPlan.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || (session.role !== 'TRAINER' && session.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, description, difficulty, duration, exercises } = body;

        const updated = await prisma.$transaction(async (tx) => {
            const plan = await tx.workoutPlan.update({
                where: { id },
                data: {
                    name,
                    description,
                    difficulty,
                    duration
                }
            });

            await tx.exercise.deleteMany({ where: { workoutPlanId: id } });

            if (Array.isArray(exercises) && exercises.length > 0) {
                await tx.exercise.createMany({
                    data: exercises.map((ex: any) => ({
                        name: ex.name,
                        sets: ex.sets,
                        reps: ex.reps,
                        duration: ex.duration,
                        workoutPlanId: id
                    }))
                });
            }

            return tx.workoutPlan.findUnique({
                where: { id },
                include: { exercises: true }
            });
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
