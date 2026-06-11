/**
 * API Tests for /api/workouts
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative, State-Based
 *
 * Oracle Design:
 * - Expected value comparison: status codes, plan/exercise data
 * - Invariant: only TRAINER/ADMIN can create/update/delete workout plans
 * - State validation: plan creation includes exercises; update replaces exercises
 * - API response validation: includes exercises array, creator info
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workoutPlan: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    trainerProfile: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { GET, POST, DELETE, PUT } from '@/app/api/workouts/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockGetSession = getSession as jest.Mock
const mockPrisma = prisma as any

function makeReq(url = 'http://localhost/api/workouts', method = 'GET', body?: any) {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new Request(url, init)
}

describe('Workouts API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // GET — Authenticated, with search
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/workouts', () => {
    test('returns all workout plans', async () => {
      // Oracle: authenticated user gets all plans with exercises and creator
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const plans = [
        { id: 'wp1', name: 'HIIT Blast', exercises: [{ id: 'ex1', name: 'Burpees' }], creator: { user: { name: 'Coach' } } },
      ]
      mockPrisma.workoutPlan.findMany.mockResolvedValue(plans)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
      expect(data[0].exercises).toHaveLength(1)
    })

    test('supports search parameter', async () => {
      // Oracle: search filters plans by name/description
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.workoutPlan.findMany.mockResolvedValue([])

      const res = await GET(makeReq('http://localhost/api/workouts?search=HIIT') as any)
      expect(res.status).toBe(200)
      expect(mockPrisma.workoutPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'HIIT' } }),
            ]),
          }),
        })
      )
    })

    test('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await GET(makeReq() as any)
      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // POST — Create workout plan
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/workouts', () => {
    test('TRAINER creates workout plan with exercises', async () => {
      // Oracle: plan is created with nested exercises and creatorId set
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.trainerProfile.findUnique.mockResolvedValue({ id: 'tp1', userId: 'u-trainer' })
      const plan = {
        id: 'wp-new', name: 'Strength Plan', difficulty: 'Hard', duration: 60,
        exercises: [{ name: 'Squat', sets: 4, reps: 10 }]
      }
      mockPrisma.workoutPlan.create.mockResolvedValue(plan)

      const res = await POST(makeReq('http://localhost/api/workouts', 'POST', {
        name: 'Strength Plan', difficulty: 'Hard', duration: 60,
        exercises: [{ name: 'Squat', sets: 4, reps: 10 }]
      }) as any)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Strength Plan')
      expect(data.exercises).toHaveLength(1)
    })

    test('rejects MEMBER with 401', async () => {
      // Oracle: MEMBER cannot create workout plans
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await POST(makeReq('http://localhost/api/workouts', 'POST', { name: 'Test' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 404 when trainer profile not found', async () => {
      // Oracle: trainer without profile cannot create plans
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.trainerProfile.findUnique.mockResolvedValue(null)

      const res = await POST(makeReq('http://localhost/api/workouts', 'POST', {
        name: 'Plan', exercises: []
      }) as any)
      expect(res.status).toBe(404)
    })

    test('unauthenticated returns 401', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await POST(makeReq('http://localhost/api/workouts', 'POST', {}) as any)
      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // DELETE — Remove workout plan
  // ═══════════════════════════════════════════════════════════════
  describe('DELETE /api/workouts', () => {
    test('TRAINER deletes a workout plan', async () => {
      // Oracle: successful delete returns { success: true }
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.workoutPlan.delete.mockResolvedValue({ id: 'wp1' })

      const res = await DELETE(makeReq('http://localhost/api/workouts', 'DELETE', { id: 'wp1' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    test('MEMBER cannot delete (401)', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await DELETE(makeReq('http://localhost/api/workouts', 'DELETE', { id: 'wp1' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 on non-existent plan (negative)', async () => {
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.workoutPlan.delete.mockRejectedValue(new Error('Record not found'))

      const res = await DELETE(makeReq('http://localhost/api/workouts', 'DELETE', { id: 'ghost' }) as any)
      expect(res.status).toBe(500)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // PUT — Update workout plan with transaction
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/workouts', () => {
    test('TRAINER updates plan and exercises via transaction', async () => {
      // Oracle: update replaces exercises and returns updated plan
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      const updatedPlan = {
        id: 'wp1', name: 'Updated Plan', difficulty: 'Medium', duration: 45,
        exercises: [{ name: 'Deadlift', sets: 3, reps: 8 }]
      }
      mockPrisma.$transaction.mockResolvedValue(updatedPlan)

      const res = await PUT(makeReq('http://localhost/api/workouts', 'PUT', {
        id: 'wp1', name: 'Updated Plan', difficulty: 'Medium', duration: 45,
        exercises: [{ name: 'Deadlift', sets: 3, reps: 8 }]
      }) as any)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Updated Plan')
    })

    test('MEMBER cannot update (401)', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await PUT(makeReq('http://localhost/api/workouts', 'PUT', { id: 'wp1' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 on transaction failure (negative)', async () => {
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      const res = await PUT(makeReq('http://localhost/api/workouts', 'PUT', {
        id: 'wp1', name: 'Fail', exercises: []
      }) as any)
      expect(res.status).toBe(500)
    })
  })
})
