import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    setIsLoggedIn(!!token);
    setUserRole(user?.role);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const authLinks = isLoggedIn ? [
    { to: userRole === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard', label: 'Dashboard' },
    { onClick: handleLogout, label: 'Logout' },
  ] : [
    { to: '/login', label: 'Login' },
    { to: '/signup', label: 'Sign Up' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon" style={{display:'flex',alignItems:'center'}}>
            {/* Modern stethoscope+link SVG icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" stroke="#20b486" strokeWidth="2" fill="#fff"/>
              <path d="M9 10v4a5 5 0 0 0 10 0v-4" stroke="#20b486" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="8.5" r="1.5" fill="#20b486"/>
              <circle cx="19" cy="8.5" r="1.5" fill="#20b486"/>
              <path d="M14 19v2.5" stroke="#ff7a1a" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="14" cy="23" r="1.5" fill="#ff7a1a"/>
            </svg>
          </span>
          <span className="brand-text">MediConnect</span>
        </Link>

        <button
          className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={location.pathname === link.to ? 'active' : ''}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-auth">
            {authLinks.map((link, index) => (
              link.to ? (
                <Link
                  key={index}
                  to={link.to}
                  className={`auth-link ${index === 0 ? 'primary' : 'secondary'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={() => {
                    link.onClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`auth-link ${index === 0 ? 'primary' : 'secondary'}`}
                >
                  {link.label}
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 