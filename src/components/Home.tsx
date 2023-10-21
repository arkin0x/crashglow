import { useEffect, useContext, useState } from 'react'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKContext } from '../providers/NDKProvider'
import { Publish } from './Publish'

export const Home = () => {
  const ndk = useContext(NDKContext)
  const [games, setGames] = useState<NDKEvent[]>([])

  useEffect(() => {
    if (!ndk) return
    const fetchLatestGames = async () => {
      const loaded = await ndk.fetchEvents({ kinds: [1], limit: 10, "#t": ["crashglow"] })
      setGames(Array.from(loaded))
      console.log(loaded)
    }
    fetchLatestGames()
  }, [ndk])

  const latestGames = () => {
    const latest = games.map((game) => {
      return (
        <div key={game.id}>
          <h3>{game.tags.find((tag) => tag[0] === 'subject')![1]}</h3>
          <p>{game.content}</p>
        </div>
      )
    })
    console.log(latest)
    if (latest.length === 0) return <p>No games found! 😿</p>
  }

  return (
    <div id="component-home" className="primary">
      <div className="layout">
        <h2>Games</h2>
        { latestGames() }
        <Publish/>
      </div>
    </div>
  )
}