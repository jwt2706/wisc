import { useState } from 'react'
import CampfireLobbyScene from './components/CampfireLobbyScene'
import GameContainer from './components/TuringTable/GameContainer'

export default function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  function handleStartGame() {
    setGameStarted(true)
    setIsPaused(false)
  }

  function handleTogglePause() {
    setIsPaused((currentPaused) => !currentPaused)
  }

  function handleQuitGame() {
    window.location.reload()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040706] text-slate-100">
      <CampfireLobbyScene isPlaying={gameStarted} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(220,187,130,0.2),_transparent_34%),linear-gradient(180deg,rgba(4,7,6,0.08),rgba(4,7,6,0.72))]" />

      {!gameStarted ? (
        <>
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-10 sm:pt-14 lg:pt-16">
            <div className="pointer-events-none max-w-4xl text-center">
              <h1 className="mt-4 font-display text-5xl leading-none tracking-[0.16em] text-[#f8ecd1] drop-shadow-[0_0_24px_rgba(255,182,96,0.22)] sm:text-7xl lg:text-7xl">
                Wolf In Sheep&apos;s Clothing
              </h1>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-10 sm:pb-12 lg:pb-14">
            <button
              className="inline-flex items-center gap-3 rounded-full border border-amber-200/25 bg-amber-200 px-8 py-4 text-sm font-semibold tracking-[0.18em] text-[#26180c] shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-100"
              type="button"
              onClick={handleStartGame}
            >
              Play
            </button>
          </div>
        </>
      ) : null}

      {gameStarted ? <GameContainer /> : null}

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
    </main>
  )
}
