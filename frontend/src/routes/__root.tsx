import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { SiteHeader } from '#/components/site-header'
import { Toaster } from '#/components/ui/sonner'
import { themeScript } from '#/hooks/use-theme'
import appCss from '../styles.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'rmeme' },
      {
        name: 'description',
        content: 'A random meme every time you ask. Vote on them, or use the API.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    scripts: [{ children: themeScript }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
          Memes served by the rmeme API.{' '}
          <a
            href="https://github.com/dabass2/rmeme"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Source on GitHub
          </a>
        </footer>
        <Toaster position="bottom-center" />
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Nothing here</h1>
      <p className="text-muted-foreground">
        That page doesn't exist. There are plenty of memes on the home page.
      </p>
      <Link to="/" className="font-semibold underline underline-offset-4">
        Show me a meme
      </Link>
    </div>
  )
}
