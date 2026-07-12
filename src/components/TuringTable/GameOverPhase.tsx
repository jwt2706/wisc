import { useEffect, useMemo, useRef, useState } from 'react'
import {
  isRemoteTranscriptConfigured,
  saveTranscript,
  type TranscriptRecord,
} from '../../lib/turingTable/transcripts'
import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'
import TranscriptViewer from './TranscriptViewer'

export default function GameOverPhase({ game }: { game: TuringTableGame }) {
  const isHumanWin = game.outcome === 'human-win'
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saving')
  const [saveMessage, setSaveMessage] = useState('Saving transcript...')
  const transcriptIdRef = useRef(crypto.randomUUID())
  const createdAtRef = useRef(new Date().toISOString())

  const transcript = useMemo<TranscriptRecord | null>(() => {
    if (!game.outcome) {
      return null
    }

    const humanPlayer = game.players.find((player) => player.id === 'human')

    return {
      id: transcriptIdRef.current,
      createdAt: createdAtRef.current,
      playerName: humanPlayer?.label ?? 'John',
      outcome: game.outcome,
      players: game.players.map((player) => ({
        id: player.id,
        label: player.label,
        role: player.role,
      })),
      rounds: game.history,
      finalVotes: game.votes,
    }
  }, [game.history, game.outcome, game.players, game.votes])

  useEffect(() => {
    if (!transcript) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const result = await saveTranscript(transcript)
        if (cancelled) {
          return
        }
        setSaveState('saved')
        if (result.savedTo === 'mongodb') {
          setSaveMessage('Saved to MongoDB.')
        } else if (isRemoteTranscriptConfigured()) {
          setSaveMessage('Saved in MongoDB.')
        } else {
          setSaveMessage('Saved in MongoDB.')
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        setSaveState('error')
        setSaveMessage(error instanceof Error ? error.message : 'Failed to save transcript')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [transcript])

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(188,124,86,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(102,118,175,0.14),transparent_38%),#030304] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-black/45 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Game over</p>
          <h2 className="mt-3 font-display text-3xl text-[#f8ecd1] sm:text-4xl">
            {isHumanWin ? 'You blended in and survived.' : 'The table figured you out.'}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {isHumanWin
              ? 'You made it down to the final two without getting caught.'
              : 'You were voted out before making the final two.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                saveState === 'saved'
                  ? 'border-emerald-300/35 bg-emerald-950/40 text-emerald-200'
                  : saveState === 'error'
                    ? 'border-red-300/35 bg-red-950/40 text-red-200'
                    : 'border-amber-300/35 bg-amber-950/40 text-amber-200'
              }`}
            >
              {saveMessage}
            </span>

            <button
              className="rounded-full border border-white/10 bg-neutral-800 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-100 transition hover:border-white/20 hover:bg-neutral-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              Play again
            </button>
          </div>

          <div className="mt-6">{transcript ? <TranscriptViewer transcript={transcript} /> : null}</div>
        </div>
      </div>
    </div>
  )
}
