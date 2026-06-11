/**
 * End-to-End Member Journey Test
 *
 * Test Level: E2E Integration Testing
 * Test Types: Functional, State-Based, Flow-Based
 *
 * Flow Details:
 * 1. Register a new member profile
 * 2. Login to obtain session
 * 3. Retrieve available workouts
 * 4. Create a workout history record
 * 5. Retrieve member progress logs and verify matching records
 */

import { NextRequest } from 'next/server';

let users: any[] = [];
let memberProfiles: any[] = [];
let workoutPlans: any[] = [
    {
        id: 'wp1',
        name: 'HIIT Cardio Burner',
        description: 'High intensity cardio training',
        difficulty: 'Intermediate',
        duration: 30,
        exercises: [{ name: 'Jumping Jacks', sets: 3, reps: 20 }],
    },
    {
        id: 'wp2',
        name: 'Powerlifting Base',
        description: 'Strength base building',
        difficulty: 'Advanced',
        duration: 45,
        exercises: [{ name: 'Squats', sets: 5, reps: 5 }],
    }
];
let workoutRecords: any[] = [];
let currentSession: any = null;

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: async () => ({
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
    }),
}));

// Mock auth library
jest.mock('@/lib/auth', () => ({
    getSession: jest.fn(async () => currentSession),
    signJWT: jest.fn(async (payload) => 'signed-token-for-' + payload.id),
    hashPassword: jest.fn(async (pw) => 'hashed-' + pw),
    comparePassword: jest.fn(async (pw, hash) => hash === 'hashed-' + pw),
}));

// Mock prisma db
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(async ({ where: { email } }) => {
                return users.find((u) => u.email === email) || null;
            }),
            create: jest.fn(async ({ data }) => {
                const id = 'u-' + (users.length + 1);
                const newUser = { id, email: data.email, password: data.password, name: data.name, role: data.role };
                users.push(newUser);

                if (data.memberProfile?.create) {
                    memberProfiles.push({
                        id: 'mp-' + (memberProfiles.length + 1),
                        userId: id,
                        ...data.memberProfile.create,
                    });
                }
                return newUser;
            }),
        },
        memberProfile: {
            findUnique: jest.fn(async ({ where: { userId } }) => {
                return memberProfiles.find((p) => p.userId === userId) || null;
            }),
        },
        workoutPlan: {
            findMany: jest.fn(async () => {
                return workoutPlans;
            }),
        },
        workoutRecord: {
            create: jest.fn(async ({ data }) => {
                const id = 'wr-' + (workoutRecords.length + 1);
                const record = { id, ...data, date: new Date() };
                workoutRecords.push(record);
                return record;
            }),
            findMany: jest.fn(async ({ where }) => {
                if (where?.member?.userId) {
                    const profile = memberProfiles.find((p) => p.userId === where.member.userId);
                    if (!profile) return [];
                    return workoutRecords.filter((r) => r.memberId === profile.id);
                }
                return workoutRecords;
            }),
        },
    },
}));

import { POST as authPost } from '@/app/api/auth/[...routes]/route';
import { GET as workoutsGet } from '@/app/api/workouts/route';
import { POST as recordsPost, GET as recordsGet } from '@/app/api/records/route';
import { getSession } from '@/lib/auth';

function makeReq(url: string, method: string, body?: any) {
    const init: RequestInit = { method };
    if (body) {
        init.body = JSON.stringify(body);
        init.headers = { 'Content-Type': 'application/json' };
    }
    return new Request(url, init) as any;
}

describe('End-to-End Member Journey Flow', () => {
    beforeEach(() => {
        users = [];
        memberProfiles = [];
        workoutRecords = [];
        currentSession = null;
        jest.clearAllMocks();
    });

    test('should register, login, fetch plans, post workout record, and retrieve history', async () => {
        // ----------------------------------------------------
        // Step 1: Register a new member
        // ----------------------------------------------------
        const registerPayload = {
            name: 'John E2E',
            email: 'john@e2e.com',
            password: 'securepass123',
            role: 'MEMBER',
            profileData: {
                height: '180',
                weight: '75',
                level: 'Intermediate',
                membershipType: 'PREMIUM',
            },
        };

        const regReq = makeReq('http://localhost/api/auth/register', 'POST', registerPayload);
        const regRes = await authPost(regReq, { params: Promise.resolve({ routes: ['register'] }) });
        
        expect(regRes.status).toBe(200);
        const regData = await regRes.json();
        expect(regData.success).toBe(true);
        expect(regData.user.email).toBe('john@e2e.com');
        expect(users).toHaveLength(1);
        expect(memberProfiles).toHaveLength(1);
        expect(memberProfiles[0].level).toBe('Intermediate');

        // ----------------------------------------------------
        // Step 2: Login to set active session
        // ----------------------------------------------------
        const loginPayload = {
            email: 'john@e2e.com',
            password: 'securepass123',
        };

        const loginReq = makeReq('http://localhost/api/auth/login', 'POST', loginPayload);
        const loginRes = await authPost(loginReq, { params: Promise.resolve({ routes: ['login'] }) });
        
        expect(loginRes.status).toBe(200);
        const loginData = await loginRes.json();
        expect(loginData.success).toBe(true);
        
        // Simulating session storage in browser/cookies
        currentSession = {
            id: loginData.user.id,
            email: loginData.user.email,
            role: loginData.user.role,
        };

        // ----------------------------------------------------
        // Step 3: Get Workouts list
        // ----------------------------------------------------
        const getWorkoutsReq = makeReq('http://localhost/api/workouts', 'GET');
        const workoutsRes = await workoutsGet(getWorkoutsReq);
        
        expect(workoutsRes.status).toBe(200);
        const workoutsData = await workoutsRes.json();
        expect(workoutsData).toHaveLength(2);
        expect(workoutsData[0].name).toBe('HIIT Cardio Burner');

        // ----------------------------------------------------
        // Step 4: Log a workout record (Duration: 30 mins, 300 kcal burned)
        // ----------------------------------------------------
        const logPayload = {
            duration: 30,
            caloriesBurned: 300,
            notes: 'Completed HIIT Cardio Burner successfully!',
        };

        const logReq = makeReq('http://localhost/api/records', 'POST', logPayload);
        const logRes = await recordsPost(logReq);
        
        expect(logRes.status).toBe(200);
        const logData = await logRes.json();
        expect(logData.id).toBeDefined();
        expect(logData.duration).toBe(30);
        expect(logData.caloriesBurned).toBe(300);
        expect(workoutRecords).toHaveLength(1);

        // ----------------------------------------------------
        // Step 5: Fetch workout progress history
        // ----------------------------------------------------
        const historyReq = makeReq('http://localhost/api/records', 'GET');
        const historyRes = await recordsGet(historyReq);
        
        expect(historyRes.status).toBe(200);
        const historyData = await historyRes.json();
        expect(historyData).toHaveLength(1);
        expect(historyData[0].notes).toBe('Completed HIIT Cardio Burner successfully!');
    });

    test('should prevent unauthenticated progress logging', async () => {
        currentSession = null; // Unauthenticated

        const logPayload = { duration: 30, caloriesBurned: 300 };
        const logReq = makeReq('http://localhost/api/records', 'POST', logPayload);
        const logRes = await recordsPost(logReq);

        expect(logRes.status).toBe(401);
        const data = await logRes.json();
        expect(data.error).toBe('Unauthorized');
    });
});
