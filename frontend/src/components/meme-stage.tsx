import { Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  HeartIcon,
  ImageOffIcon,
  LinkIcon,
  Loader2Icon,
  ThumbsDownIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Kbd } from '#/components/ui/kbd'
import { Skeleton } from '#/components/ui/skeleton'
import { voteOnMeme, type Meme } from '#/lib/api'
import { cn } from '#/lib/utils'
import { getVote, saveVote } from '#/lib/votes'

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v'])

export const isVideo = (meme: Pick<Meme, 'format' | 'extension'>) =>
  meme.format === 'video' ||
  VIDEO_EXTENSIONS.has(meme.extension.toLowerCase())

/**
 * The frame is a fixed size whatever the meme's dimensions, so the controls
 * never jump around between memes and the skeleton matches exactly.
 */
export const frameSize = 'h-[min(46svh,26rem)] sm:h-[min(68vh,40rem)]'

type MediaStatus = 'loading' | 'loaded' | 'error'

function MemeMedia({ meme }: { meme: Meme }) {
  const video = isVideo(meme)
  const [status, setStatus] = useState<MediaStatus>('loading')
  const [small, setSmall] = useState<{ w: number; h: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Media rendered on the server can finish loading before React hydrates
  // and attaches its handlers, so check its state once on mount.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) {
      if (img.naturalWidth > 0) onImageLoad(img)
      else setStatus('error')
    }
    const vid = videoRef.current
    if (vid) {
      if (vid.error) setStatus('error')
      else if (vid.readyState >= 2) setStatus('loaded')
    }
  }, [])

  // Tiny images are scaled up 2x so they don't get lost in the frame.
  function onImageLoad(img: HTMLImageElement) {
    const { naturalWidth: w, naturalHeight: h } = img
    setSmall(w < 240 && h < 240 ? { w, h } : null)
    setStatus('loaded')
  }

  const loaded = status === 'loaded'
  const label = `Meme #${meme.meme_id}`

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-xl border-2 border-foreground',
        frameSize,
        video ? 'bg-black' : 'bg-card',
      )}
    >
      {/* A blurred copy fills the space around memes that don't match the frame. */}
      {!video && loaded && (
        <img
          src={meme.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-45 blur-2xl saturate-150 dark:opacity-30"
        />
      )}

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          status === 'error' && 'invisible',
        )}
      >
        {video ? (
          <video
            ref={videoRef}
            src={meme.url}
            aria-label={label}
            className={cn(
              'size-full object-contain transition-opacity duration-300 motion-reduce:transition-none',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />
        ) : (
          <img
            ref={imgRef}
            src={meme.url}
            alt={label}
            decoding="async"
            className={cn(
              'max-h-full max-w-full object-contain transition-opacity duration-300 motion-reduce:transition-none',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
            style={
              small
                ? {
                    width: small.w * 2,
                    height: small.h * 2,
                    imageRendering: small.w <= 128 ? 'pixelated' : 'auto',
                  }
                : undefined
            }
            onLoad={(e) => onImageLoad(e.currentTarget)}
            onError={() => setStatus('error')}
          />
        )}
      </div>

      {status === 'loading' && (
        <div
          className="absolute inset-0 grid place-items-center bg-muted"
          role="status"
        >
          <Loader2Icon className="size-7 animate-spin text-muted-foreground motion-reduce:animate-none" />
          <span className="sr-only">Loading meme</span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
          <ImageOffIcon className="size-8 text-muted-foreground" />
          <p className="max-w-[30ch] text-muted-foreground">
            {video
              ? "This video can't be played here."
              : "This meme's file couldn't be loaded."}
          </p>
          <a
            href={meme.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
          >
            Open the file
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </div>
      )}
    </div>
  )
}

type StageProps = {
  meme: Meme
  onNext: () => void
  nextLabel?: string
  /** True while the next meme is being fetched; this one stays on screen. */
  pending?: boolean
}

export function MemeStage({
  meme,
  onNext,
  nextLabel = 'Next meme',
  pending = false,
}: StageProps) {
  const [score, setScore] = useState(meme.score)
  const [vote, setVote] = useState<1 | -1 | undefined>()

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

  const canVote = vote === undefined && !mutation.isPending && !pending

  const castVote = (votes: 1 | -1) => {
    if (canVote) mutation.mutate(votes)
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
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied', { description: url })
    } catch {
      toast.error("Couldn't copy the link", { description: url })
    }
  }

  return (
    <figure className="flex flex-col gap-3" aria-busy={pending}>
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

      <div className="relative">
        <MemeMedia key={meme.url} meme={meme} />
        {pending && (
          <div
            className="absolute inset-0.5 grid place-items-center rounded-[calc(var(--radius)+2px)] bg-background/60 backdrop-blur-sm"
            role="status"
          >
            <Loader2Icon className="size-7 animate-spin motion-reduce:animate-none" />
            <span className="sr-only">Loading the next meme</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:items-center">
        <Button
          size="lg"
          variant="outline"
          aria-pressed={vote === 1}
          disabled={!canVote}
          onClick={() => castVote(1)}
          className={cn(
            'border-2',
            vote !== undefined && 'disabled:opacity-100',
            vote === 1 && 'border-pink bg-pink text-white',
            vote === -1 && 'disabled:opacity-40',
          )}
        >
          <HeartIcon className={cn(vote === 1 && 'fill-current')} />
          Upvote
        </Button>
        <Button
          size="lg"
          variant="outline"
          aria-pressed={vote === -1}
          disabled={!canVote}
          onClick={() => castVote(-1)}
          className={cn(
            'border-2',
            vote !== undefined && 'disabled:opacity-100',
            vote === -1 && 'border-blue bg-blue text-white',
            vote === 1 && 'disabled:opacity-40',
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
        <Button
          size="lg"
          className="col-span-3 sm:ml-auto"
          onClick={onNext}
        >
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
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label="Loading meme"
    >
      <div className="flex justify-between px-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton
        className={cn(
          'grid place-items-center rounded-xl border-2 border-transparent',
          frameSize,
        )}
      >
        <Loader2Icon className="size-7 animate-spin text-muted-foreground motion-reduce:animate-none" />
      </Skeleton>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex">
        <Skeleton className="h-10 sm:w-28" />
        <Skeleton className="h-10 sm:w-32" />
        <Skeleton className="size-10" />
        <Skeleton className="col-span-3 h-10 sm:ml-auto sm:w-36" />
      </div>
    </div>
  )
}
