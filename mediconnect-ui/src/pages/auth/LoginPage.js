import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Clear old token and user data before making new login request
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-split-page">
      {/* Left Side: Illustration & Value Prop */}
      <div className="auth-split-left">
        <div className="auth-branding">
          <span className="logo-icon large">⚕️</span>
          <span className="logo-text large">MediConnect</span>
        </div>
        <img src="/images/login-illustration.svg" alt="Healthcare login" className="auth-illustration" />
        <div className="auth-benefits">
          <h2>Why MediConnect?</h2>
          <ul>
            <li>✔️ Book appointments instantly</li>
            <li>✔️ Access top-rated doctors</li>
            <li>✔️ Secure, private, and easy to use</li>
          </ul>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="auth-split-right">
        <div className="auth-form-container">
          <div className="auth-welcome">
            <h1>Welcome Back</h1>
            <div className="auth-tagline">Your secure gateway to quality healthcare</div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="auth-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <div className="forgot-password">
                <a href="/forgot-password" className="forgot-link">Forgot password?</a>
              </div>
            </div>

            <div className="button-container">
              <button type="submit" className="auth-button">
                Sign In
              </button>
            </div>
          </form>

          <div className="signup-box">
            Don't have an account? <a href="/signup" className="auth-link signup-link">Sign Up</a>
          </div>

          <div className="login-tips-box">
            <span className="lock-icon" role="img" aria-label="lock">🔒</span>
            <div>
              <strong>Secure Login Tips:</strong>
              <ul style={{margin: '0.5rem 0 0 1.1rem', padding: 0}}>
                <li>Never share your password with anyone.</li>
                <li>Always log out after using a public device.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;