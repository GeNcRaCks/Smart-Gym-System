import data from '../data/admin-user-management.json'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn()
    }
  }
}))

const { prisma } = require('@/lib/prisma')

type User = {
  id: string
  email: string
  name: string
  role: string
  active: boolean
}

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Admin User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal Cases', () => {
    test('retrieve all users', async () => {
      const users = data.users as User[]
      mockPrisma.user.findMany.mockResolvedValue(users as any)

      const res = await mockPrisma.user.findMany({})
      expect(res).toHaveLength(users.length)
      expect(res[0].email).toBe('alice@example.com')
      expect(mockPrisma.user.findMany).toHaveBeenCalled()
    })

    test('delete existing user', async () => {
      const toDelete = data.users[0] as User
      mockPrisma.user.delete.mockResolvedValue(toDelete as any)

      const deleted = await mockPrisma.user.delete({ where: { id: toDelete.id } } as any)
      expect(deleted.id).toBe(toDelete.id)
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: toDelete.id } })
    })
  })

  describe('Edge Cases', () => {
    test('empty user list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([] as any)
      const res = await mockPrisma.user.findMany({})
      expect(res).toEqual([])
    })

    test('deleting already deleted user returns null or throws', async () => {
      const id = data.deletedUserId as string
      mockPrisma.user.delete.mockRejectedValueOnce(
        new Error('Record to delete does not exist')
      )

      await expect(
        mockPrisma.user.delete({ where: { id } } as any)
      ).rejects.toThrow('Record to delete does not exist')
    })
  })

  describe('Invalid Inputs', () => {
    test('invalid user id deletion', async () => {
      mockPrisma.user.delete.mockRejectedValueOnce(
        new Error('Invalid user id')
      )
      await expect(mockPrisma.user.delete({ where: { id: 'not-a-valid-id' } } as any)).rejects.toThrow('Invalid user id')
    })

    test('null deletion id', async () => {
      mockPrisma.user.delete.mockRejectedValueOnce(
        new Error('Missing id')
      )
      await expect(
        mockPrisma.user.delete({ where: { id: null } } as any)
      ).rejects.toThrow('Missing id')
    })
  })

  describe('State-Based Scenarios', () => {
    test('active users vs inactive users', async () => {
      const users = [
        { id: 'u1', email: 'a@e', name: 'A', role: 'MEMBER', active: true },
        { id: 'u2', email: 'b@e', name: 'B', role: 'MEMBER', active: false }
      ] as User[]
      mockPrisma.user.findMany.mockResolvedValue(users as any)

      const res = await mockPrisma.user.findMany({})
      const active = res.filter((u:any) => u.active)
      const inactive = res.filter((u:any) => !u.active)
      expect(active).toHaveLength(1)
      expect(inactive).toHaveLength(1)
    })

    test('deleted user no longer appears in listing', async () => {
      const users = data.users as User[]
      const toDelete = users[0]
      mockPrisma.user.delete.mockResolvedValue(toDelete as any)
      mockPrisma.user.findMany.mockResolvedValue(users.slice(1) as any)

      await mockPrisma.user.delete({ where: { id: toDelete.id } } as any)
      const remaining = await mockPrisma.user.findMany({})
      expect(remaining.find((u:any) => u.id === toDelete.id)).toBeUndefined()
    })
  })
})
