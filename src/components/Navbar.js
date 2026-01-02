import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'First login';
    return new Date(lastLogin).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

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
            <div className="brand-text">
              <span className="brand-title">GIT Portal</span>
              <span className="brand-subtitle">Administrator Panel</span>
            </div>
          </Link>
          
          <div className="navbar-links">
            {user && (
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    <i className="fas fa-user-shield"></i>
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.fullName || user.username}</span>
                    <span className="user-role">
                      <i className="fas fa-crown"></i>
                      Administrator
                    </span>
                  </div>
                  <i className={`fas fa-chevron-${showUserMenu ? 'up' : 'down'} dropdown-arrow`}></i>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="user-details">
                        <strong>{user.fullName || user.username}</strong>
                        <small>{user.email}</small>
                        <small>Last login: {formatLastLogin(user.lastLogin)}</small>
                      </div>
                    </div>
                    
                    {user.adminFeatures && (
                      <div className="dropdown-section">
                        <div className="section-title">
                          <i className="fas fa-key"></i>
                          Admin Privileges
                        </div>
                        <div className="admin-features">
                          {user.adminFeatures.canManageUsers && (
                            <span className="feature-badge">
                              <i className="fas fa-users"></i>
                              User Management
                            </span>
                          )}
                          {user.adminFeatures.canManageGrievances && (
                            <span className="feature-badge">
                              <i className="fas fa-clipboard-list"></i>
                              Grievance Management
                            </span>
                          )}
                          {user.adminFeatures.canViewReports && (
                            <span className="feature-badge">
                              <i className="fas fa-chart-bar"></i>
                              Reports
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {user.securityInfo && (
                      <div className="dropdown-section">
                        <div className="section-title">
                          <i className="fas fa-shield-alt"></i>
                          Security Info
                        </div>
                        <div className="security-details">
                          <small>Login: {new Date(user.securityInfo.loginTime).toLocaleString('en-IN')}</small>
                          <small>IP: {user.securityInfo.clientIP}</small>
                          <small>Token expires: {new Date(user.securityInfo.tokenExpiry).toLocaleString('en-IN')}</small>
                        </div>
                      </div>
                    )}
                    
                    <div className="dropdown-actions">
                      <button onClick={handleLogout} className="btn-logout">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Secure Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

