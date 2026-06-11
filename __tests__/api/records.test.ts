/**
 * API Tests for /api/records
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative
 *
 * Oracle Design:
 * - Expected value comparison: status codes (200, 401, 404, 500)
 * - API response validation: records ordered by date desc
 * - Invariant: only authenticated users can access records
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workoutRecord: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    memberProfile: { findUnique: jest.fn() },
  },
}))

import { GET, POST } from '@/app/api/records/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockGetSession = getSession as jest.Mock
const mockPrisma = prisma as any

function makeReq(method = 'GET', body?: any) {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new Request('http://localhost/api/records', init)
}

describe('Records API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // GET — Member workout records
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/records', () => {
    test('returns member records sorted by date desc', async () => {
      // Oracle: records are ordered newest-first
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const records = [
        { id: 'r1', date: '2025-01-15', duration: 45, caloriesBurned: 300 },
        { id: 'r2', date: '2025-01-14', duration: 30, caloriesBurned: 200 },
      ]
      mockPrisma.workoutRecord.findMany.mockResolvedValue(records)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(2)
      expect(data[0].id).toBe('r1') // Most recent first
    })

    test('returns empty array for member with no records', async () => {
      // Oracle: no records is valid, returns empty array
      mockGetSession.mockResolvedValue({ id: 'u-new', role: 'MEMBER' })
      mockPrisma.workoutRecord.findMany.mockResolvedValue([])

      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toEqual([])
    })

    test('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await GET(makeReq() as any)
      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // POST — Create workout record
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/records', () => {
    test('creates workout record successfully', async () => {
      // Oracle: valid record creation returns the new record
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      const record = { id: 'r-new', memberId: 'mp1', duration: 60, caloriesBurned: 500, notes: 'Great session' }
      mockPrisma.workoutRecord.create.mockResolvedValue(record)

      const res = await POST(makeReq('POST', { duration: 60, caloriesBurned: 500, notes: 'Great session' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.duration).toBe(60)
      expect(data.caloriesBurned).toBe(500)
    })

    test('returns 404 when member profile not found', async () => {
      // Oracle: missing profile is a client error
      mockGetSession.mockResolvedValue({ id: 'u-ghost', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue(null)

      const res = await POST(makeReq('POST', { duration: 30 }) as any)
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toContain('Member profile not found')
    })

    test('returns 401 when unauthenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await POST(makeReq('POST', { duration: 30 }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 on database error (negative)', async () => {
      // Oracle: unexpected errors are caught and returned as 500
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.workoutRecord.create.mockRejectedValue(new Error('DB write failed'))

      const res = await POST(makeReq('POST', { duration: 30 }) as any)
      expect(res.status).toBe(500)
    })

    test('creates record with null optional fields (boundary)', async () => {
      // Oracle: duration, caloriesBurned, notes are all optional
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.workoutRecord.create.mockResolvedValue({
        id: 'r-min', memberId: 'mp1', duration: undefined, caloriesBurned: undefined, notes: undefined
      })

      const res = await POST(makeReq('POST', {}) as any)
      expect(res.status).toBe(200)
    })
  })
})
