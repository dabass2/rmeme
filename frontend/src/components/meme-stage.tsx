import { Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowRightIcon,
  HeartIcon,
  LinkIcon,
  ThumbsDownIcon,
  ImageOffIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Kbd } from '#/components/ui/kbd'
import { Skeleton } from '#/components/ui/skeleton'
import { voteOnMeme, type Meme } from '#/lib/api'
import { cn } from '#/lib/utils'
import { getVote, saveVote } from '#/lib/votes'

type StageProps = {
  meme: Meme
  onNext: () => void
  nextLabel?: string
}

export function MemeStage({ meme, onNext, nextLabel = 'Next meme' }: StageProps) {
  const [score, setScore] = useState(meme.score)
  const [vote, setVote] = useState<1 | -1 | undefined>()
  const [broken, setBroken] = useState(false)

  useEffect(() => setVote(getVote(meme.meme_id)), [meme.meme_id])

  const mutation = useMutation({
    mutationFn: (votes: 1 | -1) =>
      voteOnMeme({ data: { id: meme.meme_id, votes } }),
    onMutate: (votes) => {
      setVote(votes)
      setScore((s) => s + votes)
    },
    onSuccess: (res, votes) => {
      setScore(res.score)
      saveVote(meme.meme_id, votes)
    },
    onError: (err, votes) => {
      setVote(undefined)
      setScore((s) => s - votes)
      toast.error("Your vote didn't count", {
        description:
          err instanceof Error ? err.message : 'Try again in a moment.',
      })
    },
  })

  const castVote = (votes: 1 | -1) => {
    if (vote !== undefined || mutation.isPending) return
    mutation.mutate(votes)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable], video')) return
      if (e.key === 'ArrowUp') castVote(1)
      else if (e.key === 'ArrowDown') castVote(-1)
      else if (e.key === 'ArrowRight' || e.key === 'n') onNext()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const copyLink = async () => {
    const url = `${window.location.origin}/m/${meme.meme_id}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied', { description: url })
  }

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex items-baseline justify-between gap-4 px-1">
        <Link
          to="/m/$id"
          params={{ id: String(meme.meme_id) }}
          className="text-xl font-bold tracking-tight underline-offset-4 hover:underline"
        >
          Meme #{meme.meme_id}
        </Link>
        <span className="text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{score}</span>{' '}
          {Math.abs(score) === 1 ? 'point' : 'points'}
        </span>
      </figcaption>

      <div className="grid min-h-72 place-items-center overflow-hidden rounded-xl border-2 border-foreground bg-card">
        {broken ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <ImageOffIcon className="size-8" />
            <p>This meme's file couldn't be loaded.</p>
          </div>
        ) : meme.format === 'video' || meme.format === 'mp4' ? (
          <video
            key={meme.url}
            src={meme.url}
            className="max-h-[68vh] w-full object-contain"
            controls
            autoPlay
            loop
            muted
            playsInline
            onError={() => setBroken(true)}
          />
        ) : (
          <img
            key={meme.url}
            src={meme.url}
            alt={`Meme #${meme.meme_id}`}
            className="max-h-[68vh] w-full object-contain"
            onError={() => setBroken(true)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="lg"
          variant="outline"
          aria-pressed={vote === 1}
          disabled={vote !== undefined}
          onClick={() => castVote(1)}
          className={cn(
            'border-2 disabled:opacity-100',
            vote === 1 && 'border-pink bg-pink text-white',
            vote === -1 && 'opacity-40',
          )}
        >
          <HeartIcon className={cn(vote === 1 && 'fill-current')} />
          Upvote
        </Button>
        <Button
          size="lg"
          variant="outline"
          aria-pressed={vote === -1}
          disabled={vote !== undefined}
          onClick={() => castVote(-1)}
          className={cn(
            'border-2 disabled:opacity-100',
            vote === -1 && 'border-blue bg-blue text-white',
            vote === 1 && 'opacity-40',
          )}
        >
          <ThumbsDownIcon className={cn(vote === -1 && 'fill-current')} />
          Downvote
        </Button>
        <Button
          size="icon-lg"
          variant="ghost"
          onClick={copyLink}
          aria-label="Copy link to this meme"
          title="Copy link to this meme"
        >
          <LinkIcon />
        </Button>
        <Button size="lg" className="w-full sm:ml-auto sm:w-auto" onClick={onNext}>
          {nextLabel}
          <ArrowRightIcon />
        </Button>
      </div>

      <p className="hidden px-1 text-sm text-muted-foreground sm:block">
        Use <Kbd>↑</Kbd> to upvote, <Kbd>↓</Kbd> to downvote and{' '}
        <Kbd>→</Kbd> for the next meme.
      </p>
    </figure>
  )
}

export function MemeStageSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading meme">
      <div className="flex justify-between px-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-[min(68vh,32rem)] rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="ml-auto h-10 w-36" />
      </div>
    </div>
  )
}
