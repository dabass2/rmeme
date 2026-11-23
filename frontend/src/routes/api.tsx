import { createFileRoute } from '@tanstack/react-router'
import { ExternalLinkIcon, KeyRoundIcon } from 'lucide-react'
import { CodeLine } from '#/components/code-line'
import { Badge } from '#/components/ui/badge'
import { getApiUrl } from '#/lib/api'
import { cn } from '#/lib/utils'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

type Endpoint = {
  method: Method
  path: string
  description: string
  body?: string
  response: string
}

const memeExample = `{
  "meme_id": 42,
  "filename": "0b6c1f0e-…",
  "extension": "png",
  "format": "image",
  "score": 7,
  "url": "https://…/0b6c1f0e-….png"
}`

const publicEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/rmeme',
    description: 'Get a random meme, including its tags.',
    response: memeExample.replace('"score": 7,', '"score": 7,\n  "tags": "cat,funny",'),
  },
  {
    method: 'GET',
    path: '/rmeme/total',
    description: 'Get how many memes there are.',
    response: `{ "total": 1204 }`,
  },
  {
    method: 'GET',
    path: '/health',
    description: 'Check that the API is up. Responds with plain text.',
    response: 'APP UP',
  },
]

const keyedEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/meme/:id',
    description:
      'Get a meme by its ID. Negative IDs count back from the newest meme, so -1 is the second newest.',
    response: memeExample,
  },
  {
    method: 'POST',
    path: '/meme',
    description:
      'Add a meme from a link to a png, jpg, jpeg, apng, webp, gif, mp4, webm or mov file.',
    body: `{ "url": "https://example.com/meme.png" }`,
    response: memeExample.replace('"score": 7', '"score": 0'),
  },
  {
    method: 'PUT',
    path: '/meme/:id',
    description: "Add votes to a meme's score. Use a negative number to downvote.",
    body: `{ "votes": 1 }`,
    response: `{
  "message": "Updated score for meme 42",
  "meme_id": 42,
  "score": 8
}`,
  },
  {
    method: 'DELETE',
    path: '/meme/:id',
    description: 'Delete a meme and its tags.',
    response: `{ "message": "Deleted meme with id: 42" }`,
  },
]

export const Route = createFileRoute('/api')({
  loader: () => getApiUrl(),
  head: () => ({ meta: [{ title: 'API docs on rmeme' }] }),
  component: ApiDocs,
})

const methodStyles: Record<Method, string> = {
  GET: 'bg-blue text-white',
  POST: 'bg-pink text-white',
  PUT: 'bg-foreground text-background',
  DELETE: 'bg-destructive text-white',
}

function EndpointRow({ endpoint }: { endpoint: Endpoint }) {
  return (
    <article className="grid gap-4 border-t py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="flex flex-wrap items-center gap-2.5">
          <Badge
            className={cn(
              'rounded-sm px-1.5 font-mono text-xs font-medium',
              methodStyles[endpoint.method],
            )}
          >
            {endpoint.method}
          </Badge>
          <code className="font-mono text-base font-medium">{endpoint.path}</code>
        </h3>
        <p className="max-w-[46ch] text-muted-foreground">
          {endpoint.description}
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {endpoint.body && <CodeBlock title="Request body" code={endpoint.body} />}
        <CodeBlock title="Response" code={endpoint.response} />
      </div>
    </article>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <p className="border-b px-4 py-1.5 text-sm text-muted-foreground">{title}</p>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[0.8125rem] leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

function ApiDocs() {
  const apiUrl = Route.useLoaderData()

  return (
    <div className="flex flex-col gap-14 pt-6 lg:pt-12">
      <header className="flex max-w-2xl flex-col gap-5">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          The rmeme API
        </h1>
        <p className="text-xl leading-snug text-pretty">
          Plain JSON over HTTP. Getting a random meme needs no sign-up, so you
          can try it right now:
        </p>
        <CodeLine command={`curl ${apiUrl}/rmeme`} />
        <p className="text-muted-foreground">
          Base URL <code className="font-mono text-foreground">{apiUrl}</code>.
          There is also an{' '}
          <a
            href={`${apiUrl}/docs`}
            className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
          >
            interactive reference
            <ExternalLinkIcon className="size-3.5" />
          </a>{' '}
          where you can send requests from your browser.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          Open to everyone
        </h2>
        {publicEndpoints.map((e) => (
          <EndpointRow key={e.method + e.path} endpoint={e} />
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">Needs an API key</h2>
        <div className="mt-3 mb-4 flex max-w-2xl gap-3 rounded-lg border bg-card p-4">
          <KeyRoundIcon className="mt-0.5 size-5 shrink-0 text-pink" />
          <p className="text-muted-foreground">
            Send your key in the{' '}
            <code className="font-mono text-foreground">x-api-key</code> header.
            Each key has a daily request limit, and the{' '}
            <code className="font-mono text-foreground">x-rate-limit</code>{' '}
            response header tells you how many requests you have left today.
            Going over the limit returns a 429.
          </p>
        </div>
        {keyedEndpoints.map((e) => (
          <EndpointRow key={e.method + e.path} endpoint={e} />
        ))}
      </section>
    </div>
  )
}
