import 'dotenv/config'
import { createServer } from 'node:http'
import { MongoClient } from 'mongodb'

const port = Number(process.env.TRANSCRIPTS_API_PORT || 8787)
const mongoUri = process.env.MONGODB_URI?.trim()
const databaseName = process.env.MONGODB_DATABASE?.trim() || 'wisc'
const collectionName = process.env.MONGODB_COLLECTION?.trim() || 'transcripts'
const allowedOrigin = process.env.TRANSCRIPTS_ALLOWED_ORIGIN?.trim() || '*'

if (!mongoUri) {
  console.error('[transcripts-api] Missing MONGODB_URI in environment.')
  process.exit(1)
}

const client = new MongoClient(mongoUri)
let collectionPromise

async function getCollection() {
  if (!collectionPromise) {
    collectionPromise = client.connect().then((connectedClient) => connectedClient.db(databaseName).collection(collectionName))
  }

  return collectionPromise
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json')
  setCorsHeaders(response)
  response.end(JSON.stringify(payload))
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []

    request.on('data', (chunk) => {
      chunks.push(chunk)
    })

    request.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })

    request.on('error', reject)
  })
}

function normalizeTranscriptDocument(document) {
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

const server = createServer(async (request, response) => {
  setCorsHeaders(response)

  if (!request.url) {
    sendJson(response, 400, { error: 'Missing request URL.' })
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/transcripts') {
    try {
      const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 25)))
      const collection = await getCollection()
      const documents = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray()
      sendJson(response, 200, { documents: documents.map(normalizeTranscriptDocument) })
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : 'Failed to load transcripts.' })
    }
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/transcripts') {
    try {
      const body = await readJsonBody(request)
      const id = String(body.id || '')

      if (!id) {
        sendJson(response, 400, { error: 'Transcript id is required.' })
        return
      }

      const collection = await getCollection()
      const document = {
        ...body,
        _id: id,
      }

      await collection.updateOne({ _id: id }, { $set: document }, { upsert: true })
      sendJson(response, 200, { id })
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : 'Failed to save transcript.' })
    }
    return
  }

  sendJson(response, 404, { error: 'Not found.' })
})

server.listen(port, () => {
  console.log(`[transcripts-api] listening on http://localhost:${port}`)
})

async function shutdown() {
  try {
    await client.close()
  } finally {
    server.close(() => process.exit(0))
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
