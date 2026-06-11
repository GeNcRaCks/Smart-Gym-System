/**
 * API Tests for /api/users
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative, State-Based
 *
 * Oracle Design:
 * - Expected value comparison: status codes (200, 400, 401, 403, 500)
 * - Invariant: only ADMIN can list/delete users; admin cannot self-delete
 * - State validation: profile fields updated correctly per role
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    memberProfile: { update: jest.fn() },
    trainerProfile: { update: jest.fn() },
  },
}))

import { GET, PUT, DELETE } from '@/app/api/users/route'
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
  return new Request('http://localhost/api/users', init)
}

describe('Users API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // GET — Admin only
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/users', () => {
    test('admin retrieves user list successfully', async () => {
      // Oracle: admin sees all users with selected fields
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const users = [
        { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'MEMBER', createdAt: '2025-01-01' },
        { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'TRAINER', createdAt: '2025-01-02' },
      ]
      mockPrisma.user.findMany.mockResolvedValue(users)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Alice')
    })

    test('rejects non-ADMIN with 401', async () => {
      // Oracle: RBAC — only ADMIN can list users
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
  // PUT — Role-specific profile updates
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/users', () => {
    test('MEMBER updates own profile (height, weight, level)', async () => {
      // Oracle: member can update fitness profile fields
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.update.mockResolvedValue({ id: 'mp1', height: 180, weight: 75, level: 'Intermediate' })

      const res = await PUT(makeReq('PUT', { height: 180, weight: 75, level: 'Intermediate' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.height).toBe(180)
      expect(data.weight).toBe(75)
    })

    test('TRAINER updates own profile (specialty, availability)', async () => {
      // Oracle: trainer can update professional profile
      mockGetSession.mockResolvedValue({ id: 'u2', role: 'TRAINER' })
      mockPrisma.trainerProfile.update.mockResolvedValue({ id: 'tp1', specialty: 'HIIT', availability: 'Mon-Sat' })

      const res = await PUT(makeReq('PUT', { specialty: 'HIIT', availability: 'Mon-Sat' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.specialty).toBe('HIIT')
    })

    test('ADMIN PUT returns 400 (not implemented)', async () => {
      // Oracle: admin profile update is not implemented
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const res = await PUT(makeReq('PUT', {}) as any)
      expect(res.status).toBe(400)
    })

    test('unauthenticated PUT returns 401', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await PUT(makeReq('PUT', {}) as any)
      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // DELETE — Admin only, self-delete prevention
  // ═══════════════════════════════════════════════════════════════
  describe('DELETE /api/users', () => {
    test('admin deletes another user successfully', async () => {
      // Oracle: successful deletion returns { success: true }
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.user.delete.mockResolvedValue({ id: 'u2' })

      const res = await DELETE(makeReq('DELETE', { id: 'u2' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    test('admin cannot delete themselves (403)', async () => {
      // Oracle: invariant — admin self-deletion is prevented
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const res = await DELETE(makeReq('DELETE', { id: 'admin1' }) as any)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toContain('Cannot delete')
    })

    test('returns 400 when id is missing (boundary)', async () => {
      // Oracle: missing id parameter is a client error
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const res = await DELETE(makeReq('DELETE', {}) as any)
      expect(res.status).toBe(400)
    })

    test('rejects non-ADMIN with 401', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await DELETE(makeReq('DELETE', { id: 'u2' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 for non-existent user (negative)', async () => {
      // Oracle: DB error on missing record propagates as 500
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.user.delete.mockRejectedValue(new Error('Record not found'))

      const res = await DELETE(makeReq('DELETE', { id: 'ghost' }) as any)
      expect(res.status).toBe(500)
    })
  })
})
