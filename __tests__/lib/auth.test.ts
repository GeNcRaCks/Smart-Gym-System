const mockCookies: Record<string, { value: string }> = {}

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => mockCookies[name] ?? null,
  }),
}))

jest.mock('jose', () => {
  class SignJWT {
    private payload: any
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

import { hashPassword, comparePassword, signJWT, verifyJWT, getSession } from '../../lib/auth' 

describe('Auth helpers', () => {
  beforeEach(() => {
    Object.keys(mockCookies).forEach((key) => delete mockCookies[key])
  })

  test('hashPassword returns non-plaintext hash', async () => {
    const pw = 'secret123'
    const h = await hashPassword(pw)
    expect(h).not.toBe(pw)
    expect(typeof h).toBe('string')
    expect(h.length).toBeGreaterThan(0)
  })

  test('comparePassword validates correct and incorrect passwords', async () => {
    const pw = 'hunter2'
    const h = await hashPassword(pw)
    const ok = await comparePassword(pw, h)
    const bad = await comparePassword('nope', h)
    expect(ok).toBe(true)
    expect(bad).toBe(false)
  })

  test('signJWT creates token and verifyJWT returns payload', async () => {
    const payload = { id: '1', email: 'a@b.com', role: 'MEMBER' }
    const token = await signJWT(payload)
    expect(typeof token).toBe('string')
    expect(token).toBe('signed-token')

    const verified = await verifyJWT(token)
    expect(verified).not.toBeNull()
    expect((verified as any).email).toBe('a@b.com')
  })

  test('verifyJWT returns null for invalid token', async () => {
    const verified = await verifyJWT('invalid.token.here')
    expect(verified).toBeNull()
  })

  test('getSession reads cookie and returns payload or null', async () => {
    const token = await signJWT({ id: '42', email: 'cookie@t.com', role: 'MEMBER' })

    mockCookies.auth_token = { value: token }

    const s = await getSession()
    expect(s).not.toBeNull()
    expect((s as any).email).toBe('a@b.com')

    delete mockCookies.auth_token

    const no = await getSession()
    expect(no).toBeNull()
  })
})
