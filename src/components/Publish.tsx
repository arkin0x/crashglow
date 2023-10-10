import { useContext, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { publishGame } from '../libraries/PublishGame'
import { NDKContext } from '../providers/NDKProvider'
import '../scss/Publish.scss'


export const Publish = () => {
  const navigate = useNavigate()
  const uploadRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const ndk = useContext(NDKContext)

  useEffect

  const publish = async () => {
    if (ndk === null) return
    if (uploadRef.current?.files === null) return
    if (contentRef.current?.value === null) return
    if (titleRef.current?.value === null) return
    console.log(uploadRef.current!.files)
    for (const file of uploadRef.current!.files) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer
        const nevent = await publishGame(ndk, titleRef.current!.value, contentRef.current!.value, buffer, file)
        navigate(`/play/${nevent}`)
      }
    }
  }
  ///////////////

  return (
    <>
    <div className="card">
      <h1>Publish a game</h1>
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
    </div>
    <br/>
    <br/>
    <hr/>
    <button onClick={() => navigate('/')}>⏮ Go Back</button>
    </>
  )
}