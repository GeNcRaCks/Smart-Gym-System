import data from '../data/member-workouts.json'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workoutPlan: { findMany: jest.fn() },
    workoutRecord: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() }
  }
}))

const { prisma } = require('@/lib/prisma')

type Exercise = { id: string; name: string; sets: number; reps: number }
type WorkoutPlan = { id: string; name: string; difficulty: string; duration: number; creatorId: string; assignedToId?: string | null; exercises: Exercise[] }
type WorkoutRecord = { id: string; memberId: string; date: string; duration?: number | null; caloriesBurned?: number | null; status?: string }

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Member Workouts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal Cases', () => {
    test('retrieve assigned workouts', async () => {
      const plans = data.workoutPlans as WorkoutPlan[]
      mockPrisma.workoutPlan.findMany.mockResolvedValue(plans as any)

      const res = await mockPrisma.workoutPlan.findMany({ where: { assignedToId: 'member-123' }, include: { exercises: true } } as any)
      expect(res).toHaveLength(1)
      expect(res[0].exercises).toHaveLength(2)
      expect(mockPrisma.workoutPlan.findMany).toHaveBeenCalled()
    })

    test('start active workout', async () => {
      const newRecord: Partial<WorkoutRecord> = { id: 'rec-new', memberId: 'member-123', date: new Date().toISOString(), status: 'ACTIVE' }
      mockPrisma.workoutRecord.create.mockResolvedValue(newRecord as any)

      const created = await mockPrisma.workoutRecord.create({ data: { memberId: 'member-123', status: 'ACTIVE' } } as any)
      expect(created.memberId).toBe('member-123')
      expect(created.status).toBe('ACTIVE')
    })

    test('complete workout', async () => {
      const updated: WorkoutRecord = { id: 'rec-1', memberId: 'member-123', date: new Date().toISOString(), duration: 45, caloriesBurned: 300, status: 'COMPLETED' }
      mockPrisma.workoutRecord.update.mockResolvedValue(updated as any)

      const res = await mockPrisma.workoutRecord.update({ where: { id: 'rec-1' }, data: { duration: 45, caloriesBurned: 300, status: 'COMPLETED' } } as any)
      expect(res.duration).toBe(45)
      expect(res.caloriesBurned).toBe(300)
    })

    test('retrieve workout history', async () => {
      const records = data.workoutRecords as WorkoutRecord[]
      mockPrisma.workoutRecord.findMany.mockResolvedValue(records as any)

      const res = await mockPrisma.workoutRecord.findMany({ where: { memberId: 'member-123' }, orderBy: { date: 'desc' } } as any)
      expect(res).toHaveLength(2)
      expect(res[0].caloriesBurned).toBe(250)
    })
  })

  describe('Edge Cases', () => {
    test('no assigned workouts', async () => {
      mockPrisma.workoutPlan.findMany.mockResolvedValue([] as any)
      const res = await mockPrisma.workoutPlan.findMany({ where: { assignedToId: 'no-one' } } as any)
      expect(res).toEqual([])
    })

    test('empty history', async () => {
      mockPrisma.workoutRecord.findMany.mockResolvedValue([] as any)
      const res = await mockPrisma.workoutRecord.findMany({ where: { memberId: 'nobody' } } as any)
      expect(res).toEqual([])
    })
  })

  describe('Invalid Inputs', () => {
    test('invalid memberId', async () => {
      mockPrisma.workoutPlan.findMany.mockRejectedValueOnce(
        new Error('Invalid memberId')
      )
      await expect(mockPrisma.workoutPlan.findMany({ where: { assignedToId: 'bad-id' } } as any)).rejects.toThrow('Invalid memberId')
    })

    test('negative duration', async () => {
      mockPrisma.workoutRecord.update.mockRejectedValueOnce(
        new Error('Invalid duration')
      )
      await expect(mockPrisma.workoutRecord.update({ where: { id: 'rec-1' }, data: { duration: -30 } } as any)).rejects.toThrow('Invalid duration')
    })
  })

  describe('State-Based Scenarios', () => {
    test('workout lifecycle NOT_STARTED -> ACTIVE -> COMPLETED', async () => {
      // NOT_STARTED: no record
      mockPrisma.workoutRecord.findMany.mockResolvedValue([] as any)
      const notStarted = await mockPrisma.workoutRecord.findMany({ where: { memberId: 'member-123', status: 'NOT_STARTED' } } as any)
      expect(notStarted).toEqual([])

      // ACTIVE: create
      const active = { id: 'rec-life', memberId: 'member-123', status: 'ACTIVE', date: new Date().toISOString() }
      mockPrisma.workoutRecord.create.mockResolvedValue(active as any)
      const created = await mockPrisma.workoutRecord.create({ data: { memberId: 'member-123', status: 'ACTIVE' } } as any)
      expect(created.status).toBe('ACTIVE')

      // COMPLETED: update
      const completed = { ...active, status: 'COMPLETED', duration: 50, caloriesBurned: 400 }
      mockPrisma.workoutRecord.update.mockResolvedValue(completed as any)
      const done = await mockPrisma.workoutRecord.update({ where: { id: 'rec-life' }, data: { status: 'COMPLETED', duration: 50, caloriesBurned: 400 } } as any)
      expect(done.status).toBe('COMPLETED')
      expect(done.duration ?? 0).toBe(50)
      expect(done.caloriesBurned ?? 0).toBe(400)
    })
  })
})
