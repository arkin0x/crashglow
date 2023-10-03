import { useEffect, useRef, useState } from 'react'
import NDK from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import reactLogo from './assets/react.svg'
import './scss/App.scss'

const ndk = new NDK({
  explicitRelayUrls: ["wss://dashglow-test.nostr1.com","wss://relay.damus.io"]
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
    const game = await ndk.fetchEvent({ kinds: [1], ids: [decoded] })
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
      <div>
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>
      <h1>Dashglow</h1>
      <h2>Web games on nostr</h2>
      <div className="card">
        <label htmlFor="nevent">Enter game nevent:</label><br/>
        <input ref={neventRef} type="text" placeholder="Event name" />
        <button disabled={gettingGame} onClick={getGame}>Play</button>
      </div>
    </>
  )
}

export default App
