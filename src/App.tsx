import { useEffect, useState } from 'react'
import CampfireLobbyScene from './components/CampfireLobbyScene'
import TranscriptViewer from './components/TuringTable/TranscriptViewer'
import GameContainer from './components/TuringTable/GameContainer'
import { listTranscripts, type TranscriptRecord } from './lib/turingTable/transcripts'

export default function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [focusedCharacterId, setFocusedCharacterId] = useState<string | null>(null)
  const [hiddenCharacterIds, setHiddenCharacterIds] = useState<string[]>([])
  const [characterSpeechById, setCharacterSpeechById] = useState<Record<string, string>>({})
  const [pendingPlayerName, setPendingPlayerName] = useState('')
  const [playerName, setPlayerName] = useState('John')
  const [showPastTranscripts, setShowPastTranscripts] = useState(false)
  const [loadingPastTranscripts, setLoadingPastTranscripts] = useState(false)
  const [pastTranscripts, setPastTranscripts] = useState<TranscriptRecord[]>([])
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null)

  const selectedTranscript =
    pastTranscripts.find((transcript) => transcript.id === selectedTranscriptId) ?? null

  function handleStartGame() {
    const chosenName = pendingPlayerName.trim() || 'John'
    setPlayerName(chosenName)
    setGameStarted(true)
    setIsPaused(false)
  }

  function handleTogglePause() {
    setIsPaused((currentPaused) => !currentPaused)
  }

  function handleQuitGame() {
    window.location.reload()
  }

  useEffect(() => {
    if (!showPastTranscripts) {
      return
    }

    let cancelled = false
    setLoadingPastTranscripts(true)

    void (async () => {
      const items = await listTranscripts(40)
      if (cancelled) {
        return
      }

      setPastTranscripts(items)
      setSelectedTranscriptId(items[0]?.id ?? null)
      setLoadingPastTranscripts(false)
    })()

    return () => {
      cancelled = true
    }
  }, [showPastTranscripts])

  return (
    <main className="relative h-screen min-h-screen overflow-hidden bg-[#040706] text-slate-100">
      <CampfireLobbyScene
        isPlaying={gameStarted}
        focusCharacterId={focusedCharacterId}
        hiddenCharacterIds={hiddenCharacterIds}
        characterSpeechById={characterSpeechById}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(220,187,130,0.2),_transparent_34%),linear-gradient(180deg,rgba(4,7,6,0.08),rgba(4,7,6,0.72))]" />

      {!gameStarted ? (
        <>
          <button
            className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 backdrop-blur-md transition hover:border-amber-200/30 hover:bg-slate-900/80"
            type="button"
            onClick={() => setShowPastTranscripts(true)}
          >
            Past Transcripts
          </button>

          <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-10 sm:pt-14 lg:pt-16">
            <div className="pointer-events-none max-w-4xl text-center">
              <h1 className="mt-4 font-display text-5xl leading-none tracking-[0.16em] text-[#f8ecd1] drop-shadow-[0_0_24px_rgba(255,182,96,0.22)] sm:text-7xl lg:text-7xl">
                Wolf In Sheep&apos;s Clothing
              </h1>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-10 sm:pb-12 lg:pb-14">
            <div className="w-full max-w-sm">
              <label className="mb-2 block text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">
                Your Name
              </label>
              <input
                className="w-full rounded-full border border-white/20 bg-neutral-900/70 px-5 py-3 text-center text-sm text-slate-100 outline-none backdrop-blur-md placeholder:text-slate-400 focus:border-amber-200/45"
                maxLength={24}
                onChange={(event) => setPendingPlayerName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleStartGame()
                  }
                }}
                placeholder="John"
                type="text"
                value={pendingPlayerName}
              />

              <div className="mt-4 flex justify-center">
                <button
                  className="inline-flex items-center gap-3 rounded-full border border-amber-200/25 bg-amber-200 px-8 py-4 text-sm font-semibold tracking-[0.18em] text-[#26180c] shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-100"
                  type="button"
                  onClick={handleStartGame}
                >
                  Play
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {gameStarted ? (
        <GameContainer
          playerName={playerName}
          onSpeakerChange={setFocusedCharacterId}
          onHiddenCharacterIdsChange={setHiddenCharacterIds}
          onCharacterSpeechChange={setCharacterSpeechById}
        />
      ) : null}

      {gameStarted ? (
        <button
          className="absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 backdrop-blur-md transition hover:border-amber-200/30 hover:bg-slate-900/80"
          type="button"
          onClick={handleTogglePause}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      ) : null}

      {gameStarted && isPaused ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-neutral-900/90 p-6 text-center shadow-2xl shadow-black/50">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-neutral-300">
              Game paused
            </p>
            <div className="mt-6 grid gap-3">
              <button
                className="rounded-full bg-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
                type="button"
                onClick={() => setIsPaused(false)}
              >
                Resume
              </button>
              <button
                className="rounded-full border border-white/10 bg-neutral-800 px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white/20 hover:bg-neutral-700"
                type="button"
                onClick={handleQuitGame}
              >
                Quit Game
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPastTranscripts ? (
        <div className="absolute inset-0 z-30 bg-black/70 px-4 py-6 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col rounded-3xl border border-white/10 bg-neutral-950/90 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-display text-2xl text-[#f8ecd1]">Past Transcripts</h2>
              <button
                className="rounded-full border border-white/15 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:border-white/30"
                type="button"
                onClick={() => setShowPastTranscripts(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[260px_1fr]">
              <div className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-2">
                {loadingPastTranscripts ? (
                  <p className="px-2 py-3 text-sm text-slate-300">Loading transcripts...</p>
                ) : pastTranscripts.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-300">No transcripts found yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pastTranscripts.map((transcript) => {
                      const isSelected = transcript.id === selectedTranscriptId
                      return (
                        <button
                          className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                            isSelected
                              ? 'border-amber-200/45 bg-amber-100/10 text-amber-100'
                              : 'border-white/10 bg-neutral-900/40 text-slate-200 hover:border-white/20'
                          }`}
                          key={transcript.id}
                          type="button"
                          onClick={() => setSelectedTranscriptId(transcript.id)}
                        >
                          <p className="font-semibold">{transcript.playerName}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(transcript.createdAt).toLocaleString()}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            {transcript.outcome === 'human-win' ? 'Human survived' : 'AI found human'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="min-h-0 overflow-y-auto">
                {selectedTranscript ? (
                  <TranscriptViewer transcript={selectedTranscript} />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-slate-300">
                    Choose a transcript from the left.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
