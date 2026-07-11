import { FormEvent, useMemo, useState } from 'react'
import { generateGeminiText } from './lib/gemini'

const starterPrompt = 'Give me a tiny game idea with an NPC, a goal, and a twist.'

export default function App() {
  const [prompt, setPrompt] = useState(starterPrompt)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const helperText = useMemo(() => {
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      return 'Gemini is configured and ready for browser requests.'
    }

    return 'Add VITE_GEMINI_API_KEY to your .env.local file to enable Gemini.'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsLoading(true)
    setError('')
    setOutput('')

    try {
      const text = await generateGeminiText(prompt)
      setOutput(text)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Gemini request failed.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <section className="grid w-full gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur md:grid-cols-[1.05fr_0.95fr] md:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
                Gemini game setup
              </p>
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-white md:text-6xl">
                Build AI-driven game prompts directly in the browser.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg">
                This starter uses the Google Gen AI SDK with Gemini Flash so you
                can prototype dialogue, quest ideas, enemies, and world rules
                without leaving your app.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50">
              {helperText}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Prompt
                </span>
                <textarea
                  className="min-h-40 w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the game scene, character, or mechanic you want Gemini to generate..."
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Thinking...' : 'Ask Gemini'}
                </button>
                <button
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                  type="button"
                  onClick={() => setPrompt(starterPrompt)}
                >
                  Reset prompt
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
                Gemini output
              </h2>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                {isLoading ? 'Running' : 'Idle'}
              </span>
            </div>

            <div className="min-h-80 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-slate-200">
              {error || output || 'Your Gemini response will appear here.'}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}