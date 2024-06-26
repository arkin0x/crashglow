import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Home } from './Home'
import { Publish } from './Publish'
import { NDKProvider } from '../providers/NDKProvider'
import { Footer } from './Footer'
import '../scss/App.scss'
import { Retrieve } from './Retrieve'
import { Header } from './Header'
import { Game } from './Game'

export const App = () => {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const connect = async () => {
      if (window.nostr){
        await window.nostr.getPublicKey()
      }
    }
    connect()
  },[])
  return (
    <>
    <div id="app">
      <NDKProvider>
        <Router>
          <Header/>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/load" element={<Retrieve setPlaying={setPlaying} />} />
            <Route path="/game/:id" element={<Game setPlaying={setPlaying}/>} />
            <Route path="/publish" element={<Publish/>} />
          </Routes>
          { playing ? null : <Footer/> }
        </Router>
      </NDKProvider>
    </div>
    </>
  )
}
