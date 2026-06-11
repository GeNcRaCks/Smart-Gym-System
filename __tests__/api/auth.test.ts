/**
 * Tests for authentication API endpoints
 */

jest.mock('jose', () => {
  class SignJWT {
    payload: any
    constructor(payload: any) {
      this.payload = payload
    }
    setProtectedHeader() {
      return this
    }
    setExpirationTime() {
      return this
    }
    async sign() {
      return 'signed-token'
    }
  }

  async function jwtVerify(token: string) {
    if (token !== 'signed-token') {
      throw new Error('invalid token')
    }
    return { payload: { id: '1', email: 'a@b.com', role: 'MEMBER' } }
  }

  return { SignJWT, jwtVerify }
})

import { hashPassword, comparePassword } from '../../lib/auth'

jest.mock('@/lib/prisma')
jest.mock('next/headers')

describe('Auth API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('hashPassword produces non-plaintext hash', async () => {
    const password = 'mypassword'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(0)
  })

  test('comparePassword validates correct password', async () => {
    const password = 'hunter2'
    const hash = await hashPassword(password)
    const isValid = await comparePassword(password, hash)
    expect(isValid).toBe(true)
  })

  test('comparePassword rejects wrong password', async () => {
    const password = 'hunter2'
    const hash = await hashPassword(password)
    const isValid = await comparePassword('wrongpass', hash)
    expect(isValid).toBe(false)
  })
})

