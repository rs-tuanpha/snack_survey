import type { IUser } from '@/core/interfaces/model/user'

/**
 * Same person may appear twice when old and new tools stored different ids
 * for the same username. Match by id or username.
 */
export const isSameVoter = (a: IUser | null | undefined, b: IUser | null | undefined): boolean => {
  if (!a || !b) return false
  if (a.id && b.id && a.id === b.id) return true
  if (a.username && b.username && a.username.toLowerCase() === b.username.toLowerCase()) return true
  return false
}

/** Prefer the latest entry when collapsing duplicates (id + username collisions). */
export const uniqueVoters = (voters: IUser[] | null | undefined): IUser[] => {
  if (!voters?.length) return []
  const result: IUser[] = []
  for (const voter of voters) {
    if (!voter) continue
    const existingIndex = result.findIndex((v) => isSameVoter(v, voter))
    if (existingIndex === -1) result.push(voter)
    else result[existingIndex] = { ...result[existingIndex], ...voter }
  }
  return result
}

export const findVoterIndex = (voters: IUser[], user: IUser): number =>
  voters.findIndex((voter) => isSameVoter(voter, user))
