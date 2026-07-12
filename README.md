# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Gemini setup

This project includes a small browser-side Gemini playground using the Google Gen AI SDK.

1. Copy `.env.example` to `.env.local`.
2. Add your Gemini API key to `VITE_GEMINI_API_KEY`.
3. Run `npm run dev` and try a prompt in the app.

Note: browser-side API keys are visible to users, so move the request behind a server before production use.

## ElevenLabs dubbing setup

This project also includes a browser-side ElevenLabs helper for multi-character dialogue audio.

1. Copy `.env.example` to `.env.local`.
2. Add your ElevenLabs API key to `ELEVENLABS_API_KEY`.
3. Set voice IDs for the character slots you want to use, at minimum `ELEVENLABS_VOICE_NARRATOR`, `ELEVENLABS_VOICE_HERO`, and `ELEVENLABS_VOICE_VILLAIN`.
4. Run `npm run dev` and use the helper in `src/lib/elevenlabs.ts` to generate dialogue audio.

The helper supports eight built-in character types: narrator, hero, skeptic, wild, calm, villain, whisper, and comic.

If you want the frontend to read non-`VITE_` env vars, this repo is configured to expose the `ELEVENLABS_` prefix in Vite.

## Transcript persistence setup (MongoDB Atlas)

The game now saves full end-of-game transcripts and exposes a `Past Transcripts` browser before you press Play.

By default, transcripts are stored in `localStorage` so the feature works immediately.

### Recommended setup: private backend with your cluster URI

The repo now includes a small Node transcript API in `server/transcriptsServer.mjs`.
This is the recommended path if you already have a normal MongoDB Atlas connection string,
because the database credentials stay server-side instead of being exposed in the browser.

Add these to `.env` or `.env.local`:

1. `MONGODB_URI`
2. `MONGODB_DATABASE`
3. `MONGODB_COLLECTION`
4. `TRANSCRIPTS_API_PORT` (optional, defaults to `8787`)
5. `TRANSCRIPTS_ALLOWED_ORIGIN` (optional, defaults to `*`)
6. `VITE_TRANSCRIPTS_API_URL=/api`

Then run both processes:

1. `npm run dev:api`
2. `npm run dev`

The Vite dev server proxies `/api/*` requests to the transcript API automatically.

### Alternative setup: Atlas Data API directly from the browser

If you specifically want browser-side Atlas Data API access instead, configure these values in `.env.local`:

1. `VITE_MONGODB_DATA_API_URL`
2. `VITE_MONGODB_DATA_API_KEY`
3. `VITE_MONGODB_DATA_SOURCE`
4. `VITE_MONGODB_DATABASE`
5. `VITE_MONGODB_COLLECTION` (optional, defaults to `transcripts`)

Expected Data API URL format:

`https://data.mongodb-api.com/app/<your-app-id>/endpoint/data/v1/action`

After those env vars are set, end-of-game transcripts are upserted to Atlas and still cached locally.
If Atlas is unavailable, the game falls back to local cache automatically.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
