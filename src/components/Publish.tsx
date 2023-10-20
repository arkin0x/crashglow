import { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { publishGame, publishKind1 } from '../libraries/PublishGame'
import { NDKContext } from '../providers/NDKProvider'
import '../scss/Publish.scss'

const PUBLISH_BUTTON_TEXT = "Publish ✨"

export const Publish = () => {
  const navigate = useNavigate()
  const uploadRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const ndk = useContext(NDKContext)
  const [extensionReady, setExtensionReady] = useState<boolean | null>(false)
  const [publishButton, setPublishButton] = useState<string>(PUBLISH_BUTTON_TEXT)

  const activatePlugin = async () => {
    if (extensionReady === false ) {
      setPublishButton("Waiting for Nostr extension...")
      try {
        if (window.nostr){
          await window.nostr.getPublicKey()
          setExtensionReady(true)
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

  useEffect(() => {
    if (window.nostr) {
      activatePlugin()
    }
  }, [])

  const publish = async () => {
    console.log('call to publish')
    if (ndk === null) return
    if (uploadRef.current?.files === null) return
    if (contentRef.current?.value === null) return
    if (titleRef.current?.value === null) return

    console.log(uploadRef.current!.files)

    // publish kind1, get id
    const kind1 = await publishKind1(ndk, titleRef.current!.value, contentRef.current!.value)

    for (const file of uploadRef.current!.files) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]
        const nevent = await publishGame(ndk, base64, file, kind1)
        // navigate(`/play/${nevent}`)
      }
    }
  }

  return (
    <>
    <div className="card">
      <h1>Publish a game</h1>
      { extensionReady ?
      <>
        <h2 className="left">Supported web game formats:</h2>
        <ul>
          <li>PICO-8 Web Export</li>
          <li><em>Maybe</em> other HTML/JS games. Give it a shot!</li>
        </ul>
        <p className="left">
          Select the HTML and JavaScript files that make up your game.
        </p>
        <input required ref={uploadRef} type="file" multiple accept='html,js,png,jpg,jpeg,gif' />
        <br/>
        <br/>
        <input required id="game-title" ref={titleRef} placeholder="Enter game title" />
        <br/>
        <br/>
        <textarea ref={contentRef} placeholder="Enter game description" />
        <br/>
        <br/>
        <button onClick={publish}>Publish 🚀</button>
      </>
      : <button type="button" onClick={activatePlugin}>{publishButton}</button> }
    </div>
    <br/>
    <br/>
    <hr/>
    <button onClick={() => navigate('/')}>⏮ Go Back</button>
    </>
  )
}