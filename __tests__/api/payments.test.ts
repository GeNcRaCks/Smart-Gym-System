/**
 * API Tests for /api/payments
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative, State-Based
 *
 * Oracle Design:
 * - Expected value comparison: status codes and payment status values
 * - Invariant: JAZZCASH/BANK_TRANSFER → PENDING; CREDIT_CARD → COMPLETED
 * - State validation: payment status transitions via PATCH
 * - API response validation: JSON body includes amount, method, status
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    memberProfile: { findUnique: jest.fn() },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}))

import { POST, GET, PATCH } from '@/app/api/payments/route'
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
  return new Request('http://localhost/api/payments', init)
}

describe('Payments API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // POST — Create Payment
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/payments', () => {
    test('CREDIT_CARD payment is auto-COMPLETED', async () => {
      // Oracle: CREDIT_CARD method should result in COMPLETED status
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.payment.create.mockResolvedValue({
        id: 'p1', memberId: 'mp1', amount: 50, method: 'CREDIT_CARD', status: 'COMPLETED', reference: null
      })

      const res = await POST(makeReq('POST', { amount: 50, method: 'CREDIT_CARD' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('COMPLETED')
      expect(data.amount).toBe(50)
    })

    test('JAZZCASH payment is auto-PENDING (boundary)', async () => {
      // Oracle: JazzCash requires admin verification, so status is PENDING
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.payment.create.mockResolvedValue({
        id: 'p2', memberId: 'mp1', amount: 100, method: 'JAZZCASH', status: 'PENDING', reference: 'txn-123'
      })

      const res = await POST(makeReq('POST', { amount: 100, method: 'JAZZCASH', details: { txId: 'txn-123' } }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('PENDING')
      expect(data.reference).toBe('txn-123')
    })

    test('BANK_TRANSFER payment is auto-PENDING (boundary)', async () => {
      // Oracle: bank transfers require verification → PENDING
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.payment.create.mockResolvedValue({
        id: 'p3', memberId: 'mp1', amount: 200, method: 'BANK_TRANSFER', status: 'PENDING', reference: null
      })

      const res = await POST(makeReq('POST', { amount: 200, method: 'BANK_TRANSFER' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('PENDING')
    })

    test('rejects unauthenticated with 401', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await POST(makeReq('POST', { amount: 50, method: 'CASH' }) as any)
      expect(res.status).toBe(401)
    })

    test('rejects non-MEMBER with 401', async () => {
      // Oracle: only MEMBER role can make payments
      mockGetSession.mockResolvedValue({ id: 'u2', role: 'ADMIN' })
      const res = await POST(makeReq('POST', { amount: 50, method: 'CASH' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 404 when member profile not found', async () => {
      mockGetSession.mockResolvedValue({ id: 'u-ghost', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue(null)

      const res = await POST(makeReq('POST', { amount: 50, method: 'CASH' }) as any)
      expect(res.status).toBe(404)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // GET — Role-based payment retrieval
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/payments', () => {
    test('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await GET(makeReq() as any)
      expect(res.status).toBe(401)
    })

    test('ADMIN sees all payments', async () => {
      // Oracle: admin gets full payment list with member info
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const payments = [{ id: 'p1', amount: 50 }, { id: 'p2', amount: 100 }]
      mockPrisma.payment.findMany.mockResolvedValue(payments)

      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toHaveLength(2)
    })

    test('MEMBER sees only their payments', async () => {
      // Oracle: member sees only own payments
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.payment.findMany.mockResolvedValue([{ id: 'p1', amount: 50 }])

      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toHaveLength(1)
    })

    test('TRAINER gets empty array', async () => {
      // Oracle: trainer role has no payment access
      mockGetSession.mockResolvedValue({ id: 'u2', role: 'TRAINER' })
      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // PATCH — Admin status update
  // ═══════════════════════════════════════════════════════════════
  describe('PATCH /api/payments', () => {
    test('admin updates payment status successfully', async () => {
      // Oracle: admin can change payment status (e.g., PENDING → COMPLETED)
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.payment.update.mockResolvedValue({ id: 'p1', status: 'COMPLETED' })

      const res = await PATCH(makeReq('PATCH', { id: 'p1', status: 'COMPLETED' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('COMPLETED')
    })

    test('rejects non-ADMIN with 401', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await PATCH(makeReq('PATCH', { id: 'p1', status: 'COMPLETED' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 400 for invalid payload (missing id or status)', async () => {
      // Oracle: both id and status are required
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })

      const res1 = await PATCH(makeReq('PATCH', { status: 'COMPLETED' }) as any)
      expect(res1.status).toBe(400)

      const res2 = await PATCH(makeReq('PATCH', { id: 'p1' }) as any)
      expect(res2.status).toBe(400)
    })
  })
})
