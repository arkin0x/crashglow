import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Home } from './Home'
import { Publish } from './Publish'
import { NDKProvider } from '../providers/NDKProvider'
import { Footer } from './Footer'
import logo from '../assets/tech_cabinet-0.png'
import '../scss/App.scss'
import { Retrieve } from './Retrieve'

export const App = () => {
  return (
    <>
    <div id="app">
      <header id="header">
        <img id="logo" className="flex-across" src={logo} alt="logo" />
        <h1 id="app-name" className="flex-across">Crash Glow</h1>
      </header>
      <NDKProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/load" element={<Retrieve/>}/>
            <Route path="/publish" element={<Publish/>} />
          </Routes>
          <Footer/>
        </Router>
      </NDKProvider>
    </div>
    </>
  )
}
