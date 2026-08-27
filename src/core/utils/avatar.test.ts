import { describe, expect, test } from 'bun:test'
import { avatarUrlFromEmail } from './avatar'

describe('avatarUrlFromEmail', () => {
  const map = { 'hungdn-runsystem.net': 'data:image/png;base64,abc' }

  test('looks up data URL by email', () => {
    expect(avatarUrlFromEmail('hungdn@runsystem.net', map)).toBe('data:image/png;base64,abc')
  })

  test('returns empty string when email is missing or unknown', () => {
    expect(avatarUrlFromEmail('')).toBe('')
    expect(avatarUrlFromEmail()).toBe('')
    expect(avatarUrlFromEmail('nobody@runsystem.net', map)).toBe('')
  })
})
