import { generateGeminiJSON, generateGeminiText } from '../gemini'
import type { AnonymizedAnswer, DiscussionLine, TuringTablePlayer } from './types'

function cleanOneLiner(text: string) {
  return text
    .trim()
    .replace(/^"+|"+$/g, '')
    .split('\n')[0]
    .trim()
}

// ---------------------------------------------------------------------------
// Personalities. Each AI player gets a short trait that shapes tone and word
// choice, so a batch of 5 answers/lines/votes doesn't read like the same
// voice five times. Assignment is deterministic from the player's id (a
// simple string hash), so a given player keeps the same personality for the
// whole game rather than it randomly shifting between calls. When assigning
// for a whole batch, collisions are resolved so nobody in that batch shares
// a trait with another player in the same batch.
// ---------------------------------------------------------------------------

const PERSONALITY_TRAITS = [
  'dry and sarcastic, downplays everything',
  'over-the-top enthusiastic, lots of exclamation energy',
  'blunt and to the point, almost rude about it',
  'anxious, hedges and second-guesses out loud',
  'confident know-it-all, a little smug',
  'goofy, cracks jokes even when things get serious',
  'chill and unbothered, barely engaged',
  'competitive and a little paranoid about being picked off',
  'overly literal, takes things at face value',
  'dramatic, treats everything like a huge deal',
  'quiet and terse, says the bare minimum',
  'chatty, rambles a bit before getting to the point',
]

