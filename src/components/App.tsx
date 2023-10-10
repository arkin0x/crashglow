import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Home } from './Home'
import { Publish } from './Publish'
import { NDKProvider } from '../providers/NDKProvider'
import '../scss/App.scss'
import logo from '../assets/tech_cabinet-0.png'

export const App = () => {

  return (
    <>
    <img src={logo} alt="logo" />
    <div id="app">
      <NDKProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/publish" element={<Publish/>} />
          </Routes>
        </Router>
      </NDKProvider>
    </div>
    </>
  )
}
