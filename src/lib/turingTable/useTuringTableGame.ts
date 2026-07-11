import { useCallback, useMemo, useRef, useState } from 'react'
import { getCampfireCharacterVoiceAssignments } from '../campfireCharacters'
import { createElevenLabsDubbingUrl } from '../elevenlabs'
import { generateAiAnswer, generateAiDiscussionLine, generateAiVote } from './aiPlayers'
import { pickRandomPrompt } from './prompts'
import type {
  AnonymizedAnswer,
  DiscussionLine,
  GameOutcome,
  GamePhase,
  RoundAnswer,
  RoundRecord,
  TuringTablePlayer,
  VoteRecord,
} from './types'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function answerLabelForIndex(index: number) {
  return `Answer ${String.fromCharCode(65 + index)}`
}

function createInitialPlayers(): TuringTablePlayer[] {
  const aiRoster = getCampfireCharacterVoiceAssignments()

  const aiPlayers: TuringTablePlayer[] = aiRoster.map((character) => ({
    id: character.characterId,
    label: character.label,
    role: 'ai',
    voiceType: character.voiceType,
    eliminated: false,
  }))

  const humanPlayer: TuringTablePlayer = {
    id: 'human',
    label: 'You',
    role: 'human',
    voiceType: null,
    eliminated: false,
  }

  return [humanPlayer, ...aiPlayers]
}

async function playDiscussionAudio(voiceType: TuringTablePlayer['voiceType'], text: string) {
  if (!voiceType) {
    return
  }

  try {
    const audioUrl = await createElevenLabsDubbingUrl([{ characterType: voiceType, text }])

    await new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl)
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  } catch {
    // If voice generation fails, just give the caption a moment on screen.
    await new Promise((resolve) => setTimeout(resolve, 1600))
  }
}

