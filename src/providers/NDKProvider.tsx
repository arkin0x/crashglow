import { useState, useEffect, createContext } from "react"
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'

const signer = new NDKNip07Signer()
const ndkRef = new NDK({
  signer,
  explicitRelayUrls: ["wss://dashglow-test.nostr1.com"]//,"wss://relay.damus.io"]
})

export const NDKContext = createContext({ndk: ndkRef})

type NDKProviderProps = {
  children: React.ReactNode
}

export const NDKProvider: React.FC<NDKProviderProps> = ({ children }) => {
  const [ndk, setNDK] = useState(null)

  useEffect(() => {
    const setupNDK = async () => {
      await ndkRef.connect()
      setNDK(ndkRef)
    }
    setupNDK()
  }, [])

  return (
    <NDKContext.Provider value={{ndk}}>
      {children}
    </NDKContext.Provider>
  )
}