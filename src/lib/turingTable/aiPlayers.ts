import { generateGeminiJSON, generateGeminiText } from '../gemini'
import type { AnonymizedAnswer, DiscussionLine, TuringTablePlayer } from './types'

function cleanOneLiner(text: string) {
  return text
    .trim()
    .replace(/^"+|"+$/g, '')
    .split('\n')[0]
    .trim()
}

export async function generateAiAnswer(params: {
  player: TuringTablePlayer
  prompt: string
}): Promise<string> {
  const { prompt } = params

  const instruction = `You're one of several players in a party game called Turing Table, where a group of friends
try to spot the one real human hiding among AI players by comparing one-sentence answers to prompts.
Answer the prompt below the way a real person would text a quick reply to a friend group chat: casual,
a little imperfect, no more than one sentence, no hedging, no disclaimers, and never mention being an AI
or a language model.

Prompt: "${prompt}"

Reply with just the one-sentence answer and nothing else.`

  const text = await generateGeminiText(instruction)
  return cleanOneLiner(text)
}

export async function generateAiDiscussionLine(params: {
  player: TuringTablePlayer
  prompt: string
  ownAnswer: string
  anonymizedAnswers: AnonymizedAnswer[]
  transcriptSoFar: DiscussionLine[]
  remainingPlayers: TuringTablePlayer[]
}): Promise<string> {
  const { player, prompt, ownAnswer, anonymizedAnswers, transcriptSoFar, remainingPlayers } = params

  const answerList = anonymizedAnswers
    .map((answer) => `${answer.answerLabel}: "${answer.text}"`)
    .join('\n')

  const transcriptText = transcriptSoFar.length
    ? transcriptSoFar.map((line) => `${line.speakerLabel}: ${line.text}`).join('\n')
    : '(no one has spoken yet)'

  const playerNames = remainingPlayers.map((remainingPlayer) => remainingPlayer.label).join(', ')

  const instruction = `You are ${player.label}, a player at the table in the social deduction game Turing Table.
One person at this table is secretly a real human answering by voice; everyone else is an AI, but nobody
announces which they are. The prompt everyone answered was: "${prompt}"

Here are this round's anonymized one-sentence answers:
${answerList}

Your own answer was: "${ownAnswer}"

Players still at the table: ${playerNames}

Discussion so far:
${transcriptText}

Say your next contribution to the discussion out loud, as ${player.label} would speak it: casual, opinionated,
1-2 short sentences, spoken like real conversation (not written like an essay). You can react to a specific
answer, question someone, defend your own answer if it's under suspicion, or point out something that feels off.
Never explicitly say "I'm the human" or "I'm an AI" or anything that flatly reveals a role.

Reply with just what you say, nothing else.`

  const text = await generateGeminiText(instruction)
  return cleanOneLiner(text)
}

export async function generateAiVote(params: {
  player: TuringTablePlayer
  prompt: string
  ownAnswer: string
  anonymizedAnswers: AnonymizedAnswer[]
  transcript: DiscussionLine[]
  candidates: TuringTablePlayer[]
}): Promise<string> {
  const { player, prompt, ownAnswer, anonymizedAnswers, transcript, candidates } = params

  const answerList = anonymizedAnswers
    .map((answer) => `${answer.answerLabel}: "${answer.text}"`)
    .join('\n')

  const transcriptText = transcript.length
    ? transcript.map((line) => `${line.speakerLabel}: ${line.text}`).join('\n')
    : '(no discussion happened)'

  const candidateList = candidates.map((candidate) => `${candidate.id}: ${candidate.label}`).join('\n')

  const instruction = `You are ${player.label} in the social deduction game Turing Table. One player at the table
is secretly a real human; the rest are AI players like you, but nobody has confirmed roles. The prompt was:
"${prompt}"

Anonymized one-sentence answers this round:
${answerList}

Your own answer was: "${ownAnswer}"

Full discussion transcript:
${transcriptText}

You must vote to eliminate one other player who you think is most likely the human. Choose from these
candidates (never vote for yourself, your id is "${player.id}"):
${candidateList}

Respond with ONLY a JSON object of the shape {"targetId": string, "reason": string} where targetId is exactly
one of the candidate ids above.`

  const result = await generateGeminiJSON<{ targetId: string; reason: string }>(instruction)
  const isValidTarget = candidates.some((candidate) => candidate.id === result.targetId)

  if (isValidTarget) {
    return result.targetId
  }

  // Fall back to a random valid candidate if Gemini returns something unusable.
  return candidates[Math.floor(Math.random() * candidates.length)].id
}
