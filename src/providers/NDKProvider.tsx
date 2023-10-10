import { useEffect, createContext } from "react"
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk'

const signer = new NDKNip07Signer()
const ndk = new NDK({
  signer,
  explicitRelayUrls: ["wss://dashglow-test.nostr1.com"]//,"wss://relay.damus.io"]
})

export const NDKContext = createContext(ndk)

type NDKProviderProps = {
  children: React.ReactNode
}

export const NDKProvider: React.FC<NDKProviderProps> = ({ children }) => {
  useEffect(() => {
    const setupNDK = async () => {
      await ndk.connect()
    }
    setupNDK()
  }, [])

  return (
    <NDKContext.Provider value={ndk}>
      {children}
    </NDKContext.Provider>
  )
}