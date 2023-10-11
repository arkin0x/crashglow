import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { v4 as uuidv4 } from 'uuid';
// import { html, js } from '../assets/ExampleGameHTMLJS.ts'
import { nip19 } from 'nostr-tools'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from "@noble/hashes/utils"
import { getTag } from './utils';

type NDKType = typeof NDK

// kinds
export const BLOB = 5391
export const HTML = 5392
export const CSS = 5393
export const JS = 5394

const CHUNK_SIZE = 100 * 1024 // 100KB

export const publishGame = async (ndk: NDKType, buffer: ArrayBuffer, file: File, kind1: NDKEvent) => {

  const nevent = await nip19.neventEncode({
    id: kind1.id,
    relays: ndk.explicitRelayUrls,
    author: kind1.pubkey,
    kind: 1
  } as nip19.EventPointer)

  sendPayload(ndk, buffer, file, kind1.id, nevent)

  return nevent
}

export const publishKind1 = async (ndk: NDKType, title: string, content: string) => {
  const uuid = uuidv4();
  // TODO: get semver from user input
  const semver = "0.1.0"
  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.tags.push(['subject', title])
  ndkEvent.tags.push(['u', `${uuid}:${semver}`])
  ndkEvent.tags.push(['relays', ...ndk.explicitRelayUrls])
  // TODO: replace domain
  ndkEvent.tags.push(['alt', `This note represents the box of a a web-based video game. Play it at https://domain.com/game/${uuid}:${semver}`])
  ndkEvent.kind = 1
  ndkEvent.content = content
  console.log('publishing kind1...')
  const res = await ndkEvent.publish()
  // res is relay info, not event. just inspect the same event object.
  console.log(res, ndkEvent, ndkEvent.id)
	return ndkEvent
}

// Send a large payload in chunks
export async function sendPayload(ndk: NDKType, payload: ArrayBuffer, file: File, referenceID: string, nevent: string) {
  const chunks = chunkPayload(payload)
  
	chunks.forEach( async (chunk, index) => {
    const hash = bytesToHex(sha256(new Uint8Array(payload)))
    const event = createChunkEvent(ndk, chunk, index, file, referenceID, nevent, hash)
    await event.publish()
    console.log('published chunk', index, event)
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
function createChunkEvent(ndk: NDKType, chunk: ArrayBuffer, index: number, file: File, referenceID: string, nevent: string, hash: string): NDKEvent {
  // Convert chunk to base64 string
  const base64 = base64Encode(chunk)

  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.kind = BLOB
  ndkEvent.content = base64
  ndkEvent.tags.push(['e', referenceID, ndk.explicitRelayUrls[0], "root" ])
  ndkEvent.tags.push(['m', file.type])
  ndkEvent.tags.push(['alt', `This is a binary chunk of a web-based video game. Play the full game at https://crashglow.com/play/${nevent}`])
  ndkEvent.tags.push(['index', index.toString()])
  ndkEvent.tags.push(['x', hash])

  return ndkEvent
}

// Receive a payload from chunk events  
// async function receivePayload(pool: SimplePool, filter: any): Promise<ArrayBuffer> {
//   const chunks: ArrayBuffer[] = []

//   const sub = pool.sub(relays, [filter])

//   for await (const event of sub.events) {
//     if (isValidChunkEvent(event)) {
//       chunks.push(getChunkData(event))  
//     }
//   }

//   sub.unsub()

//   return joinChunks(chunks)
// }

// Helper function to base64 encode ArrayBuffer
function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// reassemble game assets from chunks
export const stitchChunks = (events: Set<NDKEvent>): string[] => {
  // Group events by hash
  const groups = new Map<string, NDKEvent[]>()
  for (const event of events) {
    const hash = event.tags.find(getTag('x'))[1]
    const group = groups.get(hash) ?? []
    group.push(event)
    groups.set(hash, group)
  }

  // Sort events within each group by index
  for (const group of groups.values()) {
    group.sort((a, b) => a.tags.find(getTag('index'))[1] - b.tags.find(getTag('index'))[1])
  }

  // Stitch chunks together within each group
  const result: string[] = []
  for (const group of groups.values()) {
    const chunks = group.map((event) => base64Decode(event.content))
    const fullPayload = joinChunks(chunks)
    const text = new TextDecoder().decode(fullPayload)
    result.push(text)
  }

  return result
}

// Helper function to base64 decode string
function base64Decode(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function joinChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}
