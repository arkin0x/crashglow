import { useNavigate } from 'react-router-dom'

export const Footer = () => {

  const navigate = useNavigate()

  const go = (path: string) => {
    navigate(path)
  }

  return (
    <footer id="footer">
      <button type="button" className="nav-button" onClick={() => go('/')}>Games</button>
      <button type="button" className="nav-button" onClick={() => go('/load')}>Load</button>
      <button type="button" className="nav-button" onClick={() => go('/collection')}>Collection</button>
    </footer>
  )
}