import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export async function signJWT(payload: any, expiresIn: string = '1d'): Promise<string> {
    const alg = 'HS256';
    return new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setExpirationTime(expiresIn)
        .sign(secret);
}

export async function verifyJWT(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
}
