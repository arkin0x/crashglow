import { useEffect, useRef, useState, useContext } from 'react'
import { nip19 } from 'nostr-tools'
import { NDKContext } from '../providers/NDKProvider'

// TODO: support NIP19 nevents as well as hex

export const Retrieve = () => {
  const { ndk } = useContext(NDKContext)
  const neventRef = useRef<HTMLInputElement>(null)
  const [gettingGame, setGettingGame] = useState(false)

  console.log('ndk',ndk)

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

  return (
    <div className="card">
      <label htmlFor="nevent">Enter game nevent:</label><br/>
      <br/>
      <input ref={neventRef} type="text" placeholder="Event name" />
      <br/>
      <br/>
      <button disabled={gettingGame} onClick={getGame}>Play 🕹️</button>
    </div>
  )
}
