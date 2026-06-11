/**
 * API Tests for /api/equipment
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative, State-Based
 *
 * Oracle Design:
 * - Expected value comparison: status codes (200, 400, 401, 500)
 * - Invariant: only ADMIN can create/update/delete equipment
 * - State validation: equipment status lifecycle (Operational → Maintenance → Operational)
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    equipment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { GET, POST, PUT, DELETE } from '@/app/api/equipment/route'
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
  return new Request('http://localhost/api/equipment', init)
}

describe('Equipment API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // GET — No auth required
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/equipment', () => {
    test('returns all equipment (public endpoint)', async () => {
      // Oracle: GET is publicly accessible; returns full equipment list
      const list = [
        { id: 'e1', name: 'Treadmill', type: 'Cardio', status: 'Operational' },
        { id: 'e2', name: 'Bench Press', type: 'Strength', status: 'Maintenance' },
      ]
      mockPrisma.equipment.findMany.mockResolvedValue(list)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Treadmill')
    })

    test('returns empty array when no equipment exists', async () => {
      // Oracle: empty DB returns empty array, not error
      mockPrisma.equipment.findMany.mockResolvedValue([])
      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // POST — Admin only
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/equipment', () => {
    test('admin creates equipment successfully', async () => {
      // Oracle: valid admin request returns created equipment
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const eq = { id: 'e-new', name: 'Rowing Machine', type: 'Cardio', status: 'Operational' }
      mockPrisma.equipment.create.mockResolvedValue(eq)

      const res = await POST(makeReq('POST', { name: 'Rowing Machine', type: 'Cardio', status: 'Operational' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Rowing Machine')
    })

    test('rejects non-ADMIN with 401', async () => {
      // Oracle: RBAC — MEMBER cannot create equipment
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await POST(makeReq('POST', { name: 'Test', type: 'Cardio', status: 'Operational' }) as any)
      expect(res.status).toBe(401)
    })

    test('rejects unauthenticated with 401', async () => {
      // Oracle: no session → 401
      mockGetSession.mockResolvedValue(null)
      const res = await POST(makeReq('POST', { name: 'Test', type: 'Cardio', status: 'Operational' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 on DB error (negative)', async () => {
      // Oracle: database errors result in 500
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.equipment.create.mockRejectedValue(new Error('Constraint violation'))

      const res = await POST(makeReq('POST', { name: '', type: '', status: '' }) as any)
      expect(res.status).toBe(500)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // PUT — Admin only, boundary: missing id
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/equipment', () => {
    test('admin updates equipment successfully', async () => {
      // Oracle: valid update returns updated equipment
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.equipment.update.mockResolvedValue({
        id: 'e1', name: 'Treadmill Pro', type: 'Cardio', status: 'Operational'
      })

      const res = await PUT(makeReq('PUT', { id: 'e1', name: 'Treadmill Pro', type: 'Cardio', status: 'Operational' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Treadmill Pro')
    })

    test('returns 400 when id is missing (boundary)', async () => {
      // Oracle: missing equipment id is a client error
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      const res = await PUT(makeReq('PUT', { name: 'Test', type: 'Cardio', status: 'Operational' }) as any)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Missing equipment id')
    })

    test('rejects non-ADMIN with 401', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'TRAINER' })
      const res = await PUT(makeReq('PUT', { id: 'e1', status: 'Maintenance' }) as any)
      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // DELETE — Admin only
  // ═══════════════════════════════════════════════════════════════
  describe('DELETE /api/equipment', () => {
    test('admin deletes equipment successfully', async () => {
      // Oracle: successful delete returns { success: true }
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.equipment.delete.mockResolvedValue({ id: 'e1' })

      const res = await DELETE(makeReq('DELETE', { id: 'e1' }) as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    test('rejects non-ADMIN with 401', async () => {
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await DELETE(makeReq('DELETE', { id: 'e1' }) as any)
      expect(res.status).toBe(401)
    })

    test('returns 500 for non-existent equipment (negative)', async () => {
      // Oracle: deleting non-existent record propagates DB error
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })
      mockPrisma.equipment.delete.mockRejectedValue(new Error('Record not found'))

      const res = await DELETE(makeReq('DELETE', { id: 'ghost-id' }) as any)
      expect(res.status).toBe(500)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // State-Based: Equipment lifecycle
  // ═══════════════════════════════════════════════════════════════
  describe('State-Based: Equipment lifecycle', () => {
    test('Operational → Maintenance → Operational', async () => {
      // Oracle: equipment status must reflect each transition accurately
      mockGetSession.mockResolvedValue({ id: 'admin1', role: 'ADMIN' })

      // Step 1: Set to Maintenance
      mockPrisma.equipment.update.mockResolvedValue({ id: 'e1', status: 'Maintenance' })
      const r1 = await PUT(makeReq('PUT', { id: 'e1', status: 'Maintenance' }) as any)
      const d1 = await r1.json()
      expect(d1.status).toBe('Maintenance')

      // Step 2: Restore to Operational
      mockPrisma.equipment.update.mockResolvedValue({ id: 'e1', status: 'Operational' })
      const r2 = await PUT(makeReq('PUT', { id: 'e1', status: 'Operational' }) as any)
      const d2 = await r2.json()
      expect(d2.status).toBe('Operational')
    })
  })
})
