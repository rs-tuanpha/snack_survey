import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const HOST = 'https://chat.runsystem.vn/api/v4'
const CHANNEL_ID = 'h5feg8xijfrndngbhc844y8jfh' // [HCM.DU2] WeAreOne
const AVATAR_FILE = join(__dirname, '..', 'avatar', 'avatars.json')
const AVATAR_SIZE = 64
const COOKIE = process.env.MMAUTHTOKEN ? `MMAUTHTOKEN=${process.env.MMAUTHTOKEN}` : ''

export const usernameFromEmail = (email: string) => email.replace('@', '-')

export type MattermostUser = {
  id: string
  create_at: number
  update_at: number
  delete_at: number
  username: string // example: "hungdn-runsystem.net"
  auth_data: string
  auth_service: string
  email: string // example: "hungdn@runsystem.net"
  nickname: string
  first_name: string
  last_name: string
  position: string
  roles: string
  last_picture_update: number
  locale: string
  timezone: {
    automaticTimezone: string
    manualTimezone: string
    useAutomaticTimezone: string
  }
}

type FetchUsersOptions = {
  pageSize?: number
}

const cookieHeader = (cookie: string) => ({ Cookie: cookie })

export async function fetchChannelUsers(
  cookie: string,
  { pageSize = 100 }: FetchUsersOptions = {}
): Promise<MattermostUser[]> {
  const users: MattermostUser[] = []
  for (let page = 0; ; page++) {
    const url = `${HOST}/users?in_channel=${CHANNEL_ID}&page=${page}&per_page=${pageSize}&sort=status`
    const res = await fetch(url, { headers: cookieHeader(cookie) })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const batch = (await res.json()) as MattermostUser[]
    users.push(...batch)
    if (batch.length < pageSize) break
  }
  return users
}

export async function toDataUrl(res: Response): Promise<string> {
  const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}

async function download(
  user: Pick<MattermostUser, 'id' | 'username'>,
  cookie: string
): Promise<[string, string]> {
  const res = await fetch(`${HOST}/users/${user.id}/image`, { headers: cookieHeader(cookie) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return [user.username, await toDataUrl(res)]
}

export async function syncAvatars(cookie = COOKIE): Promise<void> {
  if (!cookie) throw new Error('Missing MMAUTHTOKEN in .env')

  const users = await fetchChannelUsers(cookie)
  await mkdir(dirname(AVATAR_FILE), { recursive: true })

  const entries = await Promise.all(
    users.map(async (user) => {
      try {
        return await download(user, cookie)
      } catch (err) {
        console.warn('skip', user.username, (err as Error).message)
        return null
      }
    })
  )

  const map = Object.fromEntries(entries.filter((entry): entry is [string, string] => entry !== null))
  await writeFile(AVATAR_FILE, JSON.stringify(map))
  console.log(`Saved ${Object.keys(map).length} avatars`)
}

if (import.meta.main) await syncAvatars()
