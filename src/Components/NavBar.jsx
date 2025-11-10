import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';
import data from '../data/navbar.json';

const NavBar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      {/* === Left: Logo Only === */}
      <div className="navbar-left">
        <Link to="/" className="navbar-logo-link">
          <img src="/vite.svg" alt="Logo" className="navbar-logo" />
        </Link>
      </div>
      {/* === Center: Brand and Tagline === */}
      <div className="navbar-center">
        <Link to="/" className="navbar-brand-link">
          <h2 className="navbar-tagline">{data.tagline}</h2>
        </Link>
      </div>
      {/* === Right: Navigation Links === */}
      <div className="navbar-right">
        {data.links.map((link, i) => (
          <Link
            key={i}
            to={link.to}
            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
