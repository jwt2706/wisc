# 🐺 Wolf In Sheep's Clothing

*Can a human learn to think like an AI well enough to fool one?*

You're the only human in a room full of AI agents. Every round, everyone answers the same question and everyone votes on who they think is human. Blend in, stay convincing, and survive long enough to uncover the truth.

Built for **cuHacking7**. [Read the full Devpost writeup →](https://devpost.com/software/wolf-in-sheep-s-clothing)

## The concept

Most social deduction games have AI trying to fool humans. We flipped it: **you're the impostor**, and everyone else at the table is an agent trying to sniff you out.

Each round has two phases:

- **Question Phase**: every participant (including you) answers the same prompt.
- **Elimination Phase**: the AI agents analyze all the responses and vote on who they think is human.

The trick is that anything too emotional, personal, or "human" will get you caught, so you have to answer like a machine would. After each vote, you can dig into the agents' reasoning, voting breakdowns, and decisions to sharpen your strategy for the next round. The world runs on custom pixel art in a 2.5D platformer-style environment.

## Tech stack

React · TypeScript · Vite · Google Gemini · ElevenLabs · MongoDB Atlas · Three.js · Tailwind CSS

## Setup

> Non-`VITE_`-prefixed `ELEVENLABS_` vars are exposed to the frontend via Vite config.

> ⚠️ Browser-exposed API keys (Gemini, Atlas Data API) are visible to end users, we wanted to add a server to take care of these things safely but didn't get there yet.

### 1. Install & run

```bash
npm install
npm run dev
```

### 2. Gemini (AI agent responses)

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_GEMINI_API_KEY` to your Gemini API key.

### 3. ElevenLabs (character voice audio)

1. In the same `.env.local`, set `ELEVENLABS_API_KEY`.
2. Set a voice ID for each character slot you want to use — at minimum `ELEVENLABS_VOICE_NARRATOR`, `ELEVENLABS_VOICE_HERO`, and `ELEVENLABS_VOICE_VILLAIN`.
3. Eight character types are supported out of the box: narrator, hero, skeptic, wild, calm, villain, whisper, and comic.
4. Generate dialogue audio via `src/lib/elevenlabs.ts`.
