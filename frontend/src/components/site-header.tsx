import { Link, useRouterState } from '@tanstack/react-router'
import { ThemeToggle } from '#/components/theme-toggle'
import { Wordmark } from '#/components/wordmark'
import { cn } from '#/lib/utils'

const navLink =
  'rounded-md px-3 py-1.5 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none'

export function SiteHeader() {
  const isHome = useRouterState({ select: (s) => s.location.pathname === '/' })

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link
        to="/"
        aria-label="rmeme home"
        className={cn(
          'rounded-sm text-3xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
          isHome && 'invisible',
        )}
        tabIndex={isHome ? -1 : undefined}
      >
        <Wordmark />
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          to="/"
          className={navLink}
          activeProps={{ className: 'text-foreground' }}
          activeOptions={{ exact: true }}
        >
          Memes
        </Link>
        <Link
          to="/api"
          className={navLink}
          activeProps={{ className: 'text-foreground' }}
        >
          API
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  )
}
