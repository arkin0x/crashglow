import { useRef, useState, useContext } from 'react'
import { nip19 } from 'nostr-tools'
import { NDKContext } from '../providers/NDKProvider'
import { canDecode, isHex } from '../libraries/utils'
import { BLOB, stitchChunks } from '../libraries/PublishGame'
import Pico8Game from './Pico8Game'

// TODO: support NIP19 nevents as well as hex

export const Retrieve = () => {
  const ndk = useContext(NDKContext)
  const neventRef = useRef<HTMLInputElement>(null)
  const [gettingGame, setGettingGame] = useState(false)
  const [assets, setAssets] = useState<{[key: string]: string}>({})

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
    const assetChunks = await ndk.fetchEvents({ "#e": [decoded], "kinds": [BLOB] })
    setGettingGame(false)
    const assets = stitchChunks(assetChunks)
    console.log('stitched game assets',assets)
    setAssets(assets)
  }

  const loadGame = () => {
    if (Object.keys(assets).length === 0) return null

    let js = ''
    // let html = null
    for (const [key, value] of Object.entries(assets)) {
      // if (key.startsWith('text/html')) {
      //   html = value
      // }
      if (key.startsWith('text/javascript')) {
        js = value
      }
    }
    return <Pico8Game gameJS={js} />
  }

  return (
    <div id="component-retrieve" className="primary">
      { Object.keys(assets).length > 0 ? 
      <div className="game-layout">{loadGame()}</div> : 
      <div className="layout">
        <h2>Load a Game</h2>
        <label htmlFor="nevent">Enter game nevent:</label><br/>
        <br/>
        <input ref={neventRef} type="text" placeholder="Event name" />
        <br/>
        <br/>
        <button className="button" disabled={gettingGame} onClick={getGame}>Play 🕹️</button>
        <div id="play-frame">
          <br/>
          { loadGame() }
        </div>
      </div> }
    </div>
  )
}
