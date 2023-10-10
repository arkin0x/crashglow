import { Routes, Route } from 'react-router-dom'
import { Retrieve } from './Retrieve'
import { Publish } from './Publish'
import { NDKProvider } from '../providers/NDKProvider'
import './scss/App.scss'

export const App = () => {

  return (
    <div id="app">
      <NDKProvider>
        <Routes>
          <Route path="/" element={
            <>
              <h1>Crashglow</h1>
              <h2>Web games on nostr</h2>
              <Retrieve/>
            </>
          }/>
          <Route path="/publish" element={<Publish/>} />
        </Routes>
      </NDKProvider>
    </div>
  )
}
