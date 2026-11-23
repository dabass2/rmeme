import { cn } from '#/lib/utils'

export function Wordmark({
  className,
  animate = false,
  as: Tag = 'span',
}: {
  className?: string
  animate?: boolean
  as?: 'span' | 'h1'
}) {
  return (
    <Tag className={cn('riso', animate && 'riso-animate', className)}>
      <span className="riso-pink">rmeme</span>
      <span className="riso-blue" aria-hidden="true">
        rmeme
      </span>
    </Tag>
  )
}
