import { useRef, useState, useContext, useEffect } from 'react'
import { nip19 } from 'nostr-tools'
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk'
import { NDKContext } from '../providers/NDKProvider'
import { canDecode, isHex, isUUIDv4, semverCompare } from '../libraries/utils'
import { BLOB, stitchChunks } from '../libraries/PublishGame'
import Pico8Game from './Pico8Game'
import { useNavigate } from 'react-router-dom'

// TODO: support NIP19 nevents as well as hex

export const Retrieve: React.FC<{setPlaying: React.Dispatch<React.SetStateAction<boolean>>, urlIdentifier?: string}> = ({ setPlaying, urlIdentifier }) => {
  const navigate = useNavigate()
  const ndk = useContext(NDKContext)
  const identifier = useRef<HTMLInputElement>(null)
  const [gettingGame, setGettingGame] = useState(false)
  const [assets, setAssets] = useState<{[key: string]: string}>({})
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // fetch the game by URL id or uuid or nevent
    if (!ndk) return
    getGame()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIdentifier, ndk])

  const getGame = async () => {
    const id = urlIdentifier || identifier.current!.value
    if (!id) setNotFound(true)
    if (gettingGame) return
    setGettingGame(true)
    if (isUUIDv4(id)) return getGameByUUID(id)
    getGameByID(id)
  }

  const getGameByID = async (id: string) => {
    console.log('fetching game by event id or nevent', urlIdentifier)
    let decoded
    if (canDecode(id)) {
      decoded = ((nip19.decode(id) as nip19.DecodeResult).data as nip19.EventPointer).id
    } else if (isHex(id)) {
      decoded = id
    } else {
      console.log('Invalid identifier')
      setGettingGame(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: NDKFilter = { "#e": [decoded], "kinds": [BLOB as any] }
    const assetChunks = await ndk!.fetchEvents(filter)
    setGettingGame(false)
    const assets = stitchChunks(assetChunks)
    console.log('stitched game assets',assets)
    setAssets(assets)
  }

  const getGameByUUID = async (uuid: string) => {
    if (!ndk) return
    const gameFilter: NDKFilter = { "#u": [uuid], "kinds": [1] }
    const games = Array.from(await ndk.fetchEvents(gameFilter))
    if (games.length === 0) {
      console.log('Game not found')
      setNotFound(true)
      return
    } 
    const sortedGames = games.sort((a: NDKEvent, b: NDKEvent) => {
      const semverA = a.tags.find((tag) => tag[0] === 'u')![2];
      const semverB = b.tags.find((tag) => tag[0] === 'u')![2];
      return semverCompare(semverB, semverA);
    });
    console.log(sortedGames)
    const newestVersion = sortedGames[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunkFilter: NDKFilter = { "#e": [newestVersion.id], "kinds": [BLOB as any] }
    const assetChunks = await ndk.fetchEvents(chunkFilter)
    const assets = stitchChunks(assetChunks)
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
    return <Pico8Game gameJS={js} setPlaying={setPlaying}/>
  }

  return (
    <div id="component-retrieve" className="primary">
      { 
      notFound ? 
        <div className="layout">
          <h2>Game not found</h2>
          <button className="button" onClick={() => {navigate(`/`)}}>Bummer 😿</button>
        </div>
      :
        Object.keys(assets).length > 0 
        ? 
          <div className="game-layout">{loadGame()}</div> 
        : 
          urlIdentifier 
          ? 
            <div className="layout">
              <h2>Loading...</h2> 
            </div>
          :
            <div className="layout">
              <h2>Load a Game</h2>
              <label htmlFor="nevent">Enter game nevent:</label><br/>
              <br/>
              <input ref={identifier} type="text" placeholder="Event name" />
              <br/>
              <br/>
              <button className="button" disabled={gettingGame || !ndk} onClick={getGame}>Play 🕹️</button>
            </div>
      }
    </div>
  )
}
