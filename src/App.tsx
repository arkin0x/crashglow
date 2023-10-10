import { useEffect, useRef, useState } from 'react'
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { publishTestEvent, HTML, JS, html, js } from './publishTest'
import './scss/App.scss'

const signer = new NDKNip07Signer()
const ndk = new NDK({
  signer,
  explicitRelayUrls: ["wss://dashglow-test.nostr1.com"]//,"wss://relay.damus.io"]
})

const canDecode = (identifier: string) => {
  if (identifier.charAt(0) !== 'n') return false
  return true
}

const isHex = (identifier: string) => {
  const hexRegex = /^[0-9a-fA-F]{64}$/
  return hexRegex.test(identifier)
}

function App() {
  const neventRef = useRef<HTMLInputElement>(null)
  const [gettingGame, setGettingGame] = useState(false)
  const [testEvents, setTestEvents] = useState<any[]>([])

  // DEBUG ONLY
  const pubHTML = async () => {
    const htmlEvent = await publishTestEvent(ndk, html, HTML)
    setTestEvents([...testEvents, htmlEvent])
  }
  const pubJS = async () => {
    const jsEvent = await publishTestEvent(ndk, js, JS)
    setTestEvents([...testEvents, jsEvent])
  }
  ///////////////

  const getGame = async () => {
    if (gettingGame) return
    setGettingGame(true)
    const id = neventRef.current!.value
    let decoded
    if (canDecode(id)) {
      decoded = nip19.decode(id).data.id
    } else if (isHex(id)) {
      decoded = id
    } else {
      console.log('Invalid identifier')
      setGettingGame(false)
      return
    }
    const game = await ndk.fetchEvent({ ids: [decoded] })
    console.log(game)
    setGettingGame(false)
  }

  useEffect(() => {
    const setupNDK = async () => {
      await ndk.connect()
    }
    setupNDK()
  }, [])

  return (
    <>
      <h1>Dashglow</h1>
      <h2>Web games on nostr</h2>
      <div className="card">
        <label htmlFor="nevent">Enter game nevent:</label><br/>
        <br/>
        <input ref={neventRef} type="text" placeholder="Event name" />
        <br/>
        <br/>
        <button disabled={gettingGame} onClick={getGame}>Play</button>
      </div>
      <div className="card">
        <button onClick={pubHTML}>Publish HTML</button>
        <button onClick={pubJS}>Publish JS</button>
        { testEvents.map((event, i) => (
          <div key={i}>
            <p>{event.id}</p>
            <p>{event.data}</p>
          </div>
        )) }
      </div>
    </>
  )
}

export default App
