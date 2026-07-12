import type { TranscriptRecord } from '../../lib/turingTable/transcripts'

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export default function TranscriptViewer({ transcript }: { transcript: TranscriptRecord }) {
  const playerLabelById = new Map(transcript.players.map((player) => [player.id, player.label]))
  const humanPlayerLabel = playerLabelById.get('human') ?? transcript.playerName
  const aiPlayers = transcript.players.filter((player) => player.role === 'ai')
  const roundsWithSuspicion = transcript.rounds.filter((round) =>
    round.votes.some((vote) => vote.voterId !== 'human' && typeof vote.humanSuspicionPercent === 'number'),
  )

  const graphWidth = 640
  const graphHeight = 220
  const graphPadding = 28
  const suspicionSeries = aiPlayers.map((player, index) => {
    const points = roundsWithSuspicion.map((round, roundIndex) => {
      const vote = round.votes.find((candidate) => candidate.voterId === player.id)
      const suspicion = typeof vote?.humanSuspicionPercent === 'number' ? vote.humanSuspicionPercent : 0
      const x =
        roundsWithSuspicion.length <= 1
          ? graphWidth / 2
          : graphPadding + (roundIndex / (roundsWithSuspicion.length - 1)) * (graphWidth - graphPadding * 2)
      const y = graphHeight - graphPadding - (suspicion / 100) * (graphHeight - graphPadding * 2)
      return { x, y, suspicion, roundNumber: round.roundNumber }
    })

    const color = ['#f6c98e', '#8dd3c7', '#f28b82', '#9bb7ff', '#c9a7ff'][index % 5]

    return {
      playerId: player.id,
      label: player.label,
      color,
      points,
    }
  })

  const roundSuspicionSummaries = transcript.rounds
    .map((round) => {
      const aiVotes = round.votes.filter(
        (vote) => vote.voterId !== 'human' && typeof vote.humanSuspicionPercent === 'number',
      )
      const values = aiVotes
        .map((vote) => vote.humanSuspicionPercent)
        .filter((value): value is number => typeof value === 'number')

      return {
        roundNumber: round.roundNumber,
        entries: aiVotes.map((vote) => ({
          voterLabel: playerLabelById.get(vote.voterId) ?? vote.voterId,
          suspicionPercent: vote.humanSuspicionPercent as number,
          reason: vote.humanSuspicionReason,
        })),
        averageSuspicion: average(values),
      }
    })
    .filter((summary) => summary.entries.length > 0)

  const receivedSuspicionById = new Map<string, number>()
  const accusationPairCount = new Map<string, number>()

  transcript.players.forEach((player) => {
    receivedSuspicionById.set(player.id, 0)
  })

  transcript.rounds.forEach((round) => {
    round.votes.forEach((vote) => {
      receivedSuspicionById.set(vote.targetId, (receivedSuspicionById.get(vote.targetId) ?? 0) + 1)
      const key = `${vote.voterId}->${vote.targetId}`
      accusationPairCount.set(key, (accusationPairCount.get(key) ?? 0) + 1)
    })
  })

  const mostSuspected = [...receivedSuspicionById.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  const topAccusationPair = [...accusationPairCount.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  const overallHumanSuspicionAverage = average(
    roundSuspicionSummaries.flatMap((summary) => summary.entries.map((entry) => entry.suspicionPercent)),
  )

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-5 text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/75">Transcript</p>
          <h3 className="mt-1 font-display text-xl text-[#f8ecd1]">{transcript.playerName}</h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Outcome</p>
          <p className="text-sm font-semibold text-slate-100">
            {transcript.outcome === 'human-win' ? 'Human survived' : 'AI found the human'}
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatDateTime(transcript.createdAt)}</p>
        </div>
      </div>

      {roundsWithSuspicion.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Human Suspicion Curve</p>
              <p className="mt-1 text-xs text-slate-400">How suspicious each AI was of {humanPlayerLabel} over time.</p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              {suspicionSeries.map((series) => (
                <span className="inline-flex items-center gap-2" key={series.playerId}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                  <span>{series.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg
              aria-label="AI suspicion over time"
              className="h-auto min-w-[640px]"
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            >
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = graphHeight - graphPadding - (tick / 100) * (graphHeight - graphPadding * 2)
                return (
                  <g key={tick}>
                    <line
                      x1={graphPadding}
                      x2={graphWidth - graphPadding}
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="4 6"
                    />
                    <text
                      fill="rgba(226,232,240,0.68)"
                      fontSize="11"
                      textAnchor="end"
                      x={graphPadding - 8}
                      y={y + 4}
                    >
                      {tick}%
                    </text>
                  </g>
                )
              })}

              {roundsWithSuspicion.map((round, roundIndex) => {
                const x =
                  roundsWithSuspicion.length <= 1
                    ? graphWidth / 2
                    : graphPadding + (roundIndex / (roundsWithSuspicion.length - 1)) * (graphWidth - graphPadding * 2)
                return (
                  <g key={round.roundNumber}>
                    <line
                      x1={x}
                      x2={x}
                      y1={graphPadding}
                      y2={graphHeight - graphPadding}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <text fill="rgba(248,236,209,0.82)" fontSize="11" textAnchor="middle" x={x} y={graphHeight - 6}>
                      R{round.roundNumber}
                    </text>
                  </g>
                )
              })}

              {suspicionSeries.map((series) => (
                <g key={series.playerId}>
                  <path
                    d={series.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {series.points.map((point) => (
                    <g key={`${series.playerId}-${point.roundNumber}`}>
                      <circle cx={point.x} cy={point.y} fill={series.color} r="4.5" />
                      <title>{`${series.label}: ${point.suspicion}% suspicious of ${humanPlayerLabel} in round ${point.roundNumber}`}</title>
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-950/45 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Most Suspected</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {mostSuspected ? `${playerLabelById.get(mostSuspected[0]) ?? mostSuspected[0]} (${mostSuspected[1]} votes)` : 'No votes'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/45 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Common Accusation</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {topAccusationPair
              ? `${playerLabelById.get(topAccusationPair[0].split('->')[0]) ?? topAccusationPair[0].split('->')[0]} -> ${playerLabelById.get(topAccusationPair[0].split('->')[1]) ?? topAccusationPair[0].split('->')[1]} (${topAccusationPair[1]}x)`
              : 'No accusations'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/45 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">AI Suspicion of {humanPlayerLabel}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {overallHumanSuspicionAverage === null ? 'Not tracked' : formatPercent(overallHumanSuspicionAverage)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900/45 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Who Suspected Whom</p>
        <p className="mt-1 text-xs text-slate-400">Each vote shows who looked suspicious to whom, including character-to-character suspicion.</p>

        <div className="mt-3 space-y-3">
          {transcript.rounds.map((round) => (
            <div className="rounded-xl border border-white/10 bg-black/25 p-3" key={`suspicion-round-${round.roundNumber}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/75">Round {round.roundNumber}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {round.votes.map((vote, index) => {
                  const voterLabel = playerLabelById.get(vote.voterId) ?? vote.voterId
                  const targetLabel = playerLabelById.get(vote.targetId) ?? vote.targetId
                  return (
                    <span
                      className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-100"
                      key={`suspicion-chip-${round.roundNumber}-${vote.voterId}-${index}`}
                      title={vote.reason ?? ''}
                    >
                      {voterLabel} {'->'} {targetLabel}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {roundSuspicionSummaries.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/45 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">How AI Rated {humanPlayerLabel}</p>
          <div className="mt-3 space-y-3">
            {roundSuspicionSummaries.map((summary) => (
              <div className="rounded-xl border border-white/10 bg-black/25 p-3" key={`human-suspicion-round-${summary.roundNumber}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-100">Round {summary.roundNumber}</p>
                  <p className="text-xs text-amber-100/90">
                    Avg: {summary.averageSuspicion === null ? 'n/a' : formatPercent(summary.averageSuspicion)}
                  </p>
                </div>
                <div className="mt-2 space-y-2">
                  {summary.entries.map((entry) => (
                    <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2" key={`human-suspicion-${summary.roundNumber}-${entry.voterLabel}`}>
                      <p className="text-xs text-slate-100">
                        <span className="font-semibold text-amber-100/85">{entry.voterLabel}</span>
                        <span className="ml-2">{formatPercent(entry.suspicionPercent)}</span>
                      </p>
                      {entry.reason ? <p className="mt-1 text-xs text-slate-300">{entry.reason}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 max-h-[58vh] space-y-3 overflow-y-auto pr-1">
        {transcript.rounds.map((round) => (
          <details className="rounded-2xl border border-white/10 bg-neutral-900/55 p-4" key={round.roundNumber}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#f8ecd1]">
              Round {round.roundNumber}: {round.prompt}
            </summary>

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Answers</p>
              <div className="mt-2 space-y-2">
                {round.anonymizedOrder.map((answer) => (
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200" key={`${round.roundNumber}-${answer.answerLabel}`}>
                    <span className="font-semibold text-amber-100/85">{answer.answerLabel}:</span>
                    <span className="ml-2">{answer.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Discussion</p>
              <div className="mt-2 space-y-2">
                {round.discussionTranscript.map((line, index) => (
                  <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-100" key={`${round.roundNumber}-${line.playerId}-${index}`}>
                    <span className="font-semibold text-amber-100/80">{line.speakerLabel}:</span>
                    <span className="ml-2">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Vote Reasoning</p>
              <div className="mt-2 space-y-2">
                {round.votes.map((vote, index) => {
                  const voterLabel = playerLabelById.get(vote.voterId) ?? vote.voterId
                  const targetLabel = playerLabelById.get(vote.targetId) ?? vote.targetId
                  return (
                    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs" key={`${round.roundNumber}-${vote.voterId}-${index}`}>
                      <p className="text-slate-100">
                        <span className="font-semibold text-amber-100/85">{voterLabel}</span>
                        <span className="mx-2 text-slate-500">{'->'}</span>
                        <span>{targetLabel}</span>
                      </p>
                      {vote.reason ? <p className="mt-1 text-slate-300">{vote.reason}</p> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
