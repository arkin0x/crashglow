import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Retrieve } from './Retrieve'

const PUBLISH_BUTTON_TEXT = "Publish ✨"

export const Home = () => {
  const navigate = useNavigate()
  const [publishButton, setPublishButton] = useState<string>(PUBLISH_BUTTON_TEXT)
  const [extensionReady, setExtensionReady] = useState<boolean | null>(false)

  const activatePlugin = async () => {
    if (extensionReady) {
      proceedToPublish()
    } else if (extensionReady === false ) {
      setPublishButton("Waiting for Nostr extension...")
      try {
        if (window.nostr){
          await window.nostr.getPublicKey()
          setExtensionReady(true)
          proceedToPublish()
        }
      } catch (e) {
        // extension failed
        setPublishButton("Nostr extension failed to connect. Retry?")
        setExtensionReady(null)
        // setTimeout(activatePlugin, 2000)
      }
    } else if (extensionReady === null ){
      window.location.reload()
    }
  }

  const proceedToPublish = () => {
    navigate('/publish')
  }

  return (
    <div id="component-home">
      <h1>Crashglow</h1>
      <h2>Distributed Arcade on Nostr</h2>
      <h3>Powered by Magic Internet Money!</h3>
      <Retrieve/>
      <hr/>
      <button type="button" onClick={activatePlugin}>{publishButton}</button>
    </div>
  )
}