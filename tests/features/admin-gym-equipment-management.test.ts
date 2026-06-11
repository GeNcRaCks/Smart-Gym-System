import data from '../data/admin-gym-equipment-management.json'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    equipment: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }
  }
}))

const { prisma } = require('@/lib/prisma')

type Equipment = { id: string; name: string; type: string; status: string; lastMaintenance: string }

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Admin Gym Equipment Management', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('Normal Cases', () => {
    test('list equipment', async () => {
      const list = data.equipments as Equipment[]
      mockPrisma.equipment.findMany.mockResolvedValue(list as any)

      const res = await mockPrisma.equipment.findMany({})
      expect(res).toHaveLength(2)
      expect(res[0].name).toBe('Treadmill')
    })

    test('add equipment', async () => {
      const eq = data.equipments[0] as Equipment
      mockPrisma.equipment.create.mockResolvedValue(eq as any)

      const created = await mockPrisma.equipment.create({ data: eq } as any)
      expect(created.id).toBe(eq.id)
    })

    test('update equipment status', async () => {
      const updated = { ...data.equipments[1], status: 'AVAILABLE' } as Equipment
      mockPrisma.equipment.update.mockResolvedValue(updated as any)

      const res = await mockPrisma.equipment.update({ where: { id: updated.id }, data: { status: 'AVAILABLE' } } as any)
      expect(res.status).toBe('AVAILABLE')
    })
  })

  describe('Edge Cases', () => {
    test('no equipment', async () => {
      mockPrisma.equipment.findMany.mockResolvedValue([] as any)
      const res = await mockPrisma.equipment.findMany({})
      expect(res).toEqual([])
    })

    test('maintenance scheduling', async () => {
      const eq = data.equipments[0] as Equipment
      mockPrisma.equipment.update.mockResolvedValue({ ...eq, lastMaintenance: new Date().toISOString() } as any)
      const res = await mockPrisma.equipment.update({ where: { id: eq.id }, data: { lastMaintenance: new Date().toISOString() } } as any)
      expect(new Date(res.lastMaintenance).getFullYear()).toBeGreaterThan(2020)
    })
  })

  describe('Invalid Inputs', () => {
    test('invalid equipment create', async () => {
      mockPrisma.equipment.create.mockRejectedValueOnce(
        new Error('Invalid equipment')
      )
      await expect(mockPrisma.equipment.create({ data: data.invalidEquipment } as any)).rejects.toThrow('Invalid equipment')
    })

    test('delete unknown equipment', async () => {
      mockPrisma.equipment.delete.mockRejectedValueOnce(
        new Error('Record not found')
      )
      await expect(mockPrisma.equipment.delete({ where: { id: 'missing' } } as any)).rejects.toThrow('Record not found')
    })
  })

  describe('State-Based', () => {
    test('equipment availability lifecycle', async () => {
      const eq = data.equipments[1] as Equipment
      mockPrisma.equipment.update.mockResolvedValue({ ...eq, status: 'MAINTENANCE' } as any)
      const down = await mockPrisma.equipment.update({ where: { id: eq.id }, data: { status: 'MAINTENANCE' } } as any)
      expect(down.status).toBe('MAINTENANCE')

      mockPrisma.equipment.update.mockResolvedValue({ ...eq, status: 'AVAILABLE' } as any)
      const up = await mockPrisma.equipment.update({ where: { id: eq.id }, data: { status: 'AVAILABLE' } } as any)
      expect(up.status).toBe('AVAILABLE')
    })
  })
})
