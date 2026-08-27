import { describe, expect, test } from 'bun:test'
import { isTopicDeadlinePassed, isTopicVotingOpen, topicDeadlineMs } from './topicTime'

const now = 1_700_000_000_000

describe('topicDeadlineMs', () => {
  test('reads Firestore Timestamp seconds', () => {
    expect(topicDeadlineMs({ seconds: 1_700_000_100 })).toBe(1_700_000_100_000)
  })

  test('reads Date and toDate()', () => {
    expect(topicDeadlineMs(new Date(now))).toBe(now)
    expect(topicDeadlineMs({ toDate: () => new Date(now) })).toBe(now)
  })

  test('returns 0 when date is missing', () => {
    expect(topicDeadlineMs(undefined)).toBe(0)
  })
})

describe('isTopicDeadlinePassed', () => {
  test('is true at or after the deadline', () => {
    const date = { seconds: now / 1000 }
    expect(isTopicDeadlinePassed(date, now)).toBe(true)
    expect(isTopicDeadlinePassed(date, now + 1)).toBe(true)
  })

  test('is false before the deadline', () => {
    expect(isTopicDeadlinePassed({ seconds: now / 1000 }, now - 1)).toBe(false)
  })

  test('is false when there is no deadline', () => {
    expect(isTopicDeadlinePassed(undefined, now)).toBe(false)
  })
})

describe('isTopicVotingOpen', () => {
  test('allows vote only while status is true and deadline is in the future', () => {
    expect(isTopicVotingOpen({ status: true, date: { seconds: now / 1000 + 60 } }, now)).toBe(true)
  })

  test('blocks vote when countdown hits 0 even if status is still true', () => {
    expect(isTopicVotingOpen({ status: true, date: { seconds: now / 1000 } }, now)).toBe(false)
  })

  test('blocks vote when topic is closed', () => {
    expect(isTopicVotingOpen({ status: false, date: { seconds: now / 1000 + 60 } }, now)).toBe(false)
  })
})
