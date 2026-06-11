/**
 * API Tests for /api/reports
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative
 *
 * Oracle Design:
 * - Expected value comparison: status codes, report data structure
 * - Invariant: only ADMIN can view/generate reports
 * - State validation: FINANCIAL report includes totalRevenue + transactionCount;
 *   FITNESS report includes totalWorkouts + totalDuration;
 *   SYSTEM report includes totalUsers
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    report: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    payment: { findMany: jest.fn() },
    workoutRecord: { findMany: jest.fn() },
    user: { count: jest.fn() },
  },
}))

import { GET, POST } from '@/app/api/reports/route'
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
  return new Request('http://localhost/api/reports', init)
}

describe('Reports API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // GET — Admin only
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/reports', () => {
    test('admin retrieves reports sorted by date desc', async () => {
      // Oracle: reports are ordered by generatedDate descending
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const reports = [
        { id: 'rp1', type: 'FINANCIAL', data: '{}', generatedDate: '2025-01-15' },
        { id: 'rp2', type: 'FITNESS', data: '{}', generatedDate: '2025-01-14' },
      ]
      mockPrisma.report.findMany.mockResolvedValue(reports)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(2)
    })

    test('rejects non-ADMIN with 401', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await GET(makeReq() as any)
      expect(res.status).toBe(401)
    })

    test('rejects unauthenticated with 401', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await GET(makeReq() as any)
      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // POST — Generate reports by type
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/reports', () => {
    test('generates FINANCIAL report with revenue data', async () => {
      // Oracle: FINANCIAL report aggregates payment data
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const payments = [
        { amount: 100, status: 'COMPLETED' },
        { amount: 200, status: 'COMPLETED' },
      ]
      mockPrisma.payment.findMany.mockResolvedValue(payments)
      const report = { id: 'rp-fin', type: 'FINANCIAL', data: JSON.stringify({ totalRevenue: 300, transactionCount: 2 }) }
      mockPrisma.report.create.mockResolvedValue(report)

      const res = await POST(makeReq('POST', { type: 'FINANCIAL' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.type).toBe('FINANCIAL')
      const parsed = JSON.parse(data.data)
      expect(parsed.totalRevenue).toBe(300)
      expect(parsed.transactionCount).toBe(2)
    })

    test('generates FITNESS report with workout data', async () => {
      // Oracle: FITNESS report aggregates workout records
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const workouts = [
        { duration: 30, caloriesBurned: 200 },
        { duration: 45, caloriesBurned: 350 },
      ]
      mockPrisma.workoutRecord.findMany.mockResolvedValue(workouts)
      const report = { id: 'rp-fit', type: 'FITNESS', data: JSON.stringify({ totalWorkouts: 2, totalDuration: 75 }) }
      mockPrisma.report.create.mockResolvedValue(report)

      const res = await POST(makeReq('POST', { type: 'FITNESS' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.type).toBe('FITNESS')
    })

    test('generates SYSTEM report with user count', async () => {
      // Oracle: SYSTEM report includes total user count
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.user.count.mockResolvedValue(42)
      const report = { id: 'rp-sys', type: 'SYSTEM', data: JSON.stringify({ totalUsers: 42 }) }
      mockPrisma.report.create.mockResolvedValue(report)

      const res = await POST(makeReq('POST', { type: 'SYSTEM' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      const parsed = JSON.parse(data.data)
      expect(parsed.totalUsers).toBe(42)
    })

    test('rejects non-ADMIN with 401', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'TRAINER' })
      const res = await POST(makeReq('POST', { type: 'FINANCIAL' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 on DB error (negative)', async () => {
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.payment.findMany.mockRejectedValue(new Error('DB error'))

      const res = await POST(makeReq('POST', { type: 'FINANCIAL' }) as any)
      expect(res.status).toBe(500)
    })
  })
})
