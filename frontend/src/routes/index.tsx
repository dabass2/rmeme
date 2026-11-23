import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { RefreshCwIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CodeLine } from '#/components/code-line'
import { MemeStage, MemeStageSkeleton } from '#/components/meme-stage'
import { Button } from '#/components/ui/button'
import { Wordmark } from '#/components/wordmark'
import { getApiUrl, getRandomMeme, getTotalMemes, type Meme } from '#/lib/api'

const randomMeme = (n: number) =>
  queryOptions({
    queryKey: ['random-meme', n],
    queryFn: () => getRandomMeme(),
    staleTime: Infinity,
    gcTime: 60_000,
    retry: 1,
  })

const totalMemes = queryOptions({
  queryKey: ['total-memes'],
  queryFn: () => getTotalMemes(),
  staleTime: 5 * 60_000,
})

export const Route = createFileRoute('/')({
  loader: async ({ context: { queryClient } }) => {
    const [apiUrl] = await Promise.all([
      getApiUrl(),
      queryClient.ensureQueryData(randomMeme(0)).catch(() => null),
      queryClient.ensureQueryData(totalMemes).catch(() => null),
    ])
    return { apiUrl }
  },
  component: Home,
})

function preload(meme: Meme) {
  if (meme.format === 'image' || meme.format === 'gif') {
    const img = new Image()
    img.src = meme.url
  }
}

function Home() {
  const { apiUrl } = Route.useLoaderData()
  const queryClient = useQueryClient()
  const [n, setN] = useState(0)
  const meme = useQuery(randomMeme(n))
  const total = useQuery(totalMemes)

  // Fetch the next meme in the background so "Next" is instant.
  useEffect(() => {
    queryClient
      .fetchQuery(randomMeme(n + 1))
      .then(preload)
      .catch(() => {})
  }, [n, queryClient])

  const next = () => setN((x) => x + 1)

  return (
    <div className="grid items-start gap-10 pt-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:pt-10">
      <section className="flex flex-col gap-6 lg:sticky lg:top-10">
        <Wordmark
          as="h1"
          animate
          className="text-[clamp(6rem,30vw,11.5rem)] -ml-[0.04em]"
        />
        <p className="max-w-[34ch] text-xl leading-snug text-pretty">
          A random meme every time you ask. Vote on the good ones here, or pull
          them into your own app with one request.
        </p>
        <div className="hidden flex-col gap-2 lg:flex">
          <CodeLine command={`curl ${apiUrl}/rmeme`} className="max-w-md" />
          <p className="text-sm text-muted-foreground">
            {total.data !== undefined && (
              <>
                {total.data.toLocaleString()} memes and counting.{' '}
              </>
            )}
            <Link
              to="/api"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Read the API docs
            </Link>
          </p>
        </div>
      </section>

      <section aria-label="Random meme">
        {meme.data ? (
          <MemeStage key={meme.data.meme_id + '-' + n} meme={meme.data} onNext={next} />
        ) : meme.isError ? (
          <div className="flex min-h-72 flex-col items-start justify-center gap-4 rounded-xl border-2 border-dashed p-8">
            <p className="text-lg font-semibold">Couldn't reach the meme API.</p>
            <p className="text-muted-foreground">
              {meme.error instanceof Error ? meme.error.message : null}
            </p>
            <Button onClick={() => meme.refetch()}>
              <RefreshCwIcon />
              Try again
            </Button>
          </div>
        ) : (
          <MemeStageSkeleton />
        )}
      </section>

      <section className="flex flex-col gap-2 lg:hidden">
        <CodeLine command={`curl ${apiUrl}/rmeme`} />
        <Link
          to="/api"
          className="text-sm font-medium underline underline-offset-4"
        >
          Read the API docs
        </Link>
      </section>
    </div>
  )
}