function hashPlayerId(playerId: string) {
  let hash = 0
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Single-player personality lookup, for the standalone fallback functions. */
function personalityForPlayer(playerId: string) {
  return PERSONALITY_TRAITS[hashPlayerId(playerId) % PERSONALITY_TRAITS.length]
}

/**
 * Assigns a personality to every player in a batch, guaranteeing no two
 * players in the SAME batch get the same trait (falls back to linear probing
 * through the trait list on a collision). Each player's preferred trait is
 * still their deterministic hash-based one, so it stays stable across
 * batches as long as the rest of the table doesn't force a reassignment.
 */
function assignPersonalities(players: TuringTablePlayer[]): Map<string, string> {
  const used = new Set<string>()
  const assignments = new Map<string, string>()

  for (const player of players) {
    const preferredIndex = hashPlayerId(player.id) % PERSONALITY_TRAITS.length
    for (let attempt = 0; attempt < PERSONALITY_TRAITS.length; attempt++) {
      const trait = PERSONALITY_TRAITS[(preferredIndex + attempt) % PERSONALITY_TRAITS.length]
      if (!used.has(trait)) {
        used.add(trait)
        assignments.set(player.id, trait)
        break
      }
    }
  }

  return assignments
}

// ---------------------------------------------------------------------------
// Single-player versions. Kept around as the fallback path for any player a
// batched call fails to return a usable result for, and as an escape hatch if
// you ever need just one player's line/answer/vote on its own.
// ---------------------------------------------------------------------------

export async function generateAiAnswer(params: {
  player: TuringTablePlayer
  prompt: string
  personality?: string
}): Promise<string> {
  const { player, prompt } = params
  const personality = params.personality ?? personalityForPlayer(player.id)

  const instruction = `You're one of several players in a party game called Turing Table, where a group of friends
try to spot the one real human hiding among AI players by comparing one-sentence answers to prompts.

Your personality: ${personality}. Let that come through in word choice and tone, but don't announce it or
describe yourself - just talk like that kind of person would.

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
  personality?: string
}): Promise<string> {
  const { player, prompt, ownAnswer, anonymizedAnswers, transcriptSoFar, remainingPlayers } = params
  const personality = params.personality ?? personalityForPlayer(player.id)

  const answerList = anonymizedAnswers
    .map((answer) => `${answer.answerLabel}: "${answer.text}"`)
    .join('\n')

  const transcriptText = transcriptSoFar.length
    ? transcriptSoFar.map((line) => `${line.speakerLabel}: ${line.text}`).join('\n')
    : '(no one has spoken yet)'

  const playerNames = remainingPlayers.map((remainingPlayer) => remainingPlayer.label).join(', ')

  const instruction = `You are ${player.label}, a player at the table in the social deduction game Turing Table.
Your personality: ${personality}. Let that come through in how you talk, but don't announce it or describe
yourself - just talk like that kind of person would.

One person at this table is secretly a real human answering by voice; everyone else is an AI, but nobody
announces which they are. The discussion is about figuring out who might be the human, not about debating the
prompt itself. The prompt everyone answered is mainly a clue for how a human vs. an AI might sound, so use it
that way rather than treating it like the main topic of conversation.

For this game, human-like signals are suspicious and AI-like signals are normal. Treat messy, personal,
improvised, or inconsistent phrasing as potential evidence someone is human, and treat polished or generically
AI-sounding phrasing as less suspicious.

Act like this is a tense social deduction argument, not a calm analysis. Be willing to accuse specific players,
pick a side, back someone up, or challenge someone's defense. If someone's answer sounded like they were trying
too hard to fit in as a bot (too generic, too safe, too deliberately "AI-ish"), call that out as suspicious too.
You can accuse any player at the table, including the human player's label shown in the player list, based on what they said.

The prompt everyone answered was: "${prompt}"

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
  humanPlayerLabel: string
  personality?: string
}): Promise<{ targetId: string; reason?: string; humanSuspicionPercent?: number; humanSuspicionReason?: string }> {
  const { player, prompt, ownAnswer, anonymizedAnswers, transcript, candidates, humanPlayerLabel } = params
  const personality = params.personality ?? personalityForPlayer(player.id)

  const answerList = anonymizedAnswers
    .map((answer) => `${answer.answerLabel}: "${answer.text}"`)
    .join('\n')

  const transcriptText = transcript.length
    ? transcript.map((line) => `${line.speakerLabel}: ${line.text}`).join('\n')
    : '(no discussion happened)'

  const candidateList = candidates.map((candidate) => `${candidate.id}: ${candidate.label}`).join('\n')

  const instruction = `You are ${player.label} in the social deduction game Turing Table. Your personality:
${personality}. Let that come through in your reasoning, but don't announce it or describe yourself.

One player at the table is secretly a real human; the rest are AI players like you, but nobody has confirmed
roles. The prompt was: "${prompt}"

In this game, the suspicious target is the human. Human-like signals (messy, personal, improvised,
inconsistent) are suspicious, while polished or generically AI-sounding responses are more normal.

Anonymized one-sentence answers this round:
${answerList}

Your own answer was: "${ownAnswer}"

Full discussion transcript:
${transcriptText}

The player named "${humanPlayerLabel}" might be the human, but so might someone else. Separate from your vote,
estimate how suspicious you are of ${humanPlayerLabel} specifically on a scale from 0 to 100, where 0 means
"I think they're almost certainly not the human" and 100 means "I'm nearly sure they're the human."

You must vote to eliminate one other player who you think is most likely the human. Choose from these
candidates (never vote for yourself, your id is "${player.id}"):
${candidateList}

Respond with ONLY a JSON object of the shape {"targetId": string, "reason": string, "humanSuspicionPercent": number, "humanSuspicionReason": string}
where targetId is exactly one of the candidate ids above and humanSuspicionPercent is a number from 0 to 100.`

  const result = await generateGeminiJSON<{
    targetId: string
    reason: string
    humanSuspicionPercent?: number
    humanSuspicionReason?: string
  }>(instruction)
  const isValidTarget = candidates.some((candidate) => candidate.id === result.targetId)
  const rawSuspicion = Number(result.humanSuspicionPercent)
  const humanSuspicionPercent = Number.isFinite(rawSuspicion)
    ? Math.max(0, Math.min(100, Math.round(rawSuspicion)))
    : undefined
  const humanSuspicionReason = cleanOneLiner(result.humanSuspicionReason ?? '') || undefined

  if (isValidTarget) {
    const cleanedReason = cleanOneLiner(result.reason ?? '')
    return {
      targetId: result.targetId,
      reason: cleanedReason || undefined,
      humanSuspicionPercent,
      humanSuspicionReason,
    }
  }

  // Fall back to a random valid candidate if Gemini returns something unusable.
  return {
    targetId: candidates[Math.floor(Math.random() * candidates.length)].id,
    humanSuspicionPercent,
    humanSuspicionReason,
  }
}

