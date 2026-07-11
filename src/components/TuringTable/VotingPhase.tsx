import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function VotingPhase({ game }: { game: TuringTableGame }) {
  const candidates = (
    game.tieCandidateIds
      ? game.remainingPlayers.filter((player) => game.tieCandidateIds?.includes(player.id))
      : game.remainingPlayers
  ).filter((player) => player.id !== 'human')

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">
        {game.tieCandidateIds ? 'Tie — revote' : 'Cast your vote'}
      </p>
      <h2 className="mt-3 font-display text-xl text-[#f8ecd1]">Who do you think is human?</h2>

      <div className="mt-6 grid gap-3">
        {candidates.map((candidate) => (
          <button
            className="rounded-full border border-white/10 bg-neutral-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-200/30 hover:bg-neutral-800 disabled:opacity-50"
            disabled={game.isLoadingAi}
            key={candidate.id}
            onClick={() => void game.submitHumanVote(candidate.id)}
            type="button"
          >
            {candidate.label}
          </button>
        ))}
      </div>

      {game.isLoadingAi ? <p className="mt-6 text-xs text-slate-400">Tallying the table&apos;s votes...</p> : null}
    </div>
  )
}
