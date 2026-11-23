import { CopyButton } from '#/components/copy-button'
import { cn } from '#/lib/utils'

/** A single copyable shell command. */
export function CodeLine({
  command,
  className,
}: {
  command: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card py-1.5 pr-1.5 pl-4',
        className,
      )}
    >
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">
        <span className="text-muted-foreground select-none">$ </span>
        {command}
      </code>
      <CopyButton value={command} label="Copy command" />
    </div>
  )
}