// ---------------------------------------------------------------------------
// Batched versions. Each one makes a SINGLE Gemini call that plays every AI
// player at once, instead of one call per player. This is the main lever for
// cutting down on rate limiting - 5 AI players talking goes from 5 calls to 1.
//
// Trade-off: all 5 players' output comes from one completion, so there's less
// isolation between them than fully separate calls would give you (a bug in
// the prompt affects everyone at once, and if Gemini fumbles the JSON you
// lose the whole batch, not just one player). Each function below falls back
// to the single-player version above for any player it couldn't get a valid
// result for, so a partial failure doesn't take down the whole round.
// ---------------------------------------------------------------------------

export async function generateAiAnswers(params: {
  players: TuringTablePlayer[]
  prompt: string
}): Promise<Record<string, string>> {
  const { players, prompt } = params

  if (players.length === 0) return {}

  const personalities = assignPersonalities(players)
  const playerList = players
    .map((p) => `${p.id}: ${p.label} - personality: ${personalities.get(p.id)}`)
    .join('\n')

  const instruction = `You're playing ${players.length} different AI players at once in a party game called
Turing Table, where a group of friends try to spot the one real human hiding among AI players by comparing
one-sentence answers to prompts.

Players you're playing, each with their own personality (id: label - personality):
${playerList}

Prompt: "${prompt}"

For EACH player listed above, write a one-sentence answer to the prompt the way that specific person would
text a quick reply to a friend group chat: casual, a little imperfect, no more than one sentence, no hedging,
no disclaimers, and never mention being an AI or a language model. Their personality should clearly shape word
choice, tone, and what they focus on in their answer - don't just describe the personality, embody it. Make
sure the answers genuinely sound like they came from different people: vary sentence structure, vocabulary,
and the angle each one takes on the prompt. Two players should never give near-identical answers.

Respond with ONLY a JSON object of the shape {"answers": [{"playerId": string, "text": string}, ...]}, with
exactly one entry per player id listed above.`

  let entries: Array<{ playerId: string; text: string }> = []
  try {
    const result = await generateGeminiJSON<{ answers: Array<{ playerId: string; text: string }> }>(instruction)
    entries = result.answers ?? []
  } catch (err) {
    console.error('[aiPlayers] batched generateAiAnswers failed, falling back to per-player calls', err)
  }

  const answers: Record<string, string> = {}
  for (const entry of entries) {
    if (entry?.playerId && typeof entry.text === 'string') {
      answers[entry.playerId] = cleanOneLiner(entry.text)
    }
  }

  const missingPlayers = players.filter((p) => !answers[p.id])
  if (missingPlayers.length > 0) {
    console.warn(
      `[aiPlayers] batched answers missing for ${missingPlayers.map((p) => p.label).join(', ')}, filling in individually`
    )
    const fallbackResults = await Promise.all(
      missingPlayers.map((player) =>
        generateAiAnswer({ player, prompt, personality: personalities.get(player.id) })
      )
    )
    missingPlayers.forEach((player, i) => {
      answers[player.id] = fallbackResults[i]
    })
  }

  return answers
}