export function useTuringTableGame() {
  const [players, setPlayers] = useState<TuringTablePlayer[]>(() => createInitialPlayers())
  const [phase, setPhase] = useState<GamePhase>('answering')
  const [roundNumber, setRoundNumber] = useState(1)
  const [usedPrompts, setUsedPrompts] = useState<string[]>([])
  const [currentPrompt, setCurrentPrompt] = useState(() => pickRandomPrompt([]))
  const [currentAnswers, setCurrentAnswers] = useState<RoundAnswer[]>([])
  const [anonymizedOrder, setAnonymizedOrder] = useState<AnonymizedAnswer[]>([])
  const [discussionTranscript, setDiscussionTranscript] = useState<DiscussionLine[]>([])
  const [speakingOrder, setSpeakingOrder] = useState<string[]>([])
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0)
  const [votes, setVotes] = useState<VoteRecord[]>([])
  const [tieCandidateIds, setTieCandidateIds] = useState<string[] | null>(null)
  const [eliminatedThisRound, setEliminatedThisRound] = useState<TuringTablePlayer | null>(null)
  const [history, setHistory] = useState<RoundRecord[]>([])
  const [outcome, setOutcome] = useState<GameOutcome>(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playersRef = useRef(players)
  playersRef.current = players

  const remainingPlayers = useMemo(() => players.filter((player) => !player.eliminated), [players])
  const currentSpeakerId = speakingOrder[currentSpeakerIndex] ?? null

  const findPlayer = useCallback(
    (playerId: string) => playersRef.current.find((player) => player.id === playerId) ?? null,
    [],
  )

  const submitHumanAnswer = useCallback(
    async (humanText: string) => {
      setError(null)
      setIsLoadingAi(true)

      try {
        const activePlayers = playersRef.current.filter((player) => !player.eliminated)
        const aiPlayersActive = activePlayers.filter((player) => player.role === 'ai')

        const aiAnswers = await Promise.all(
          aiPlayersActive.map(async (player) => ({
            playerId: player.id,
            text: await generateAiAnswer({ player, prompt: currentPrompt }),
          })),
        )

        const humanAnswer: RoundAnswer = { playerId: 'human', text: humanText.trim() }
        const allAnswers = [humanAnswer, ...aiAnswers]
        const shuffled = shuffle(allAnswers)

        const anonymized: AnonymizedAnswer[] = shuffled.map((answer, index) => ({
          answerLabel: answerLabelForIndex(index),
          playerId: answer.playerId,
          text: answer.text,
        }))

        setCurrentAnswers(allAnswers)
        setAnonymizedOrder(anonymized)
        setPhase('revealing')
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong getting AI answers.')
      } finally {
        setIsLoadingAi(false)
      }
    },
    [currentPrompt],
  )

  const runDiscussionTurn = useCallback(
    async (order: string[], index: number, transcriptSoFar: DiscussionLine[]) => {
      if (index >= order.length) {
        setPhase('voting')
        return
      }

      const speakerId = order[index]
      const speaker = findPlayer(speakerId)

      if (!speaker || speaker.role === 'human') {
        // Wait for the human to submit their own line through the UI.
        return
      }

      setIsLoadingAi(true)

      try {
        const ownAnswer = currentAnswers.find((answer) => answer.playerId === speaker.id)?.text ?? ''
        const remaining = playersRef.current.filter((player) => !player.eliminated)

        const line = await generateAiDiscussionLine({
          player: speaker,
          prompt: currentPrompt,
          ownAnswer,
          anonymizedAnswers: anonymizedOrder,
          transcriptSoFar,
          remainingPlayers: remaining,
        })

        const newLine: DiscussionLine = { playerId: speaker.id, speakerLabel: speaker.label, text: line }
        const nextTranscript = [...transcriptSoFar, newLine]
        setDiscussionTranscript(nextTranscript)
        setIsLoadingAi(false)

        await playDiscussionAudio(speaker.voiceType, line)

        setCurrentSpeakerIndex(index + 1)
        await runDiscussionTurn(order, index + 1, nextTranscript)
      } catch (caughtError) {
        setIsLoadingAi(false)
        setError(caughtError instanceof Error ? caughtError.message : 'A player lost their train of thought.')
      }
    },
    [anonymizedOrder, currentAnswers, currentPrompt, findPlayer],
  )

  const beginDiscussion = useCallback(() => {
    const order = shuffle(remainingPlayers.map((player) => player.id))
    setSpeakingOrder(order)
    setCurrentSpeakerIndex(0)
    setDiscussionTranscript([])
    setPhase('discussing')
    void runDiscussionTurn(order, 0, [])
  }, [remainingPlayers, runDiscussionTurn])

  const submitHumanDiscussionLine = useCallback(
    (text: string) => {
      const humanPlayer = findPlayer('human')

      if (!humanPlayer) {
        return
      }

      const newLine: DiscussionLine = { playerId: 'human', speakerLabel: humanPlayer.label, text: text.trim() }
      const nextTranscript = [...discussionTranscript, newLine]
      setDiscussionTranscript(nextTranscript)

      const nextIndex = currentSpeakerIndex + 1
      setCurrentSpeakerIndex(nextIndex)
      void runDiscussionTurn(speakingOrder, nextIndex, nextTranscript)
    },
    [currentSpeakerIndex, discussionTranscript, findPlayer, runDiscussionTurn, speakingOrder],
  )

  const finalizeVotesAndTally = useCallback(
    (allVotes: VoteRecord[], candidates: TuringTablePlayer[], isRevote: boolean) => {
      const tally = new Map<string, number>()

      allVotes.forEach((vote) => {
        tally.set(vote.targetId, (tally.get(vote.targetId) ?? 0) + 1)
      })

      const maxVotes = Math.max(...candidates.map((candidate) => tally.get(candidate.id) ?? 0))
      const topCandidates = candidates.filter((candidate) => (tally.get(candidate.id) ?? 0) === maxVotes)

      if (topCandidates.length === 1) {
        const eliminatedId = topCandidates[0].id
        const updatedPlayers = playersRef.current.map((player) =>
          player.id === eliminatedId ? { ...player, eliminated: true } : player,
        )

        setPlayers(updatedPlayers)
        setEliminatedThisRound(topCandidates[0])
        setTieCandidateIds(null)

        const stillRemaining = updatedPlayers.filter((player) => !player.eliminated)
        const humanEliminated = eliminatedId === 'human'
        const humanSurvivedToFinalTwo = !humanEliminated && stillRemaining.length <= 2

        if (humanEliminated) {
          setOutcome('ai-win')
        } else if (humanSurvivedToFinalTwo) {
          setOutcome('human-win')
        }

        setHistory((previousHistory) => [
          ...previousHistory,
          {
            roundNumber,
            prompt: currentPrompt,
            answers: currentAnswers,
            anonymizedOrder,
            discussionTranscript,
            votes: allVotes,
            tieRevoteVotes: null,
            eliminatedPlayerId: eliminatedId,
          },
        ])

        setPhase(humanEliminated || humanSurvivedToFinalTwo ? 'gameover' : 'elimination')
      } else if (isRevote) {
        // Tied again on the revote: nobody goes home this round.
        setEliminatedThisRound(null)
        setTieCandidateIds(null)

        setHistory((previousHistory) => [
          ...previousHistory,
          {
            roundNumber,
            prompt: currentPrompt,
            answers: currentAnswers,
            anonymizedOrder,
            discussionTranscript,
            votes: allVotes,
            tieRevoteVotes: allVotes,
            eliminatedPlayerId: null,
          },
        ])

        setPhase('elimination')
      } else {
        // First tie: revote among just the tied candidates.
        setTieCandidateIds(topCandidates.map((candidate) => candidate.id))
        setVotes([])
        setPhase('tie-revote')
      }
    },
    [anonymizedOrder, currentAnswers, currentPrompt, discussionTranscript, roundNumber],
  )

  const submitHumanVote = useCallback(
    async (targetId: string) => {
      setError(null)
      setIsLoadingAi(true)

      try {
        const isRevote = phase === 'tie-revote'
        const candidatePool = tieCandidateIds
          ? remainingPlayers.filter((player) => tieCandidateIds.includes(player.id))
          : remainingPlayers

        const aiVoters = remainingPlayers.filter((player) => player.role === 'ai')

        const aiVotes = await Promise.all(
          aiVoters.map(async (voter) => {
            const candidates = candidatePool.filter((candidate) => candidate.id !== voter.id)

            const targetIdChosen = await generateAiVote({
              player: voter,
              prompt: currentPrompt,
              ownAnswer: currentAnswers.find((answer) => answer.playerId === voter.id)?.text ?? '',
              anonymizedAnswers: anonymizedOrder,
              transcript: discussionTranscript,
              candidates,
            })

            return { voterId: voter.id, targetId: targetIdChosen }
          }),
        )

        const humanVote: VoteRecord = { voterId: 'human', targetId }
        const allVotes = [humanVote, ...aiVotes]
        setVotes(allVotes)
        finalizeVotesAndTally(allVotes, candidatePool, isRevote)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'The vote tally got tangled up.')
      } finally {
        setIsLoadingAi(false)
      }
    },
    [
      anonymizedOrder,
      currentAnswers,
      currentPrompt,
      discussionTranscript,
      finalizeVotesAndTally,
      phase,
      remainingPlayers,
      tieCandidateIds,
    ],
  )

  const startNextRound = useCallback(() => {
    const nextUsedPrompts = [...usedPrompts, currentPrompt]
    const nextPrompt = pickRandomPrompt(nextUsedPrompts)

    setUsedPrompts(nextUsedPrompts)
    setCurrentPrompt(nextPrompt)
    setRoundNumber((previous) => previous + 1)
    setCurrentAnswers([])
    setAnonymizedOrder([])
    setDiscussionTranscript([])
    setSpeakingOrder([])
    setCurrentSpeakerIndex(0)
    setVotes([])
    setTieCandidateIds(null)
    setEliminatedThisRound(null)
    setPhase('answering')
  }, [currentPrompt, usedPrompts])

  return {
    phase,
    roundNumber,
    players,
    remainingPlayers,
    currentPrompt,
    anonymizedOrder,
    discussionTranscript,
    speakingOrder,
    currentSpeakerId,
    votes,
    tieCandidateIds,
    eliminatedThisRound,
    history,
    outcome,
    isLoadingAi,
    error,
    submitHumanAnswer,
    beginDiscussion,
    submitHumanDiscussionLine,
    submitHumanVote,
    startNextRound,
  }
}

export type TuringTableGame = ReturnType<typeof useTuringTableGame>
