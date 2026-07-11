import type { ElevenLabsCharacterType } from '../elevenlabs'

export type PlayerRole = 'human' | 'ai'

export type TuringTablePlayer = {
  id: string
  label: string
  role: PlayerRole
  voiceType: ElevenLabsCharacterType | null
  eliminated: boolean
}

export type RoundAnswer = {
  playerId: string
  text: string
}

export type AnonymizedAnswer = {
  answerLabel: string
  playerId: string
  text: string
}

export type DiscussionLine = {
  playerId: string
  speakerLabel: string
  text: string
}

export type VoteRecord = {
  voterId: string
  targetId: string
}

export type RoundRecord = {
  roundNumber: number
  prompt: string
  answers: RoundAnswer[]
  anonymizedOrder: AnonymizedAnswer[]
  discussionTranscript: DiscussionLine[]
  votes: VoteRecord[]
  tieRevoteVotes: VoteRecord[] | null
  eliminatedPlayerId: string | null
}

export type GamePhase =
  | 'answering'
  | 'revealing'
  | 'discussing'
  | 'voting'
  | 'tie-revote'
  | 'elimination'
  | 'gameover'

export type GameOutcome = 'human-win' | 'ai-win' | null
