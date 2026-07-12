import { useEffect, useState } from 'react'
import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function DiscussionPhase({ game }: { game: TuringTableGame }) {
  const [manualText, setManualText] = useState('')

  const currentSpeaker = game.players.find((player) => player.id === game.currentSpeakerId)
  const isHumanTurn = currentSpeaker?.role === 'human'

  useEffect(() => {
    setManualText('')
  }, [game.currentSpeakerId])

  function handleSubmit() {
    const finalText = manualText.trim()

    if (!finalText) {
      return
    }

    game.submitHumanDiscussionLine(finalText)
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Discussion</p>
      <p className="mt-3 text-center text-sm text-slate-400">
        Find who sounds most human. Human-like answers are suspicious here.
      </p>

      <div className="mt-6 max-h-72 space-y-3 overflow-y-auto pr-1">
        {game.discussionTranscript.map((line, index) => (
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm" key={index}>
            <span className="mr-2 font-semibold text-amber-200/80">{line.speakerLabel}:</span>
            <span className="text-slate-100">{line.text}</span>
          </div>
        ))}
      </div>

      {isHumanTurn ? (
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <p className="text-sm text-slate-300">Your turn — cast suspicion on who sounds most human.</p>
          <input
            autoFocus
            className="w-full max-w-md rounded-full border border-white/15 bg-neutral-900/80 px-5 py-3 text-center text-sm text-slate-100 outline-none focus:border-amber-200/40"
            onChange={(event) => setManualText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSubmit()
              }
            }}
            placeholder="Type what you'd say..."
            type="text"
            value={manualText}
          />
          <button
            className="rounded-full border border-amber-200/25 bg-amber-200 px-6 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100 disabled:opacity-50"
            disabled={!manualText.trim()}
            onClick={handleSubmit}
            type="button"
          >
            Say it
          </button>
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-slate-400">
          {game.isLoadingAi
            ? 'The table is gathering its thoughts...'
            : currentSpeaker
              ? `${currentSpeaker.label} is speaking...`
              : 'Moving to the vote...'}
        </p>
      )}
    </div>
  )
}
