# Turing Table — Game Rules

*A social deduction game: 1 human hides among 5 AI players. The AIs are trying to sniff out and vote off the human. The human just needs to blend in.*

## Overview

- **Players:** 6 total — 5 AI agents + 1 human.
- **Roles are secret.** No player (including the AIs) is told who the human is.
- **AI goal:** identify and vote out the human before the human survives to the end.
- **Human goal:** avoid detection and survive until only a small number of players remain (see Win Conditions).

## Round Structure

Each round has four phases:

### 1. Prompt Phase
- The game shows one prompt to all players — something a person might type into an AI chatbot (e.g. "What should I make for dinner with only eggs and rice?").
- Prompts should be mundane/relatable enough that both a human and an AI could plausibly answer them in a very "human-sounding" way. Avoid prompts that invite obviously AI-flavored answers (overly technical, disclaimer-heavy, etc.).

### 2. Answer Phase
- Every player (human + 5 AIs) submits **exactly one sentence** answering the prompt, via text.
- Answers are collected simultaneously — no player sees others' answers until everyone has submitted (or a timer expires).
- A per-round timer (e.g. 30–45 sec) keeps pace and stops anyone from overthinking their answer, which also pressures the human into natural, quick responses.

### 3. Reveal + Discussion Phase
- All six answers are displayed together, anonymized and unordered (shuffled each round so position isn't a tell).
- Players then discuss via voice. In practice this means:
  - The human speaks/talks normally through their mic.
  - Each AI "speaks" via text-to-speech, taking turns contributing commentary/opinions about which answer(s) seem off.
- Discussion runs for a fixed time window (e.g. 60–90 sec) or until all players have spoken at least once, whichever is longer.
- Players may reference specific answers, ask questions, defend their own answer, or cast suspicion — but may not explicitly claim "I'm the human/AI" (that's out of bounds — see House Rules).

### 4. Voting Phase
- After discussion, every remaining player votes for one other player to eliminate. Votes are simultaneous and hidden until all are cast.
- The player with the most votes is eliminated and their role is **not** revealed to the group (this keeps suspicion alive if the human survives).
- **Tie handling:** if two or more players tie for most votes, hold one immediate revote among just the tied players; if it ties again, no one is eliminated that round.

## Progression

- After elimination, play continues to the next round with the remaining players.
- The game ends when a win condition is met (below) — otherwise repeat Prompt → Answer → Discuss → Vote.

## Win Conditions

- **AIs win** if the human is voted out at any point.
- **Human wins** if they survive down to the final 2 players (i.e. all 5 AIs have been eliminated, or the human makes it to a defined "final round" — pick one, see note below).

> Design note: you'll want to decide whether the human must survive to be the *last player standing* or just reach a *final N* (e.g. final 2 or final 3) to count as a win. Final-2 is a common, cleaner target since it guarantees a clear endpoint each game.

## House Rules / Guardrails

- No player may explicitly state or strongly imply their own role ("I'm definitely human," "trust me I'm an AI") — this would break the deduction premise. Keep discussion focused on *answers*, not direct role claims.
- AI answers/voice contributions should be tuned to sound casual and human-like (short, imperfect, opinionated) rather than formal or disclaimer-heavy — otherwise the human is trivially identifiable.
- AI voting logic should weigh: answer style/length inconsistency, hesitation or generic phrasing, and behavior during discussion (who got defensive, who stayed quiet, who called out others first).
- Minimum viable game length: with 6 starting players and 1 elimination per round, the game naturally ends within 4–5 rounds at most.

## Suggested Data You'll Need to Track
- players
- current prompt
- answers
- votes
- round number
- discussion transcript (we can log the whole game and review it later)
