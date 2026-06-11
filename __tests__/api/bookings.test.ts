/**
 * API Tests for /api/bookings
 *
 * Test Level: API Testing
 * Test Types: Functional, Boundary, Negative, State-Based
 *
 * Oracle Design:
 * - Expected value comparison: HTTP status codes (200, 401, 403, 409, 500)
 * - State validation: booking status transitions (PENDING → CONFIRMED → CANCELLED)
 * - API response validation: JSON body schema, error messages
 * - Invariant: only MEMBER can create bookings; only TRAINER can update status
 */

jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    memberProfile: {
      findUnique: jest.fn(),
    },
  },
}))

import { GET, POST, PUT } from '@/app/api/bookings/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockGetSession = getSession as jest.Mock
const mockPrisma = prisma as any

function makeReq(url = 'http://localhost/api/bookings', method = 'GET', body?: any) {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new Request(url, init)
}

describe('Bookings API', () => {
  beforeEach(() => jest.clearAllMocks())

  // ═══════════════════════════════════════════════════════════════
  // GET — Functional Tests
  // ═══════════════════════════════════════════════════════════════
  describe('GET /api/bookings', () => {
    test('returns 401 when not authenticated', async () => {
      // Oracle: unauthenticated request must be rejected
      mockGetSession.mockResolvedValue(null)
      const res = await GET(makeReq() as any)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Unauthorized')
    })

    test('returns member bookings for MEMBER role', async () => {
      // Oracle: response contains only the requesting member's bookings
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const bookings = [{ id: 'b1', memberId: 'mp1', status: 'PENDING' }]
      mockPrisma.booking.findMany.mockResolvedValue(bookings)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('b1')
    })

    test('returns trainer bookings for TRAINER role', async () => {
      // Oracle: response contains bookings assigned to the trainer
      mockGetSession.mockResolvedValue({ id: 'u2', role: 'TRAINER' })
      const bookings = [{ id: 'b2', trainerId: 'tp1', status: 'CONFIRMED' }]
      mockPrisma.booking.findMany.mockResolvedValue(bookings)

      const res = await GET(makeReq() as any)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
    })

    test('returns all bookings for ADMIN role', async () => {
      // Oracle: admin sees all bookings regardless of ownership
      mockGetSession.mockResolvedValue({ id: 'u3', role: 'ADMIN' })
      const bookings = [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }]
      mockPrisma.booking.findMany.mockResolvedValue(bookings)

      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toHaveLength(3)
    })

    test('returns empty array for unknown role', async () => {
      // Oracle: unrecognized roles get no data
      mockGetSession.mockResolvedValue({ id: 'u4', role: 'UNKNOWN' })
      const res = await GET(makeReq() as any)
      const data = await res.json()
      expect(data).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // POST — Functional + Boundary + Negative Tests
  // ═══════════════════════════════════════════════════════════════
  describe('POST /api/bookings', () => {
    test('creates booking successfully for MEMBER', async () => {
      // Oracle: valid booking returns the created booking object with PENDING status
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1', userId: 'u1' })
      mockPrisma.booking.findFirst.mockResolvedValue(null) // No duplicate
      const created = { id: 'b-new', memberId: 'mp1', trainerId: 't1', status: 'PENDING', date: '2025-01-15', timeSlot: '10:00-11:00' }
      mockPrisma.booking.create.mockResolvedValue(created)

      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', {
        trainerId: 't1', date: '2025-01-15', timeSlot: '10:00-11:00', type: 'IN_PERSON'
      }) as any)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe('b-new')
      expect(data.status).toBe('PENDING')
    })

    test('rejects with 401 when not authenticated', async () => {
      // Oracle: unauthenticated POST is forbidden
      mockGetSession.mockResolvedValue(null)
      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', {}) as any)
      expect(res.status).toBe(401)
    })

    test('rejects with 401 when role is not MEMBER', async () => {
      // Oracle: only MEMBER can create bookings (RBAC invariant)
      mockGetSession.mockResolvedValue({ id: 'u2', role: 'TRAINER' })
      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', {}) as any)
      expect(res.status).toBe(401)
    })

    test('returns 404 when member profile not found', async () => {
      // Oracle: missing profile is a client error
      mockGetSession.mockResolvedValue({ id: 'u-ghost', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue(null)

      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', {
        trainerId: 't1', date: '2025-01-15', timeSlot: '10:00-11:00', type: 'IN_PERSON'
      }) as any)
      expect(res.status).toBe(404)
    })

    test('returns 409 on double booking (boundary)', async () => {
      // Oracle: duplicate trainer+date+timeSlot must be rejected (conflict)
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.booking.findFirst.mockResolvedValue({ id: 'existing-b' }) // Duplicate exists

      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', {
        trainerId: 't1', date: '2025-01-15', timeSlot: '10:00-11:00', type: 'IN_PERSON'
      }) as any)

      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toContain('already booked')
    })

    test('returns 500 on database error (negative)', async () => {
      // Oracle: unexpected DB errors bubble up as 500
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      mockPrisma.memberProfile.findUnique.mockResolvedValue({ id: 'mp1' })
      mockPrisma.booking.findFirst.mockResolvedValue(null)
      mockPrisma.booking.create.mockRejectedValue(new Error('DB connection lost'))

      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', {
        trainerId: 't1', date: '2025-01-15', timeSlot: '10:00-11:00', type: 'IN_PERSON'
      }) as any)
      expect(res.status).toBe(500)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // PUT — Functional + State-Based Tests
  // ═══════════════════════════════════════════════════════════════
  describe('PUT /api/bookings', () => {
    test('trainer confirms a booking successfully', async () => {
      // Oracle: TRAINER owning the booking can update its status
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'b1', trainer: { id: 'tp1', userId: 'u-trainer' }
      })
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' })

      const res = await PUT(makeReq('http://localhost/api/bookings', 'PUT', {
        bookingId: 'b1', status: 'CONFIRMED'
      }) as any)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('CONFIRMED')
    })

    test('rejects non-TRAINER with 401', async () => {
      // Oracle: RBAC — only TRAINER can update bookings
      mockGetSession.mockResolvedValue({ id: 'u1', role: 'MEMBER' })
      const res = await PUT(makeReq('http://localhost/api/bookings', 'PUT', {
        bookingId: 'b1', status: 'CONFIRMED'
      }) as any)
      expect(res.status).toBe(401)
    })

    test('rejects update for booking not owned by trainer (403)', async () => {
      // Oracle: a trainer cannot modify another trainer's booking
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'b2', trainer: { id: 'tp-other', userId: 'u-other-trainer' }
      })

      const res = await PUT(makeReq('http://localhost/api/bookings', 'PUT', {
        bookingId: 'b2', status: 'CONFIRMED'
      }) as any)
      expect(res.status).toBe(403)
    })

    test('booking not found returns 403', async () => {
      // Oracle: non-existent bookingId is treated as unauthorized
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      mockPrisma.booking.findUnique.mockResolvedValue(null)

      const res = await PUT(makeReq('http://localhost/api/bookings', 'PUT', {
        bookingId: 'nonexistent', status: 'CONFIRMED'
      }) as any)
      expect(res.status).toBe(403)
    })

    test('state transition: PENDING → CONFIRMED → CANCELLED', async () => {
      // Oracle: booking status follows the valid lifecycle
      mockGetSession.mockResolvedValue({ id: 'u-trainer', role: 'TRAINER' })
      const booking = { id: 'b-lifecycle', trainer: { id: 'tp1', userId: 'u-trainer' } }
      mockPrisma.booking.findUnique.mockResolvedValue(booking)

      // PENDING → CONFIRMED
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'CONFIRMED' })
      const r1 = await PUT(makeReq('http://localhost/api/bookings', 'PUT', { bookingId: 'b-lifecycle', status: 'CONFIRMED' }) as any)
      const d1 = await r1.json()
      expect(d1.status).toBe('CONFIRMED')

      // CONFIRMED → CANCELLED
      mockPrisma.booking.update.mockResolvedValue({ ...booking, status: 'CANCELLED' })
      const r2 = await PUT(makeReq('http://localhost/api/bookings', 'PUT', { bookingId: 'b-lifecycle', status: 'CANCELLED' }) as any)
      const d2 = await r2.json()
      expect(d2.status).toBe('CANCELLED')
    })
  })
})
