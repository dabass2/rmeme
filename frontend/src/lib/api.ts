import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export type Meme = {
  meme_id: number
  filename: string
  extension: string
  format: 'image' | 'gif' | 'video' | (string & {})
  score: number
  url: string
  tags?: string | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

const apiUrl = () =>
  (process.env.RMEME_API_URL ?? 'https://api.rmeme.me').replace(/\/$/, '')

async function request<T>(
  path: string,
  init: RequestInit & { authed?: boolean } = {},
): Promise<T> {
  const { authed, ...rest } = init
  const headers = new Headers(rest.headers)
  headers.set('accept', 'application/json')
  if (rest.body) headers.set('content-type', 'application/json')
  if (authed) {
    const key = process.env.RMEME_API_KEY
    if (!key) throw new ApiError('RMEME_API_KEY is not set on the server', 500)
    headers.set('x-api-key', key)
  }

  const res = await fetch(`${apiUrl()}${path}`, { ...rest, headers }).catch(
    () => {
      throw new ApiError("The meme API isn't responding right now.", 503)
    },
  )
  const body = (await res.json().catch(() => null)) as
    | (T & { message?: string })
    | null

  if (!res.ok) {
    throw new ApiError(
      body?.message ?? `Request failed with status ${res.status}`,
      res.status,
    )
  }
  return body as T
}

/** The URL shown to visitors, which can differ from the one the server calls. */
export const getApiUrl = createServerFn({ method: 'GET' }).handler(() =>
  (process.env.RMEME_PUBLIC_API_URL ?? apiUrl()).replace(/\/$/, ''),
)

export const getRandomMeme = createServerFn({ method: 'GET' }).handler(() =>
  request<Meme>('/rmeme'),
)

export const getTotalMemes = createServerFn({ method: 'GET' }).handler(
  async () => (await request<{ total: number }>('/rmeme/total')).total,
)

export const getMeme = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    try {
      return await request<Meme>(`/meme/${data.id}`, { authed: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  })

export const voteOnMeme = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.number().int(),
      votes: z.union([z.literal(1), z.literal(-1)]),
    }),
  )
  .handler(({ data }) =>
    request<{ meme_id: number; score: number }>(`/meme/${data.id}`, {
      method: 'PUT',
      authed: true,
      body: JSON.stringify({ votes: data.votes }),
    }),
  )
