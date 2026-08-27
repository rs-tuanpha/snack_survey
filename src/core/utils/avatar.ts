import avatarsJson from '../../../avatar/avatars.json'

type AvatarMap = Record<string, string>
const avatars = avatarsJson as AvatarMap

/** Mattermost username is email with @ replaced by -. */
export function avatarUrlFromEmail(email?: string, map: AvatarMap = avatars): string {
  if (!email) return ''
  return map[email.replace('@', '-')] ?? ''
}
