import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
// import { html, js } from '../assets/ExampleGameHTMLJS.ts'
import { nip19 } from 'nostr-tools'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from "@noble/hashes/utils"

type NDKType = typeof NDK

// kinds
export const BLOB = 5391
export const HTML = 5392
export const CSS = 5393
export const JS = 5394

const CHUNK_SIZE = 100 * 1024 // 100KB

export const publishGame = async (ndk: NDKType, title: string, content: string, buffer: ArrayBuffer, file: File) => {
	// publish kind1, get id
  const kind1 = await publishKind1(ndk, title, content)

  const nevent = await nip19.neventEncode({
    id: kind1.id,
    relays: ndk.explicitRelayUrls,
    author: kind1.pubkey,
    kind: 1
  } as nip19.EventPointer)

  sendPayload(ndk, buffer, file, kind1.id, nevent)

  return nevent
}

const publishKind1 = async (ndk: NDKType, title: string, content: string) => {
  const ndkEvent = new NDKEvent(ndk)
  ndkEvent.tags.push(['subject', title])
  ndkEvent.kind = 1
  ndkEvent.content = content
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

// // Check if event contains a valid chunk
// function isValidChunkEvent(event: Event): boolean {
//   // ... validate chunk event
//   return true
// }

// // Extract chunk data from event 
// function getChunkData(event: Event): ArrayBuffer {
//   // ... decrypt and extract chunk data
//   return chunkData
// }

// // Join all chunks back into the original payload
// function joinChunks(chunks: ArrayBuffer[]): ArrayBuffer {
//   const fullPayload = new ArrayBuffer(chunks.reduce((a, c) => a + c.byteLength, 0))
  
//   let offset = 0
//   for (const chunk of chunks) {
//     new Uint8Array(fullPayload).set(new Uint8Array(chunk), offset)
//     offset += chunk.byteLength
//   }

//   return fullPayload
// }

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