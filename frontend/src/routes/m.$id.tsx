import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { MemeStage, MemeStageSkeleton } from '#/components/meme-stage'
import { getMeme } from '#/lib/api'

export const Route = createFileRoute('/m/$id')({
  loader: async ({ params }) => {
    const id = Number(params.id)
    if (!Number.isInteger(id)) throw notFound()
    const meme = await getMeme({ data: { id } })
    if (!meme) throw notFound()
    return meme
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Meme #${loaderData.meme_id} on rmeme` : 'rmeme' },
      ...(loaderData && loaderData.format !== 'video'
        ? [{ property: 'og:image', content: loaderData.url }]
        : []),
    ],
  }),
  component: MemePage,
  pendingMs: 150,
  pendingComponent: () => (
    <div className="mx-auto max-w-3xl pt-4">
      <MemeStageSkeleton />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="py-24">
      <h1 className="text-3xl font-bold tracking-tight">
        This meme couldn't be loaded
      </h1>
      <p className="mt-2 text-muted-foreground">
        {error instanceof Error ? error.message : 'Try again in a moment.'}
      </p>
    </div>
  ),
})

function MemePage() {
  const meme = Route.useLoaderData()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl pt-4">
      <MemeStage
        meme={meme}
        nextLabel="Random meme"
        onNext={() => navigate({ to: '/' })}
      />
    </div>
  )
}
