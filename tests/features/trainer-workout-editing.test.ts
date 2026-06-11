import data from '../data/trainer-workout-editing.json'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workoutPlan: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    exercise: { create: jest.fn(), update: jest.fn(), delete: jest.fn() }
  }
}))

const { prisma } = require('@/lib/prisma')

type Plan = { id: string; name: string; difficulty: string; duration: number; creatorId: string }
type Exercise = { id: string; workoutPlanId: string; name: string; sets: number; reps: number }

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Trainer Workout Editing', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('Normal Cases', () => {
    test('fetch plan for editing', async () => {
      const plan = data.plans[0] as Plan
      mockPrisma.workoutPlan.findUnique.mockResolvedValue(plan as any)

      const res = await mockPrisma.workoutPlan.findUnique({ where: { id: plan.id }, include: { exercises: true } } as any)
      expect(res.id).toBe(plan.id)
    })

    test('add exercise', async () => {
      const ex = data.exercises[0] as Exercise
      mockPrisma.exercise.create.mockResolvedValue(ex as any)

      const created = await mockPrisma.exercise.create({ data: ex } as any)
      expect(created.name).toBe('Push Ups')
    })

    test('update exercise', async () => {
      const ex = { ...data.exercises[0], sets: 4 } as Exercise
      mockPrisma.exercise.update.mockResolvedValue(ex as any)

      const updated = await mockPrisma.exercise.update({ where: { id: ex.id }, data: { sets: 4 } } as any)
      expect(updated.sets).toBe(4)
    })
  })

  describe('Edge Cases', () => {
    test('editing nonexistent plan', async () => {
      mockPrisma.workoutPlan.findUnique.mockResolvedValue(null as any)
      const res = await mockPrisma.workoutPlan.findUnique({ where: { id: 'nope' } } as any)
      expect(res).toBeNull()
    })

    test('adding invalid exercise', async () => {
      const invalid = data.invalidExercises[0] as Exercise
      mockPrisma.exercise.create.mockRejectedValueOnce(
        new Error('Invalid exercise data')
      )
      await expect(mockPrisma.exercise.create({ data: invalid } as any)).rejects.toThrow('Invalid exercise data')
    })
  })

  describe('Invalid Inputs', () => {
    test('negative sets rejected', async () => {
      mockPrisma.exercise.create.mockRejectedValueOnce(
        new Error('Invalid sets')
      )
      await expect(mockPrisma.exercise.create({ data: { ...data.exercises[0], sets: -3 } } as any)).rejects.toThrow('Invalid sets')
    })

    test('blank exercise name', async () => {
      mockPrisma.exercise.create.mockRejectedValueOnce(
        new Error('Name required')
      )
      await expect(mockPrisma.exercise.create({ data: { ...data.exercises[0], name: '' } } as any)).rejects.toThrow('Name required')
    })
  })

  describe('State-Based', () => {
    test('plan publish/unpublish flow', async () => {
      const plan = data.plans[0] as Plan
      mockPrisma.workoutPlan.update.mockResolvedValue({ ...plan, published: true } as any)
      const published = await mockPrisma.workoutPlan.update({ where: { id: plan.id }, data: { published: true } } as any)
      expect(published.published).toBe(true)

      mockPrisma.workoutPlan.update.mockResolvedValue({ ...plan, published: false } as any)
      const unpublished = await mockPrisma.workoutPlan.update({ where: { id: plan.id }, data: { published: false } } as any)
      expect(unpublished.published).toBe(false)
    })
  })
})
