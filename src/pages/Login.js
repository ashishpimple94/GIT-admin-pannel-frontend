import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log('🔐 Admin login attempt:', formData.username);
    const result = await login(formData.username, formData.password);
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Login successful! Redirecting...');
      console.log('✅ Admin login successful, redirecting...');
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      setError(result.message);
      setLoginAttempts(prev => prev + 1);
      
      // Show remaining attempts if available
      if (result.remaining !== undefined) {
        setError(`${result.message} (${result.remaining} attempts remaining)`);
      }
      
      console.error('❌ Admin login failed:', result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">
            <i className="fas fa-shield-alt"></i>
            Admin Portal
          </h2>
          <p className="auth-subtitle">Secure administrator access</p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i> 
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle"></i> 
            <span>{success}</span>
          </div>
        )}
        
        {loginAttempts >= 3 && (
          <div className="alert alert-warning">
            <i className="fas fa-info-circle"></i> 
            <span>Multiple failed attempts detected. Please verify your credentials.</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-user-shield"></i> 
              <span>Administrator Username</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-key"></i> 
              <span>Administrator Password</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                <span>Secure Login</span>
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <div className="security-info">
            <i className="fas fa-lock"></i>
            <span>Enhanced security enabled</span>
          </div>
          <div className="help-text">
            <small>
              <i className="fas fa-question-circle"></i>
              Contact system administrator if you need assistance
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
