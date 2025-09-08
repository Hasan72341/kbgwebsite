import React from 'react'
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/team">Team</Link></li>
        <li><Link to="/events">Events</Link></li>
        <li><Link to="/projects">Projects</Link></li>
      </ul>
    </nav>
  )
}


export default NavBar;