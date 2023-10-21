import { useEffect, useContext, useState } from 'react'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKContext } from '../providers/NDKProvider'
import { Publish } from './Publish'

export const Home = () => {
  const [showGames, setShowGames] = useState<boolean>(true)
  const ndk = useContext(NDKContext)
  const [games, setGames] = useState<NDKEvent[]>([])

  useEffect(() => {
    if (!ndk) return
    const fetchLatestGames = async () => {
      const loaded = await ndk.fetchEvents({ kinds: [1], limit: 10, "#t": ["crashglow"] })
      setGames(Array.from(loaded))
    }
    fetchLatestGames()
  }, [ndk])

  const latestGames = () => {
    const latest = games.map((game) => {
      if (!game.content) return null
      return (
        <div key={game.id} className="game-card">
          <h3 className="game-card-title">{game.tags.find((tag) => tag[0] === 'subject')![1]}</h3>
          <img className="game-card-preview" src={game.content.split('\n')[0]}/>
        </div>
      )
    })
    if (latest.length === 0) return <p>No games found! 😿</p>
    return latest
  }

  return (
    <div id="component-home" className="primary">
      <div className="layout">
        { showGames ?  <><h2>Games</h2>{latestGames()}</> : null }
        <Publish setShowGames={setShowGames}/>
      </div>
    </div>
  )
}