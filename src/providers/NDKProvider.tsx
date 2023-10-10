import { useState, useEffect, createContext } from "react"
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'

const signer = new NDKNip07Signer()
const ndkRef = new NDK({
  signer,
  explicitRelayUrls: ["wss://dashglow-test.nostr1.com"]//,"wss://relay.damus.io"]
})

type NDKContextType = NDK

export const NDKContext = createContext<NDKContextType>(ndkRef)

type NDKProviderProps = {
  children: React.ReactNode
}

export const NDKProvider: React.FC<NDKProviderProps> = ({ children }) => {
  const [ndk, setNDK] = useState()

  useEffect(() => {
    const setupNDK = async () => {
      await ndkRef.connect()
      setNDK(ndkRef)
    }
    setupNDK()
  }, [])

  return (
    <NDKContext.Provider value={ndk}>
      {children}
    </NDKContext.Provider>
  )
}