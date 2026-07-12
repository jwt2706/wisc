import type { GameOutcome, PlayerRole, RoundRecord, VoteRecord } from './types'

export type TranscriptPlayer = {
  id: string
  label: string
  role: PlayerRole
}

export type TranscriptRecord = {
  id: string
  createdAt: string
  playerName: string
  outcome: Exclude<GameOutcome, null>
  players: TranscriptPlayer[]
  rounds: RoundRecord[]
  finalVotes: VoteRecord[]
}

const LOCAL_STORAGE_KEY = 'wisc.transcripts.v1'
const MAX_LOCAL_TRANSCRIPTS = 60

function getServerConfig() {
  const rawApiBaseUrl = (import.meta.env.VITE_TRANSCRIPTS_API_URL as string | undefined)?.trim()
  const apiBaseUrl = rawApiBaseUrl || '/api'

  return {
    apiBaseUrl,
    ready: Boolean(rawApiBaseUrl),
  }
}

function normalizeServerApiUrl(path: string) {
  const { apiBaseUrl } = getServerConfig()
  const trimmedBase = apiBaseUrl.replace(/\/+$/, '')
  const trimmedPath = path.replace(/^\/+/, '')
  return `${trimmedBase}/${trimmedPath}`
}

async function serverApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(normalizeServerApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Transcript API failed (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

function getMongoConfig() {
  const apiUrl = (import.meta.env.VITE_MONGODB_DATA_API_URL as string | undefined)?.trim()
  const apiKey = (import.meta.env.VITE_MONGODB_DATA_API_KEY as string | undefined)?.trim()
  const dataSource = (import.meta.env.VITE_MONGODB_DATA_SOURCE as string | undefined)?.trim()
  const database = (import.meta.env.VITE_MONGODB_DATABASE as string | undefined)?.trim()
  const collection = ((import.meta.env.VITE_MONGODB_COLLECTION as string | undefined) || 'transcripts').trim()

  return {
    apiUrl,
    apiKey,
    dataSource,
    database,
    collection,
    ready: Boolean(apiUrl && apiKey && dataSource && database && collection),
  }
}

function normalizeApiActionUrl(apiUrl: string, action: string) {
  const trimmed = apiUrl.replace(/\/+$/, '')
  if (trimmed.endsWith('/action')) {
    return `${trimmed}/${action}`
  }
  return `${trimmed}/action/${action}`
}

async function mongoAction<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const config = getMongoConfig()
  if (!config.ready) {
    throw new Error('MongoDB Data API is not configured.')
  }

  const response = await fetch(normalizeApiActionUrl(config.apiUrl!, action), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey!,
    },
    body: JSON.stringify({
      dataSource: config.dataSource,
      database: config.database,
      collection: config.collection,
      ...payload,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MongoDB Data API ${action} failed (${response.status}): ${text}`)
  }

  return (await response.json()) as T
}

function sortNewestFirst(items: TranscriptRecord[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function readLocalTranscripts(): TranscriptRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as TranscriptRecord[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return sortNewestFirst(parsed)
  } catch {
    return []
  }
}

function writeLocalTranscripts(items: TranscriptRecord[]) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortNewestFirst(items).slice(0, MAX_LOCAL_TRANSCRIPTS)))
}

function upsertLocalTranscript(item: TranscriptRecord) {
  const existing = readLocalTranscripts().filter((candidate) => candidate.id !== item.id)
  writeLocalTranscripts([item, ...existing])
}

function normalizeTranscriptDocument(document: any): TranscriptRecord {
  return {
    id: String(document.id ?? document._id),
    createdAt: String(document.createdAt),
    playerName: String(document.playerName),
    outcome: document.outcome,
    players: Array.isArray(document.players) ? document.players : [],
    rounds: Array.isArray(document.rounds) ? document.rounds : [],
    finalVotes: Array.isArray(document.finalVotes) ? document.finalVotes : [],
  }
}

export function isMongoTranscriptConfigured() {
  return getMongoConfig().ready
}

export function isRemoteTranscriptConfigured() {
  return getServerConfig().ready || getMongoConfig().ready
}

export async function saveTranscript(record: TranscriptRecord) {
  upsertLocalTranscript(record)

  if (getServerConfig().ready) {
    try {
      await serverApi<{ id: string }>('/transcripts', {
        method: 'POST',
        body: JSON.stringify(record),
      })

      return { savedTo: 'mongodb' as const, id: record.id }
    } catch (error) {
      console.warn('[transcripts] backend save failed, falling back to browser strategies', error)
    }
  }

  if (!isMongoTranscriptConfigured()) {
    return { savedTo: 'local' as const, id: record.id }
  }

  const document = {
    ...record,
    _id: record.id,
  }

  await mongoAction('updateOne', {
    filter: { _id: record.id },
    update: { $set: document },
    upsert: true,
  })

  return { savedTo: 'mongodb' as const, id: record.id }
}

export async function listTranscripts(limit = 25): Promise<TranscriptRecord[]> {
  const local = readLocalTranscripts().slice(0, limit)

  if (getServerConfig().ready) {
    try {
      const result = await serverApi<{ documents?: TranscriptRecord[] }>(`/transcripts?limit=${limit}`)
      const docs = (result.documents ?? []).map(normalizeTranscriptDocument)
      return sortNewestFirst(docs)
    } catch (error) {
      console.warn('[transcripts] failed to load from backend, falling back', error)
    }
  }

  if (!isMongoTranscriptConfigured()) {
    return local
  }

  try {
    const result = await mongoAction<{ documents?: any[] }>('find', {
      filter: {},
      sort: { createdAt: -1 },
      limit,
    })

    const docs = (result.documents ?? []).map(normalizeTranscriptDocument)
    return sortNewestFirst(docs)
  } catch (error) {
    console.warn('[transcripts] failed to load from MongoDB, using local cache', error)
    return local
  }
}
