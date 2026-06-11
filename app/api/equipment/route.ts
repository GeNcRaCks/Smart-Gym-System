import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const equipment = await prisma.equipment.findMany();
    return NextResponse.json(equipment);
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { name, type, status } = await req.json();
        const equipment = await prisma.equipment.create({
            data: { name, type, status }
        });
        return NextResponse.json(equipment);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, name, type, status } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing equipment id' }, { status: 400 });
        }
        const equipment = await prisma.equipment.update({
            where: { id },
            data: { name, type, status }
        });
        return NextResponse.json(equipment);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await req.json();
        await prisma.equipment.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
