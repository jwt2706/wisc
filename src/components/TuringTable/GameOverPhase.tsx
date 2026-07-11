import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function GameOverPhase({ game }: { game: TuringTableGame }) {
  const isHumanWin = game.outcome === 'human-win'

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Game over</p>
      <h2 className="mt-4 font-display text-3xl text-[#f8ecd1]">
        {isHumanWin ? 'You blended in and survived.' : 'The table figured you out.'}
      </h2>
      <p className="mt-3 text-sm text-slate-400">
        {isHumanWin
          ? 'You made it down to the final two without getting caught.'
          : 'You were voted out before making the final two.'}
      </p>

      <div className="mt-8 flex justify-center">
        <button
          className="rounded-full border border-white/10 bg-neutral-800 px-8 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white/20 hover:bg-neutral-700"
          onClick={() => window.location.reload()}
          type="button"
        >
          Play again
        </button>
      </div>
    </div>
  )
}