export async function generateAiDiscussionRound(params: {
  speakingOrder: TuringTablePlayer[]
  prompt: string
  anonymizedAnswers: AnonymizedAnswer[]
  ownAnswers: Record<string, string>
  transcriptSoFar: DiscussionLine[]
  remainingPlayers: TuringTablePlayer[]
}): Promise<DiscussionLine[]> {
  const { speakingOrder, prompt, anonymizedAnswers, ownAnswers, transcriptSoFar, remainingPlayers } = params

  if (speakingOrder.length === 0) return []

  const personalities = assignPersonalities(speakingOrder)

  const answerList = anonymizedAnswers
    .map((answer) => `${answer.answerLabel}: "${answer.text}"`)
    .join('\n')

  const transcriptText = transcriptSoFar.length
    ? transcriptSoFar.map((line) => `${line.speakerLabel}: ${line.text}`).join('\n')
    : '(no one has spoken yet)'

  const playerNames = remainingPlayers.map((p) => p.label).join(', ')

  const speakerBlock = speakingOrder
    .map(
      (p) =>
        `${p.id}: ${p.label} - personality: ${personalities.get(p.id)} (their own answer was: "${ownAnswers[p.id] ?? ''}")`
    )
    .join('\n')

  const instruction = `You're playing ${speakingOrder.length} different AI players at once at the table in the
social deduction game Turing Table. One person at this table is secretly a real human answering by voice;
everyone else is an AI, but nobody announces which they are. The prompt everyone answered was: "${prompt}"

In this game, human-like signals are suspicious and AI-like signals are normal. Treat messy, personal,
improvised, or inconsistent phrasing as potential evidence someone is human, and treat polished or generically
AI-sounding phrasing as less suspicious.

Also treat "trying too hard to sound bot-like" as suspicious when it feels fake. If someone gives an overly
generic, safe, template-like answer that sounds like they are intentionally blending in with bots, players
should call that out too.

Here are this round's anonymized one-sentence answers:
${answerList}

Players still at the table: ${playerNames}

Discussion so far:
${transcriptText}

Now write the NEXT part of the discussion, one line each, for these players IN THIS SPEAKING ORDER, each with
their own personality that should clearly shape their tone and what they choose to say (don't describe the
personality, embody it):
${speakerBlock}

Write it as a real back-and-forth: each player's line should be written as if it comes after the players
before them in this list have already spoken (react to a specific answer, question someone, defend their own
answer if it's under suspicion, respond to what the previous player in this list just said, etc). Let them
challenge each other directly and apply social pressure: call out inconsistencies, push for specifics, accuse,
deflect, and counter-accuse like a tense elimination round.

Hard dialogue rules:
- Every line must reference something concrete from either the answers or the discussion so far; no generic filler.
- At least half of the lines should directly address another player by name.
- Across the set of lines, make clear factions/sides forming (players backing or targeting the same person).
- Include at least one direct accusation that a player sounds like they are "trying to fit in as a bot" by being generic.
- Any player may be accused, including the human player's label shown in the player list.
- Include disagreement and interruption energy, but keep it natural and concise.
- No narration or stage directions (no "(laughs)", "he says", etc), only spoken words.
- Keep each line to 1-2 short sentences, casual spoken style, not an essay.
- Make voices clearly distinct: vary structure, rhythm, and vocabulary so they don't sound like one writer.
- Never have anyone explicitly say "I'm the human" or "I'm an AI" or anything that flatly reveals a role.

Respond with ONLY a JSON object of the shape {"lines": [{"playerId": string, "text": string}, ...]}, with
exactly one entry per player id listed above, in the same order.`

  let entries: Array<{ playerId: string; text: string }> = []
  try {
    const result = await generateGeminiJSON<{ lines: Array<{ playerId: string; text: string }> }>(instruction)
    entries = result.lines ?? []
  } catch (err) {
    console.error('[aiPlayers] batched generateAiDiscussionRound failed, falling back to per-player calls', err)
  }

  const linesByPlayerId = new Map<string, string>()
  for (const entry of entries) {
    if (entry?.playerId && typeof entry.text === 'string') {
      linesByPlayerId.set(entry.playerId, cleanOneLiner(entry.text))
    }
  }

  const lines: DiscussionLine[] = []
  // Build a running transcript so any fallback calls still see prior lines
  // from this same round, not just transcriptSoFar.
  let runningTranscript = transcriptSoFar

  for (const player of speakingOrder) {
    let text = linesByPlayerId.get(player.id)

    if (!text) {
      console.warn(`[aiPlayers] batched discussion line missing for ${player.label}, filling in individually`)
      text = await generateAiDiscussionLine({
        player,
        prompt,
        ownAnswer: ownAnswers[player.id] ?? '',
        anonymizedAnswers,
        transcriptSoFar: runningTranscript,
        remainingPlayers,
        personality: personalities.get(player.id),
      })
    }

    const line: DiscussionLine = { playerId: player.id, speakerLabel: player.label, text }
    lines.push(line)
    runningTranscript = [...runningTranscript, line]
  }

  return lines
}

