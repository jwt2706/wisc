export const TURING_TABLE_PROMPTS = [
  'What should I make for dinner with only eggs and rice?',
  "What's the best way to fall back asleep at 3am?",
  'Give me one excuse for being late to work today.',
  "What's a good name for a goldfish?",
  'How do I get gum out of hair?',
  "What's something cheap I can do for a first date?",
  'Give me a caption for a photo of my messy desk.',
  "What's the best way to fold a fitted sheet?",
  'How do I politely leave a party early?',
  'What should I text someone who left me on read for 3 days?',
  "What's a good comeback for a coworker who takes credit for your work?",
  'How do I make instant ramen taste less sad?',
  "What's the best excuse to skip a birthday party?",
  'How do I stop procrastinating on laundry?',
  'Give me a one-line review of a bad haircut.',
  "What's a good icebreaker for a work meeting nobody wants to be in?",
  'How do I tell my roommate to stop leaving dishes in the sink?',
  'What snack goes best with a rainy day?',
  "What's the fastest way to sober up before a family dinner?",
  'How do I ask my landlord to fix something without sounding annoying?',
] as const

export function pickRandomPrompt(usedPrompts: string[]) {
  const available = TURING_TABLE_PROMPTS.filter((prompt) => !usedPrompts.includes(prompt))
  const pool = available.length > 0 ? available : TURING_TABLE_PROMPTS
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}
