import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Home } from './Home'
import { Publish } from './Publish'
import { NDKProvider } from '../providers/NDKProvider'
import { Footer } from './Footer'
import '../scss/App.scss'
import { Retrieve } from './Retrieve'
import { Header } from './Header'

export const App = () => {
  return (
    <>
    <div id="app">
      <NDKProvider>
        <Router>
          <Header/>
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
