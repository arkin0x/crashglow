import { useRef, useState, useContext } from 'react'
import { nip19 } from 'nostr-tools'
import { NDKContext } from '../providers/NDKProvider'
import { canDecode, isHex, replaceScript } from '../libraries/utils'
import { BLOB, stitchChunks } from '../libraries/PublishGame'

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

  const getHTMLAsset = () => {
    let html = '', js = ''
    for (const [key, value] of Object.entries(assets)) {
      if (key.split(':')[0] === 'text/html') {
        html = value
      }
      if (key.split(':')[0] === 'text/javascript') {
        js = value
      }
    }
    return replaceScript(html, js)
  }

  return (
    <div className="card">
      <label htmlFor="nevent">Enter game nevent:</label><br/>
      <br/>
      <input ref={neventRef} type="text" placeholder="Event name" />
      <br/>
      <br/>
      <button disabled={gettingGame} onClick={getGame}>Play 🕹️</button>
      { getHTMLAsset() ? <div id="play-frame">
        <br/>
        <iframe width="500px" height="500px" srcDoc={getHTMLAsset()} />
      </div> : null }
    </div>
  )
}
