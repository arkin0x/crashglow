import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { v4 as uuidv4 } from 'uuid';
// import { html, js } from '../assets/ExampleGameHTMLJS.ts'
import { nip19 } from 'nostr-tools'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from "@noble/hashes/utils"
import { getTag } from './utils';
import { nostrBuildUploadImage } from './nostr-build';

// kinds
export const BLOB = 5391
export const HTML = 5392
export const CSS = 5393
export const JS = 5394

const CHUNK_SIZE = 100 * 1024 // 100KB

export const publishGame = async (ndk: NDK, base64: string, file: File, kind1: NDKEvent) => {

  // obtain the nevent for the game so the chunks can reference it.
  const nevent = await nip19.neventEncode({
    id: kind1.id,
    relays: ndk.explicitRelayUrls,
    author: kind1.pubkey,
    kind: 1
  } as nip19.EventPointer)

  sendPayload(ndk, base64, file, kind1.id, nevent)

  return nevent
}

export const publishKind1 = async (ndk: NDK, title: string, content: string, version: string, gameuuid: string, upload: FileList) => {
  const uuid = gameuuid || uuidv4();
  const semver = version || "0.1.0"
  const gameid = `${uuid}:${semver}`
  const ndkEvent = new NDKEvent(ndk)

  // TODO: nostr.build API to upload box art
  const boxart = Array.from(upload).filter(file => ['image/png', 'image/jpeg', 'image/gif'].includes(file.type))[0]

  const {url: boxartURL} = await nostrBuildUploadImage(boxart)

  ndkEvent.tags.push(['subject', title])
  ndkEvent.tags.push(['u', gameid])
  ndkEvent.tags.push(['t','crashglow']) // generic hashtag making it easier to query for games
  ndkEvent.tags.push(['relays', ...ndk.explicitRelayUrls])
  // TODO: replace domain
  ndkEvent.tags.push(['alt', `This note represents the box of a a web-based video game. Play it at https://crashglow.com/game/${gameid}`])
  ndkEvent.kind = 1
  ndkEvent.content = `${boxartURL}\n${content}\n\n${title}, ${semver}\nPlay now at https://crashglow.com/game/${gameid}`

  console.log('publishing kind1...')
  const res = await ndkEvent.publish()
  // res is relay info, not event. just inspect the same event object.
  console.log(res, ndkEvent, ndkEvent.id)
	return ndkEvent
}

// Send a large payload in chunks
export async function sendPayload(ndk: NDK, base64: string, file: File, referenceID: string, nevent: string) {
  const chunks = chunkPayload(base64)
  
  // get the hash of the file; this serves as an identifier for the file
  const plaintext = atob(base64)
  // console.log('plaintext',plaintext) // the file is intact!
  const binarytext = (new TextEncoder()).encode(plaintext)
  const hash = bytesToHex(sha256(binarytext))

  // create an event for each chunk
	chunks.forEach( async (chunk, index) => {
    const event = createChunkEvent(ndk, chunk, index, file, referenceID, nevent, hash)
    await event.publish()
    console.log('published chunk', index, event)
  })
}

// Helper to chunk up a large payload from ArrayBuffer into Array of ArrayBuffers
function chunkPayload(base64:string): string[] {
  const chunks: string[] = []
  let offset = 0

  while(offset < base64.length) {
    const chunk = base64.slice(offset, offset + CHUNK_SIZE)
    chunks.push(chunk)
    offset += CHUNK_SIZE
  }

  return chunks
}

// Create a Nostr event to send a chunk
function createChunkEvent(ndk: NDK, chunk: string, index: number, file: File, referenceID: string, nevent: string, hash: string): NDKEvent {
  // Convert chunk to base64 string

  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.kind = BLOB
  ndkEvent.content = chunk 
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
export const stitchChunks = (events: Set<NDKEvent>): { [unique: string]: string } => {
  // Group events by hash and mime
  const groups: { [unique: string]: NDKEvent[] } = {}
  for (const event of events) {
    const hash = event.tags.find(getTag('x'))[1]
    const mime = event.tags.find(getTag('m'))[1]
    const unique = `${mime}:${hash}`
    const group = groups[unique] ?? []
    group.push(event)
    groups[unique] = group
  }

  // Sort events within each group by index
  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.tags.find(getTag('index'))[1] - b.tags.find(getTag('index'))[1])
  }

  // Stitch chunks together within each group
  const result: { [unique: string]: string } = {}
  for (const [unique, group] of Object.entries(groups)) {
    const chunks = group.map((event) => atob(event.content))
    result[unique] = chunks.join('')
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
