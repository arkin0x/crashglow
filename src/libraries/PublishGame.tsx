import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { html, js } from '../assets/ExampleGameHTMLJS.ts'
import { Event, SimplePool } from 'nostr-tools'
import { sha256 } from '@noble/hashes/sha256'

type NDKType = typeof NDK

// kinds
export const BLOB = 5391
export const HTML = 5392
export const CSS = 5393
export const JS = 5394

const CHUNK_SIZE = 100 * 1024 // 100KB

export const publishGame = async (ndk: NDKType, content, buffer) => {
	// publish kind1, get id
  const kind1id = await publishKind1(ndk, content)
  sendPayload(ndk, buffer, kind1id)
}

const publishKind1 = async (ndk: NDKType, content: string) => {
  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.kind = 1
  ndkEvent.content = content
  const res = await ndkEvent.publish()
  // res is relay info, not event. just inspect the same event object.
  console.log(res, ndkEvent, ndkEvent.id)
	return ndkEvent.id
}

// Send a large payload in chunks
export async function sendPayload(ndk: NDKType, payload: ArrayBuffer, referenceID: string) {
  const chunks = chunkPayload(payload)
  
	chunks.forEach( async (chunk, index) => {
    const event = createChunkEvent(ndk, chunk, index, referenceID)
    await relay.publish(event)
  })
}

// Helper to chunk up a large payload from ArrayBuffer into Array of ArrayBuffers
function chunkPayload(payload: ArrayBuffer): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = []
  let offset = 0

  while(offset < payload.byteLength) {
    const chunk = payload.slice(offset, offset + CHUNK_SIZE)
    chunks.push(chunk)
    offset += CHUNK_SIZE
  }

  return chunks
}

// Create a Nostr event to send a chunk
function createChunkEvent(ndk: NDKType, chunk: ArrayBuffer, index: number, referenceID): Event {
  // Convert chunk to base64 string
  const base64 = base64Encode(chunk)

  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.kind = BLOB
  ndkEvent.content = base64
  ndkEvent.tags.push(['e', referenceID, ])


  // Create event
  const event: Event = {
    kind: BLOB, // custom blob kind for chunks
    tags: [],
    created_at: Date.now()/1000, 
    pubkey: myPubKey,
    content: JSON.stringify({
      chunkId: nextChunkId++,
      data: base64,
      // other metadata
    }), 
    id: '', // will be calculated
    sig: ''  // will be signed
  }

  // Sign event
  event.id = getEventHash(event)
  event.sig = signEvent(event, myPrivKey)

  return event
}

export const publishTestEvent = async (ndk: NDKType, c, k ) => {
  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.kind = k
  ndkEvent.content = c
  const res = await ndkEvent.publish()
  // res is relay info, not event. just inspect the same event object.
  console.log(res, ndkEvent, ndkEvent.id)
  return ndkEvent
}

// anthropic

// Receive a payload from chunk events  
async function receivePayload(pool: SimplePool, filter: any): Promise<ArrayBuffer> {
  const chunks: ArrayBuffer[] = []

  const sub = pool.sub(relays, [filter])

  for await (const event of sub.events) {
    if (isValidChunkEvent(event)) {
      chunks.push(getChunkData(event))  
    }
  }

  sub.unsub()

  return joinChunks(chunks)
}

// Helper function to base64 encode ArrayBuffer
function base64Encode(buffer: ArrayBuffer) {
  //...
}

// Check if event contains a valid chunk
function isValidChunkEvent(event: Event): boolean {
  // ... validate chunk event
  return true
}

// Extract chunk data from event 
function getChunkData(event: Event): ArrayBuffer {
  // ... decrypt and extract chunk data
  return chunkData
}

// Join all chunks back into the original payload
function joinChunks(chunks: ArrayBuffer[]): ArrayBuffer {
  const fullPayload = new ArrayBuffer(chunks.reduce((a, c) => a + c.byteLength, 0))
  
  let offset = 0
  for (const chunk of chunks) {
    new Uint8Array(fullPayload).set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  return fullPayload
}

// Get uploaded file from input element
// const input = document.getElementById('fileInput') as HTMLInputElement
// const file = input.files![0]

// // Read file into ArrayBuffer
// const reader = new FileReader()
// reader.readAsArrayBuffer(file) 

// reader.onload = () => {
//   const arrayBuffer = reader.result as ArrayBuffer

//   // Send array buffer to be chunked and sent
//   sendPayload(relay, arrayBuffer) 
// }