import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, signJWT, verifyJWT, getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ routes: string[] }> }) {
    const { routes } = await params;
    const action = routes[0];

    try {
        if (action === 'register') {
            const { email, password, name, phone, role, profileData } = await req.json();

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            const hashedPassword = await hashPassword(password);

            // Create User with Profile
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    phone,
                    role: role || 'MEMBER', // Default to MEMBER
                    // Create relevant profile based on role
                    memberProfile: role === 'MEMBER' ? {
                        create: {
                            height: profileData.height ? parseFloat(profileData.height) : undefined,
                            weight: profileData.weight ? parseFloat(profileData.weight) : undefined,
                            level: profileData.level,
                            membershipType: profileData.membershipType || 'BASIC'
                        }
                    } : undefined,
                    trainerProfile: role === 'TRAINER' ? {
                        create: {
                            specialty: profileData.specialty || 'General Fitness',
                            availability: profileData.availability || 'Mon-Fri 9-5',
                            rating: 5.0
                        }
                    } : undefined,
                    adminProfile: role === 'ADMIN' ? { create: { accessLevel: 1 } } : undefined,
                },
            });

            return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
        }

        if (action === 'login') {
            const { email, password } = await req.json();

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const isValid = await comparePassword(password, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const token = await signJWT({ id: user.id, email: user.email, role: user.role });

            const cookieStore = await cookies();
            cookieStore.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24, // 1 day
            });

            return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
        }

        if (action === 'logout') {
            const cookieStore = await cookies();
            cookieStore.delete('auth_token');
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 404 });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ routes: string[] }> }) {
    const { routes } = await params;
    const action = routes[0];

    if (action === 'me') {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ user: null });
        }

        // Fetch full user details if needed, or just return session info
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            include: {
                memberProfile: true,
                trainerProfile: true,
                adminProfile: true
            }
        });

        if (!user) return NextResponse.json({ user: null });

        // Exclude password
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 404 });
}
