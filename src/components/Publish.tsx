import { useState, useContext, useRef } from 'react'
import { publishGame, publishKind1 } from '../libraries/PublishGame'
import { NDKContext } from '../providers/NDKProvider'
import '../scss/Publish.scss'
// import { NostrWindow } from '../types/NostrWindow'

const PUBLISH_BUTTON_TEXT = "Publish ✨"

// This declaration allows us to access window.nostr without TS errors.
// https://stackoverflow.com/a/47130953
// declare global {
//     interface Window {
//         nostr: NostrWindow;
//     }
// }

export const Publish: React.FC<{setShowGames: React.Dispatch<React.SetStateAction<boolean>>}> = ({setShowGames}) => {
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
  const [newlyPublished, setNewlyPublished] = useState<string|null>(null)

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
    if (!ndk) return
    if (!upload) return

    setShowGames(false)

    // publish kind1, get id
    const kind1 = await publishKind1(ndk, title, content, version, uuid, upload)

    for (const file of upload) {
      console.log(file)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = (reader.result! as string).split(',')[1]
        const nevent = await publishGame(ndk, base64, file, kind1)
        console.log('published', nevent)
        setNewlyPublished(nevent)
        // navigate(`/play/${nevent}`)
      }
    }
  }

  const readyToPublish = (): boolean => {
    if (upload === null) return true
    if (upload.length !== 2) return true
    // check if upload contains a JS file and an image
    if (!Array.from(upload).some(file => file.type === 'text/javascript')) return true
    if (!Array.from(upload).some(file => ['image/png', 'image/jpeg', 'image/gif'].includes(file.type))) return true
    if (title === '') return true
    if (content === '') return true
    if (version === '') return true
    return false
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
          <input className="glass-input" id="game-uuid" ref={uuidRef} placeholder="UUID (if updating)" onChange={handleUuidChange} />
          <input className="glass-input" required id="game-version" ref={versionRef} placeholder="Version (0.1.0)" onChange={handleVersionChange} />
          <textarea className="glass-input" ref={contentRef} placeholder="Description + instructions" onChange={handleContentChange} />
        </div>
        <br/>
        { !newlyPublished ? <button className="button" disabled={readyToPublish()} onClick={publish}>Publish 🚀</button> : null }
        { newlyPublished ? <><h3>Published!</h3><p><button className="button" onClick={ () => {window.location.href = `/play/${newlyPublished}`}}>Play it now 👾</button></p></> : null }
      </>
      : <button className="button" type="button" onClick={activatePlugin}>{publishButton}</button> }
    <br/>
    <br/>
    <br/>
    </>
  )
}