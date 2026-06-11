/**
 * End-to-End Admin Management Test
 *
 * Test Level: E2E Integration Testing
 * Test Types: Functional, State-Based, Flow-Based
 *
 * Flow Details:
 * 1. Seed initial users (Member, Trainer, Admin)
 * 2. Login as Admin
 * 3. Retrieve and list all users (verify user list length and roles)
 * 4. Create new gym equipment (POST /api/equipment)
 * 5. Retrieve equipment list to verify creation
 * 6. Generate a system report (POST /api/reports)
 * 7. Retrieve global system statistics (GET /api/stats) and verify counts
 */

import { NextRequest } from 'next/server';

let users: any[] = [];
let equipmentList: any[] = [];
let reports: any[] = [];
let payments: any[] = [];
let workoutRecords: any[] = [];
let bookings: any[] = [];
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
            findMany: jest.fn(async () => {
                return users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }));
            }),
            count: jest.fn(async (args) => {
                if (args?.where?.role) {
                    return users.filter(u => u.role === args.where.role).length;
                }
                return users.length;
            }),
        },
        equipment: {
            create: jest.fn(async ({ data }) => {
                const id = 'eq-' + (equipmentList.length + 1);
                const eq = { id, ...data };
                equipmentList.push(eq);
                return eq;
            }),
            findMany: jest.fn(async () => {
                return equipmentList;
            }),
        },
        payment: {
            findMany: jest.fn(async () => {
                return payments;
            }),
            aggregate: jest.fn(async () => {
                const sum = payments.reduce((acc, curr) => acc + curr.amount, 0);
                return { _sum: { amount: sum } };
            }),
        },
        workoutRecord: {
            findMany: jest.fn(async () => {
                return workoutRecords;
            }),
        },
        booking: {
            count: jest.fn(async () => {
                return bookings.length;
            }),
        },
        report: {
            create: jest.fn(async ({ data }) => {
                const id = 'rep-' + (reports.length + 1);
                const rep = { id, ...data, generatedDate: new Date() };
                reports.push(rep);
                return rep;
            }),
            findMany: jest.fn(async () => {
                return reports;
            }),
        },
    },
}));

import { GET as usersGet } from '@/app/api/users/route';
import { POST as equipmentPost, GET as equipmentGet } from '@/app/api/equipment/route';
import { POST as reportsPost, GET as reportsGet } from '@/app/api/reports/route';
import { GET as statsGet } from '@/app/api/stats/route';

function makeReq(url: string, method: string, body?: any) {
    const init: RequestInit = { method };
    if (body) {
        init.body = JSON.stringify(body);
        init.headers = { 'Content-Type': 'application/json' };
    }
    return new Request(url, init) as any;
}

describe('End-to-End Admin Management Flow', () => {
    beforeEach(() => {
        users = [
            { id: 'u-admin', name: 'Super Admin', email: 'admin@gym.com', password: 'hashed-admin', role: 'ADMIN', createdAt: new Date() },
            { id: 'u-trainer', name: 'Trainer Mike', email: 'mike@gym.com', password: 'hashed-trainer', role: 'TRAINER', createdAt: new Date() },
            { id: 'u-member', name: 'Member Jane', email: 'jane@gym.com', password: 'hashed-member', role: 'MEMBER', createdAt: new Date() },
        ];
        equipmentList = [];
        reports = [];
        payments = [{ id: 'p1', amount: 50 }, { id: 'p2', amount: 100 }];
        workoutRecords = [];
        bookings = [];
        currentSession = null;
        jest.clearAllMocks();
    });

    test('should authenticate admin, list users, manage equipment, generate reports, and fetch stats', async () => {
        // ----------------------------------------------------
        // Step 1: Admin Login (simulate session setting)
        // ----------------------------------------------------
        currentSession = {
            id: 'u-admin',
            email: 'admin@gym.com',
            role: 'ADMIN',
        };

        // ----------------------------------------------------
        // Step 2: List all users and verify roles
        // ----------------------------------------------------
        const usersReq = makeReq('http://localhost/api/users', 'GET');
        const usersRes = await usersGet(usersReq);
        
        expect(usersRes.status).toBe(200);
        const usersData = await usersRes.json();
        expect(usersData).toHaveLength(3);
        expect(usersData.map((u: any) => u.role)).toContain('ADMIN');
        expect(usersData.map((u: any) => u.role)).toContain('TRAINER');
        expect(usersData.map((u: any) => u.role)).toContain('MEMBER');

        // ----------------------------------------------------
        // Step 3: Add new gym equipment
        // ----------------------------------------------------
        const newEqPayload = {
            name: 'Pro Treadmill T80',
            type: 'Cardio',
            status: 'OPERATIONAL',
        };

        const eqReq = makeReq('http://localhost/api/equipment', 'POST', newEqPayload);
        const eqRes = await equipmentPost(eqReq);
        
        expect(eqRes.status).toBe(200);
        const eqData = await eqRes.json();
        expect(eqData.id).toBeDefined();
        expect(eqData.name).toBe('Pro Treadmill T80');
        expect(equipmentList).toHaveLength(1);

        // ----------------------------------------------------
        // Step 4: Verify equipment in catalog
        // ----------------------------------------------------
        const getEqReq = makeReq('http://localhost/api/equipment', 'GET');
        const getEqRes = await equipmentGet(getEqReq);
        
        expect(getEqRes.status).toBe(200);
        const getEqData = await getEqRes.json();
        expect(getEqData).toHaveLength(1);
        expect(getEqData[0].name).toBe('Pro Treadmill T80');

        // ----------------------------------------------------
        // Step 5: Generate a Financial System Report
        // ----------------------------------------------------
        const repPayload = { type: 'FINANCIAL' };
        const repReq = makeReq('http://localhost/api/reports', 'POST', repPayload);
        const repRes = await reportsPost(repReq);

        expect(repRes.status).toBe(200);
        const repData = await repRes.json();
        expect(repData.id).toBeDefined();
        expect(repData.type).toBe('FINANCIAL');
        
        // Check report data logic (total Revenue = 50 + 100 = 150)
        const parsedReportData = JSON.parse(repData.data);
        expect(parsedReportData.totalRevenue).toBe(150);
        expect(parsedReportData.transactionCount).toBe(2);

        // ----------------------------------------------------
        // Step 6: Verify global statistics dashboard counters
        // ----------------------------------------------------
        const statsReq = makeReq('http://localhost/api/stats', 'GET');
        const statsRes = await statsGet(statsReq);

        expect(statsRes.status).toBe(200);
        const statsData = await statsRes.json();
        expect(statsData.totalUsers).toBe(3);
        expect(statsData.activeMembers).toBe(1);
        expect(statsData.trainers).toBe(1);
        expect(statsData.totalRevenue).toBe(150);
    });

    test('should restrict non-admin access to listing users', async () => {
        // Member Session
        currentSession = { id: 'u-member', email: 'jane@gym.com', role: 'MEMBER' };

        const usersReq = makeReq('http://localhost/api/users', 'GET');
        const usersRes = await usersGet(usersReq);

        expect(usersRes.status).toBe(401);
        const data = await usersRes.json();
        expect(data.error).toBe('Unauthorized');
    });
});
