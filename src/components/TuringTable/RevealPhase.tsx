import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function RevealPhase({ game }: { game: TuringTableGame }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">
        Everyone&apos;s answers
      </p>
      <h2 className="mt-3 text-center font-display text-xl text-[#f8ecd1]">{game.currentPrompt}</h2>

      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-300">
        Check the speech bubbles above each player in the scene to see what everyone answered this round.
        Keep those answers in mind as the discussion gets tense.
      </p>

      <div className="mt-8 flex justify-center">
        <button
          className="rounded-full border border-amber-200/25 bg-amber-200 px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100"
          onClick={game.beginDiscussion}
          type="button"
        >
          Start discussion
        </button>
      </div>
    </div>
  )
}
