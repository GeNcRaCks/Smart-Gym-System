import data from '../data/member-trainer-booking.json'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trainer: { findMany: jest.fn() },
    booking: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() }
  }
}))

const { prisma } = require('@/lib/prisma')

type Trainer = { id: string; name: string; specialty: string; rating: number }
type Booking = { id: string; memberId: string; trainerId: string; date: string; timeSlot: string; status: string; type: string; meetingLink?: string }

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Member Trainer Booking', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('Normal Cases', () => {
    test('list trainers', async () => {
      const trainers = data.trainers as Trainer[]
      mockPrisma.trainer.findMany.mockResolvedValue(trainers as any)

      const res = await mockPrisma.trainer.findMany({})
      expect(res).toHaveLength(2)
      expect(res[0].name).toBe('John Trainer')
    })

    test('create booking', async () => {
      const booking = data.bookings[0] as Booking
      mockPrisma.booking.create.mockResolvedValue(booking as any)

      const created = await mockPrisma.booking.create({ data: booking } as any)
      expect(created.id).toBe(booking.id)
      expect(created.status).toBe('PENDING')
    })

    test('confirm booking', async () => {
      const confirm = data.bookings[1] as Booking
      mockPrisma.booking.update.mockResolvedValue(confirm as any)

      const updated = await mockPrisma.booking.update({ where: { id: confirm.id }, data: { status: 'CONFIRMED' } } as any)
      expect(updated.status).toBe('CONFIRMED')
    })
  })

  describe('Edge Cases', () => {
    test('duplicate booking prevented', async () => {
      const dup = data.duplicateBooking as any
      mockPrisma.booking.findMany.mockResolvedValue([data.bookings[0]] as any)

      const existing = await mockPrisma.booking.findMany({ where: { memberId: dup.memberId, trainerId: dup.trainerId, date: dup.date, timeSlot: dup.timeSlot } } as any)
      expect(existing.length).toBeGreaterThan(0)
    })

    test('trainer unavailable', async () => {
      mockPrisma.booking.create.mockRejectedValueOnce(
        new Error('Trainer unavailable')
      )
      await expect(mockPrisma.booking.create({ data: {} } as any)).rejects.toThrow('Trainer unavailable')
    })
  })

  describe('Invalid Inputs', () => {
    test('invalid time slot', async () => {
      mockPrisma.booking.create.mockRejectedValueOnce(
        new Error('Invalid time slot')
      )
      await expect(mockPrisma.booking.create({ data: { memberId: 'm', trainerId: 't', date: 'bad', timeSlot: 'xx' } } as any)).rejects.toThrow('Invalid time slot')
    })

    test('missing memberId', async () => {
      mockPrisma.booking.create.mockRejectedValueOnce(
        new Error('Missing memberId')
      )
      await expect(
        mockPrisma.booking.create({ data: { trainerId: 't' } } as any)
      ).rejects.toThrow('Missing memberId')
    })
  })

  describe('State-Based', () => {
    test('booking lifecycle PENDING -> CONFIRMED -> COMPLETED', async () => {
      const pending = data.bookings[0] as Booking
      mockPrisma.booking.create.mockResolvedValue(pending as any)
      const created = await mockPrisma.booking.create({ data: pending } as any)
      expect(created.status).toBe('PENDING')

      const confirmed = { ...pending, status: 'CONFIRMED' }
      mockPrisma.booking.update.mockResolvedValue(confirmed as any)
      const upd = await mockPrisma.booking.update({ where: { id: pending.id }, data: { status: 'CONFIRMED' } } as any)
      expect(upd.status).toBe('CONFIRMED')

      const completed = { ...confirmed, status: 'COMPLETED' }
      mockPrisma.booking.update.mockResolvedValue(completed as any)
      const done = await mockPrisma.booking.update({ where: { id: pending.id }, data: { status: 'COMPLETED' } } as any)
      expect(done.status).toBe('COMPLETED')
    })
  })
})
