import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function EliminationPhase({ game }: { game: TuringTableGame }) {
  const playerLabelById = new Map(game.players.map((player) => [player.id, player.label]))

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Results</p>
      <h2 className="mt-4 font-display text-2xl text-[#f8ecd1]">
        {game.eliminatedThisRound
          ? `${game.eliminatedThisRound.label} was voted out.`
          : 'The vote tied again — no one goes home this round.'}
      </h2>
      <p className="mt-3 text-sm text-slate-400">Their role stays a secret.</p>

      {game.votes.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">Who voted for who</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {game.votes.map((vote) => {
              const voterLabel = playerLabelById.get(vote.voterId) ?? vote.voterId
              const targetLabel = playerLabelById.get(vote.targetId) ?? vote.targetId

              return (
                <li key={`${vote.voterId}-${vote.targetId}`}>
                  <span className="font-semibold text-amber-200/80">{voterLabel}</span>
                  <span className="mx-2 text-slate-500">→</span>
                  <span>{targetLabel}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <button
          className="rounded-full border border-amber-200/25 bg-amber-200 px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100"
          onClick={game.startNextRound}
          type="button"
        >
          Next round
        </button>
      </div>
    </div>
  )
}