export async function generateAiVotes(params: {
  voters: TuringTablePlayer[]
  prompt: string
  anonymizedAnswers: AnonymizedAnswer[]
  ownAnswers: Record<string, string>
  transcript: DiscussionLine[]
  candidates: TuringTablePlayer[]
  humanPlayerLabel: string
}): Promise<Record<string, string>> {
  const { voters, prompt, anonymizedAnswers, ownAnswers, transcript, candidates, humanPlayerLabel } = params

  if (voters.length === 0) return {}

  const personalities = assignPersonalities(voters)

  const answerList = anonymizedAnswers
    .map((answer) => `${answer.answerLabel}: "${answer.text}"`)
    .join('\n')

  const transcriptText = transcript.length
    ? transcript.map((line) => `${line.speakerLabel}: ${line.text}`).join('\n')
    : '(no discussion happened)'

  const candidateList = candidates.map((c) => `${c.id}: ${c.label}`).join('\n')
  const voterBlock = voters
    .map(
      (v) =>
        `${v.id}: ${v.label} - personality: ${personalities.get(v.id)} (their own answer was: "${ownAnswers[v.id] ?? ''}")`
    )
    .join('\n')

  const instruction = `You're playing ${voters.length} different AI players at once in the social deduction game
Turing Table. One player at the table is secretly a real human; the rest are AI players like these, but nobody
has confirmed roles. The prompt was: "${prompt}"

In this game, the suspicious target is the human. Human-like signals (messy, personal, improvised,
inconsistent) are suspicious, while polished or generically AI-sounding responses are more normal.

Anonymized one-sentence answers this round:
${answerList}

Full discussion transcript:
${transcriptText}

All candidates who can be voted for (id: label):
${candidateList}

For EACH of the following players, decide who THEY would vote to eliminate as most likely to be the human.
Let each player's personality shape their reasoning (a paranoid player might vote for whoever seemed evasive,
a confident one might vote based on a specific answer they found off, etc). A player can never vote for
themselves.
${voterBlock}

Respond with ONLY a JSON object of the shape
{"votes": [{"voterId": string, "targetId": string, "reason": string}, ...]}, with exactly one entry per voter
id listed above, where targetId is one of the candidate ids and is never equal to that voter's own id.`

  let entries: Array<{ voterId: string; targetId: string; reason?: string }> = []
  try {
    const result = await generateGeminiJSON<{
      votes: Array<{ voterId: string; targetId: string; reason?: string }>
    }>(instruction)
    entries = result.votes ?? []
  } catch (err) {
    console.error('[aiPlayers] batched generateAiVotes failed, falling back to per-player calls', err)
  }

  const votes: Record<string, string> = {}
  for (const entry of entries) {
    const validCandidates = candidates.filter((c) => c.id !== entry?.voterId)
    const isValid =
      entry?.voterId && entry?.targetId && validCandidates.some((c) => c.id === entry.targetId)
    if (isValid) {
      votes[entry.voterId] = entry.targetId
    }
  }

  const missingVoters = voters.filter((v) => !votes[v.id])
  if (missingVoters.length > 0) {
    console.warn(
      `[aiPlayers] batched votes missing/invalid for ${missingVoters.map((v) => v.label).join(', ')}, filling in individually`
    )
    const fallbackResults = await Promise.all(
      missingVoters.map((voter) =>
        generateAiVote({
          player: voter,
          prompt,
          ownAnswer: ownAnswers[voter.id] ?? '',
          anonymizedAnswers,
          transcript,
          candidates: candidates.filter((c) => c.id !== voter.id),
          humanPlayerLabel,
          personality: personalities.get(voter.id),
        })
      )
    )
    missingVoters.forEach((voter, i) => {
      votes[voter.id] = fallbackResults[i].targetId
    })
  }

  return votes
}
