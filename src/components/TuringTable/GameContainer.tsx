import { useTuringTableGame } from '../../lib/turingTable/useTuringTableGame'
import AnswerPhase from './AnswerPhase'
import DiscussionPhase from './DiscussionPhase'
import EliminationPhase from './EliminationPhase'
import GameOverPhase from './GameOverPhase'
import RevealPhase from './RevealPhase'
import VotingPhase from './VotingPhase'

export default function GameContainer() {
  const game = useTuringTableGame()

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <div className="mb-6 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
        <span>Round {game.roundNumber}</span>
        <span>{game.remainingPlayers.length} at the table</span>
      </div>

      {game.error ? (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {game.error}
        </div>
      ) : null}

      {game.phase === 'answering' ? <AnswerPhase game={game} /> : null}
      {game.phase === 'revealing' ? <RevealPhase game={game} /> : null}
      {game.phase === 'discussing' ? <DiscussionPhase game={game} /> : null}
      {game.phase === 'voting' || game.phase === 'tie-revote' ? <VotingPhase game={game} /> : null}
      {game.phase === 'elimination' ? <EliminationPhase game={game} /> : null}
      {game.phase === 'gameover' ? <GameOverPhase game={game} /> : null}
    </div>
  )
}
