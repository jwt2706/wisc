import { useEffect } from 'react'
import { useTuringTableGame } from '../../lib/turingTable/useTuringTableGame'
import AnswerPhase from './AnswerPhase'
import DiscussionPhase from './DiscussionPhase'
import EliminationPhase from './EliminationPhase'
import GameOverPhase from './GameOverPhase'
import RevealPhase from './RevealPhase'
import VotingPhase from './VotingPhase'

type GameContainerProps = {
  playerName: string
  onSpeakerChange?: (speakerId: string | null) => void
  onHiddenCharacterIdsChange?: (characterIds: string[]) => void
  onCharacterSpeechChange?: (speechByCharacterId: Record<string, string>) => void
}

export default function GameContainer({
  playerName,
  onSpeakerChange,
  onHiddenCharacterIdsChange,
  onCharacterSpeechChange,
}: GameContainerProps) {
  const game = useTuringTableGame(playerName)

  useEffect(() => {
    if (!onSpeakerChange) {
      return
    }

    const speakerId = game.phase === 'discussing' && !game.isLoadingAi ? game.currentSpeakerId : null
    onSpeakerChange(speakerId === 'human' ? null : speakerId)
  }, [game.currentSpeakerId, game.isLoadingAi, game.phase, onSpeakerChange])

  useEffect(() => {
    if (!onHiddenCharacterIdsChange) {
      return
    }

    const hiddenCharacterIds = game.players
      .filter((player) => player.eliminated && player.role === 'ai')
      .map((player) => player.id)

    onHiddenCharacterIdsChange(hiddenCharacterIds)
  }, [game.players, onHiddenCharacterIdsChange])

  useEffect(() => {
    if (!onCharacterSpeechChange) {
      return
    }

    const shouldShowRoundAnswers =
      game.phase === 'revealing' ||
      game.phase === 'discussing' ||
      game.phase === 'voting' ||
      game.phase === 'tie-revote'

    if (!shouldShowRoundAnswers) {
      onCharacterSpeechChange({})
      return
    }

    const speechByCharacterId: Record<string, string> = {}
    game.anonymizedOrder.forEach((answer) => {
      if (answer.playerId !== 'human') {
        speechByCharacterId[answer.playerId] = answer.text
      }
    })

    onCharacterSpeechChange(speechByCharacterId)
  }, [game.anonymizedOrder, game.phase, onCharacterSpeechChange])

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between rounded-full border border-white/10 bg-neutral-950/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200/70 backdrop-blur-md">
          <span>Round {game.roundNumber}</span>
          <span>{game.remainingPlayers.length} at the table</span>
        </div>

        <div className="flex max-h-[78vh] flex-col gap-3 overflow-y-auto px-1 pb-1">
          {game.error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
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
      </div>
    </div>
  )
}
