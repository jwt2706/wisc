import { useState } from 'react'
import CampfireLobbyScene from './components/CampfireLobbyScene'

export default function App() {
  const [gameStarted, setGameStarted] = useState(false)

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
              onClick={() => setGameStarted(true)}
            >
              Play
            </button>
          </div>
        </>
      ) : null}
    </main>
  )
}