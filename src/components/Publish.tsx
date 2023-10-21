import { useState, useContext, useEffect, useRef } from 'react'
import { publishGame, publishKind1 } from '../libraries/PublishGame'
import { NDKContext } from '../providers/NDKProvider'
import '../scss/Publish.scss'
import { NostrWindow } from '../types/NostrWindow'

const PUBLISH_BUTTON_TEXT = "Publish ✨"

// This declaration allows us to access window.nostr without TS errors.
// https://stackoverflow.com/a/47130953
declare global {
    interface Window {
        nostr: NostrWindow;
    }
}

export const Publish = () => {
  const [upload, setUpload] = useState<FileList | null>(null)
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [uuid, setUuid] = useState<string>('')
  const [version, setVersion] = useState<string>('')

  const uploadRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const uuidRef = useRef<HTMLInputElement>(null)
  const versionRef = useRef<HTMLInputElement>(null)
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


  const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUpload(event.target.files)
    }
  }

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
  }

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value)
  }

  const handleUuidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUuid(event.target.value)
  }

  const handleVersionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVersion(event.target.value)
  }


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
      if (reader.result !== null) {
        reader.onload = async () => {
          const base64 = (reader.result! as string).split(',')[1]
          const nevent = await publishGame(ndk, base64, file, kind1)
          console.log('published', nevent)
          // navigate(`/play/${nevent}`)
        }
      } else {
        alert('Error: uploaded file could not be read')
      }
    }
  }

  const readyToPublish = (): boolean => {
    const ready = (
      upload?.length === 2 &&
      title &&
      content &&
      version
    )
    if (ready) return false // "disabled" is false
    return true
  }

  return (
    <>
      <h2>Publish a game</h2>
      { extensionReady ?
      <>
        <h3 className="left">Supported web game formats:</h3>
        <ul>
          <li>PICO-8 Web Export</li>
          {/* <li><em>Maybe</em> other HTML/JS games. Give it a shot!</li> */}
        </ul>
        <p className="left">
          Select the following files:
        </p>
        <ul>
          <li>the PICO-8 JavaScript file that you exported from your game</li>
          <li>a PNG, JPG, or GIF "box art" image for your game</li>
        </ul>
        <div className="card">
          Choose your JavaScript file and "box art" image:
          <input required ref={uploadRef} type="file" multiple accept='html,js,png,jpg,jpeg,gif' onChange={handleUploadChange} />
          <br/>
          <br/>
          <input className="glass-input input-title" required id="game-title" ref={titleRef} placeholder="Enter game title" onChange={handleTitleChange} />
          <input className="glass-input" id="game-uuid" ref={uuidRef} placeholder="If you're updating your game, you must enter its UUID!" onChange={handleUuidChange} />
          <input className="glass-input" required id="game-version" ref={versionRef} placeholder="Enter game version (semver), e.g. 0.1.0" onChange={handleVersionChange} />
          {/* TODO: image upload for game box art */}
          <br/>
          <br/>
          <textarea className="glass-input" ref={contentRef} placeholder="Enter game description + instructions" onChange={handleContentChange} />
        </div>
        <br/>
        <button className="button" disabled={readyToPublish()} onClick={publish}>Publish 🚀</button>
      </>
      : <button className="button" type="button" onClick={activatePlugin}>{publishButton}</button> }
    <br/>
    <br/>
    <br/>
    </>
  )
}