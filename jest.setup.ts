import '@testing-library/jest-dom'
import { TextEncoder } from 'util'

// Ensure deterministic JWT secret in tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

// Polyfill Web API globals in JSDOM environment using native Node globals
const vm = require('vm');
if (typeof (globalThis as any).Request === 'undefined') {
  ;(globalThis as any).Request = vm.runInThisContext('Request')
}
if (typeof (globalThis as any).Response === 'undefined') {
  ;(globalThis as any).Response = vm.runInThisContext('Response')
}
if (typeof (globalThis as any).Headers === 'undefined') {
  ;(globalThis as any).Headers = vm.runInThisContext('Headers')
}

// Provide Node global TextEncoder for JWT signing in tests
if (typeof (globalThis as any).TextEncoder === 'undefined') {
  ;(globalThis as any).TextEncoder = TextEncoder
}

// Provide a basic global fetch mock that tests can override per-case
if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = jest.fn()
}

// Small helper to clear test cookies between tests
// @ts-ignore
global.__TEST_COOKIES = {}
