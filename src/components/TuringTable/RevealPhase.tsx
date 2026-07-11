import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function RevealPhase({ game }: { game: TuringTableGame }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">
        Everyone&apos;s answers
      </p>
      <h2 className="mt-3 text-center font-display text-xl text-[#f8ecd1]">{game.currentPrompt}</h2>

      <ul className="mt-6 space-y-3">
        {game.anonymizedOrder.map((answer) => (
          <li
            className="rounded-2xl border border-white/10 bg-neutral-900/70 px-5 py-4 text-sm text-slate-100"
            key={answer.answerLabel}
          >
            <span className="mr-2 font-semibold text-amber-200/80">{answer.answerLabel}.</span>
            {answer.text}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-center">
        <button
          className="rounded-full border border-amber-200/25 bg-amber-200 px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100"
          onClick={game.beginDiscussion}
          type="button"
        >
          Start discussion
        </button>
      </div>
    </div>
  )
}
