import React from 'react'
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const location = useLocation();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">KBG</Link>
      <div className="navbar-nav">
        <Link 
          to="/" 
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/about" 
          className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`}
        >
          About
        </Link>
        <Link 
          to="/team" 
          className={`navbar-link ${location.pathname === '/team' ? 'active' : ''}`}
        >
          Team
        </Link>
        <Link 
          to="/events" 
          className={`navbar-link ${location.pathname === '/events' ? 'active' : ''}`}
        >
          Events
        </Link>
        <Link 
          to="/projects" 
          className={`navbar-link ${location.pathname === '/projects' ? 'active' : ''}`}
        >
          Projects
        </Link>
      </div>
    </nav>
  )
}


export default NavBar;