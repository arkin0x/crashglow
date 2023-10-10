import { useNavigate } from 'react-router-dom'
import { Retrieve } from './Retrieve'

export const Home = () => {
  const navigate = useNavigate()

  return (
    <div id="component-home">
      <h1>Crashglow</h1>
      <h2>Web games on nostr</h2>
      <Retrieve/>
      <hr/>
      <button type="button" onClick={() => navigate('/publish')}>Publish ✨</button>
    </div>
  )
}