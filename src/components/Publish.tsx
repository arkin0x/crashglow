import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sha256 } from '@noble/hashes/sha256'

export const Publish = () => {
  const navigate = useNavigate()
  const uploadRef = useRef<HTMLInputElement>(null)

  const publish = async () => {
    if (uploadRef.current?.files === null) return
    console.log(uploadRef.current!.files)
    for (const file of uploadRef.current!.files) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer
        sendPayload(ndk, buffer)
      }
    }
  }
  ///////////////

  return (
    <>
    <div className="card">
      <h1>Publish a game</h1>
      <input ref={uploadRef} type="file" multiple />&nbsp;
      <button onClick={publish}>Publish 🚀</button>
    </div>
    <br/>
    <br/>
    <hr/>
    <button onClick={() => navigate('/')}>⏮ Go Back</button>
    </>
  )
}