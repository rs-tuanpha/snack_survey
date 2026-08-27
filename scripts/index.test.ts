import { afterEach, describe, expect, mock, test } from 'bun:test'
import { fetchChannelUsers, toDataUrl, usernameFromEmail } from './index'

const CHANNEL = 'h5feg8xijfrndngbhc844y8jfh'

afterEach(() => {
  mock.restore()
})

describe('fetchChannelUsers', () => {
  test('paginates until a short page and returns all users', async () => {
    const fetchMock = mock(async (url: string) => {
      const page = Number(new URL(url).searchParams.get('page'))
      const body = page === 0 ? [{ id: 'aaa' }, { id: 'bbb' }] : [{ id: 'ccc' }]
      return Response.json(body)
    })
    globalThis.fetch = fetchMock

    const users = await fetchChannelUsers('MMAUTHTOKEN=x', { pageSize: 2 })

    expect(users.map((u) => u.id)).toEqual(['aaa', 'bbb', 'ccc'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toContain(`in_channel=${CHANNEL}`)
    expect(fetchMock.mock.calls[0][1].headers.Cookie).toBe('MMAUTHTOKEN=x')
  })

  test('throws when the users API fails', async () => {
    globalThis.fetch = mock(async () => new Response('nope', { status: 401 }))
    await expect(fetchChannelUsers('MMAUTHTOKEN=x')).rejects.toThrow('401')
  })
})

describe('avatar map', () => {
  test('maps company email to Mattermost username', () => {
    expect(usernameFromEmail('hungdn@runsystem.net')).toBe('hungdn-runsystem.net')
  })

  test('resizes image to 64x64 jpeg data URL', async () => {
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    const res = new Response(pixel, { headers: { 'content-type': 'image/png' } })
    const dataUrl = await toDataUrl(res)
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)

    const { default: sharp } = await import('sharp')
    const meta = await sharp(Buffer.from(dataUrl.split(',')[1], 'base64')).metadata()
    expect(meta.width).toBe(64)
    expect(meta.height).toBe(64)
  })
})
