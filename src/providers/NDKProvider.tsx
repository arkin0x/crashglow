import { useState, useEffect, createContext } from "react"
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'

type NDKContextType = NDK | null | undefined

export const NDKContext = createContext<NDKContextType>(null)

type NDKProviderProps = {
  children: React.ReactNode
}

export const NDKProvider: React.FC<NDKProviderProps> = ({ children }) => {
  const [ndk, setNDK] = useState<NDK>()

  useEffect(() => {
    const setupNDK = async () => {
      // while (!window.nostr) {
      //   await new Promise((resolve) => setTimeout(resolve, 100))
      // }
      const signer = new NDKNip07Signer(3000)
      const ndkRef = new NDK({
        signer: window.nostr ? signer : undefined,
        explicitRelayUrls: ["wss://dashglow-test.nostr1.com",'wss://relay.primal.net','wss://relay.damus.io','wss://relayable.org','wss://relay.nostr.me','wss://nos.lol','wss://relay.nostr.band']
      })
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