import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { credential } = await req.json();

        if (!credential) {
            return NextResponse.json({ error: 'Google credential is required' }, { status: 400 });
        }

        // Verify the Google ID token by calling Google's tokeninfo endpoint
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!googleRes.ok) {
            return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
        }

        const googleUser = await googleRes.json();
        const { email, name, sub: googleId } = googleUser;

        if (!email) {
            return NextResponse.json({ error: 'Could not retrieve email from Google account' }, { status: 400 });
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: {
                memberProfile: true,
                trainerProfile: true,
                adminProfile: true,
            }
        });

        if (!user) {
            // Create a new user with Google auth (no password)
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    password: null, // Google users don't have a password
                    role: 'MEMBER',
                    memberProfile: {
                        create: {
                            membershipType: 'BASIC',
                            level: 'Beginner',
                        }
                    }
                },
                include: {
                    memberProfile: true,
                    trainerProfile: true,
                    adminProfile: true,
                }
            });
        }

        // Sign JWT and set cookie
        const token = await signJWT({ id: user.id, email: user.email, role: user.role });

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (error: any) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ error: error.message || 'Google authentication failed' }, { status: 500 });
    }
}
