import { useNavigate } from 'react-router-dom'
import logo from '../assets/tech_cabinet-0.png'

export const Header = () => {
  const navigate = useNavigate()

  const go = (path: string) => {
    navigate(path)
  }


  return (
    <header id="header">
      <img id="logo" className="flex-across" src={logo} alt="logo" onClick={() => window.location.href='/'} />
      <h1 id="app-name" className="flex-across" onClick={() => go('/')}>Crash Glow</h1>
    </header>
  )
}