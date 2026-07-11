import { useState, type FormEvent } from 'react'
import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function AnswerPhase({ game }: { game: TuringTableGame }) {
  const [answer, setAnswer] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!answer.trim() || game.isLoadingAi) {
      return
    }

    void game.submitHumanAnswer(answer)
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Answer the prompt</p>
      <h2 className="mt-4 font-display text-2xl leading-snug text-[#f8ecd1] sm:text-3xl">{game.currentPrompt}</h2>

      <form className="mt-8 flex flex-col items-center gap-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-full border border-white/15 bg-neutral-900/80 px-6 py-4 text-center text-sm text-slate-100 outline-none focus:border-amber-200/40"
          maxLength={140}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type one sentence..."
          type="text"
          value={answer}
        />
        <button
          className="inline-flex items-center gap-3 rounded-full border border-amber-200/25 bg-amber-200 px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!answer.trim() || game.isLoadingAi}
          type="submit"
        >
          {game.isLoadingAi ? 'Waiting on the table...' : 'Submit answer'}
        </button>
      </form>
    </div>
  )
}
