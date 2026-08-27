/** Firestore Timestamp, Date, or millis. */
export const topicDeadlineMs = (date: unknown): number => {
  if (!date) return 0
  if (date instanceof Date) return date.getTime()
  if (typeof date === 'object' && date !== null && 'toDate' in date) {
    const d = (date as { toDate: () => Date }).toDate()
    return d?.getTime?.() ?? 0
  }
  if (typeof date === 'object' && date !== null && 'seconds' in date) {
    return Number((date as { seconds: number }).seconds) * 1000
  }
  return 0
}

export const isTopicDeadlinePassed = (date: unknown, now = Date.now()): boolean => {
  const deadlineMs = topicDeadlineMs(date)
  return deadlineMs > 0 && deadlineMs <= now
}

export const isTopicVotingOpen = (
  topic: { status?: boolean | null | string; date?: unknown } | null | undefined,
  now = Date.now()
): boolean => topic?.status === true && !isTopicDeadlinePassed(topic.date, now)
