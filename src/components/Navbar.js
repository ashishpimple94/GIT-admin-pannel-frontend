import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <img 
              src="https://git-india.edu.in/wp-content/uploads/2025/06/GIT-logo-new-1024x271.jpg" 
              alt="GIT Logo" 
              className="navbar-logo"
            />
          </Link>
          <div className="navbar-links">
            {user && (
              <>
                <span className="nav-user">Welcome, {user.fullName || user.username}</span>
                <button onClick={logout} className="btn-logout">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
          <div className="hamburger-menu">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

