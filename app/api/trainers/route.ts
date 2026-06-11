import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const trainers = await prisma.trainerProfile.findMany({
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        return NextResponse.json(trainers);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
