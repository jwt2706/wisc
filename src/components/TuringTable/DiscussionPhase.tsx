import { useEffect, useState } from 'react'
import { useSpeechToText } from '../../lib/turingTable/speechRecognition'
import type { TuringTableGame } from '../../lib/turingTable/useTuringTableGame'

export default function DiscussionPhase({ game }: { game: TuringTableGame }) {
  const speech = useSpeechToText()
  const [manualText, setManualText] = useState('')

  const currentSpeaker = game.players.find((player) => player.id === game.currentSpeakerId)
  const isHumanTurn = currentSpeaker?.role === 'human'

  useEffect(() => {
    setManualText('')
  }, [game.currentSpeakerId])

  function handleFinishSpeaking() {
    const finalText = (speech.transcript || manualText).trim()

    if (!finalText) {
      return
    }

    speech.stopListening()
    game.submitHumanDiscussionLine(finalText)
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-neutral-950/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/70">Discussion</p>

      <div className="mt-6 max-h-72 space-y-3 overflow-y-auto pr-1">
        {game.discussionTranscript.map((line, index) => (
          <div className="rounded-2xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm" key={index}>
            <span className="mr-2 font-semibold text-amber-200/80">{line.speakerLabel}:</span>
            <span className="text-slate-100">{line.text}</span>
          </div>
        ))}
      </div>

      {isHumanTurn ? (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-300">Your turn — speak up at the table.</p>

          {speech.isSupported ? (
            <>
              <button
                className="rounded-full border border-amber-200/25 bg-amber-200 px-6 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100"
                onClick={speech.isListening ? handleFinishSpeaking : speech.startListening}
                type="button"
              >
                {speech.isListening ? 'Done speaking' : 'Start speaking'}
              </button>
              {speech.transcript ? (
                <p className="max-w-md text-center text-sm italic text-slate-300">&quot;{speech.transcript}&quot;</p>
              ) : null}
            </>
          ) : (
            <div className="flex w-full max-w-md flex-col items-center gap-3">
              <p className="text-xs text-slate-400">
                Voice input isn&apos;t supported in this browser — type what you&apos;d say instead.
              </p>
              <input
                className="w-full rounded-full border border-white/15 bg-neutral-900/80 px-5 py-3 text-center text-sm text-slate-100 outline-none focus:border-amber-200/40"
                onChange={(event) => setManualText(event.target.value)}
                placeholder="Say something..."
                type="text"
                value={manualText}
              />
              <button
                className="rounded-full border border-amber-200/25 bg-amber-200 px-6 py-3 text-sm font-semibold tracking-[0.18em] text-[#26180c] transition hover:-translate-y-0.5 hover:bg-amber-100 disabled:opacity-50"
                disabled={!manualText.trim()}
                onClick={handleFinishSpeaking}
                type="button"
              >
                Say it
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-slate-400">
          {currentSpeaker ? `${currentSpeaker.label} is speaking...` : 'Moving to the vote...'}
        </p>
      )}
    </div>
  )
}
