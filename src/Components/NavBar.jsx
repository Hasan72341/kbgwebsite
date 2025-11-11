import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';
import { API_ENDPOINTS, fetchData } from '../config/api';

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState(null);

  // Fetch navbar data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const navbarData = await fetchData(API_ENDPOINTS.navbar);
        setData(navbarData);
      } catch (error) {
        console.error('Failed to load navbar data:', error);
        // Fallback data in case of error
        setData({
          brand: 'KBG',
          tagline: 'Kamand Bioengineering Group',
          links: []
        });
      }
    };
    loadData();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!data) {
    return null; // or return a loading skeleton
  }

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        {/* === Left: Logo === */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo-link" onClick={closeMenu}>
            <img src="/vite.svg" alt="Logo" className="navbar-logo" />
          </Link>
        </div>

        {/* === Center: Brand and Tagline === */}
        <div className="navbar-center">
          <Link to="/" className="navbar-brand-link" onClick={closeMenu}>
            <h2 className="navbar-tagline">{data.tagline}</h2>
          </Link>
        </div>

        {/* === Mobile Menu Toggle === */}
        <button 
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* === Right: Navigation Links === */}
        <div className={`navbar-right ${isMenuOpen ? 'active' : ''}`}>
          {data.links.map((link, i) => (
            <Link
              key={i}
              to={link.to}
              className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* === Mobile Menu Overlay === */}
      <div 
        className={`navbar-overlay ${isMenuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      ></div>
    </>
  );
};

export default NavBar;
