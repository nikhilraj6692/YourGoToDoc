import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Auth.css';
import tokenService from '../../services/tokenService';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { showToast } = useToast();
  
  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const userType = searchParams.get('userType');
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 Login attempt started');

    // Clear old tokens and user data before making new login request
    tokenService.clearTokens();

    try {
      console.log('📡 Making login request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📥 Login response:', { status: response.status, data });

      if (!response.ok) {
        // Use the message from the API response if available
        const errorMessage = data.message || 'Login failed. Please try again.';
        console.log('❌ Login failed:', errorMessage);
        showToast(errorMessage, 'error');
        return;
      }

      console.log('✅ Login successful, storing tokens and user data');
      console.log('👤 User data from login response:', data.user);
      // Store new tokens and user data
      tokenService.setTokens(data.accessToken, data.refreshToken);
      tokenService.setUser(data.user);

      // Show success toast
      showToast('Login successful!', 'success');

      // User data is now stored in localStorage, notify UserContext to update
      console.log('✅ User data stored in localStorage, notifying UserContext');
      window.dispatchEvent(new Event('userDataUpdated'));

      // Give UserContext a moment to update
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('👤 User role:', data.user.role);
      console.log('🔄 Redirect URL:', redirectUrl);
      console.log('🔍 Expected role for doctor dashboard: DOCTOR');
      console.log('🔍 Role match:', data.user.role === 'DOCTOR');

      // If there's a redirect URL, use it; otherwise use default navigation
      if (redirectUrl) {
        console.log('📍 Navigating to redirect URL:', redirectUrl);
        console.log('🔍 Decoded redirect URL:', decodeURIComponent(redirectUrl));
        navigate(decodeURIComponent(redirectUrl));
      } else if (data.user.role === 'DOCTOR') {
        console.log('👨‍⚕️ Navigating to doctor dashboard');
        navigate('/doctor/dashboard');
      } else if (data.user.role === 'ADMIN') {
        console.log('👨‍💼 Navigating to admin dashboard');
        navigate('/admin/dashboard');
      } else if (data.user.role === 'PATIENT') {
        console.log('👤 Navigating to patient dashboard');
        navigate('/patient/dashboard');
      } else {
        console.log('❓ Unknown role, navigating to generic dashboard');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      showToast('Login failed. Please try after some time.', 'error');
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
        <div className="auth-illustration">
        </div>
        <div className="auth-benefits">
          <h2>Why MediConnect?</h2>
          <ul>
          <li>🏆 Access top-rated doctors</li>
          <li>🔍 Search by location, specialty, or ratings</li>   
          <li>⚡ Book appointments instantly</li>
          <li>🔐 Secure, private, and easy to use</li>
          <li>📅 24/7 availability</li>
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

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
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

              <button type="submit" className="plain-btn submit">
                Sign In
              </button>
          </form>

          <div className="signup-box">
            Don't have an account? <a href={`/signup${userType ? `?userType=${userType}` : ''}${redirectUrl ? `&redirect=${redirectUrl}` : ''}`} className="auth-link signup-link">Join Now</a>
          </div>

          <div className="login-tips-box">
            <span className="lock-icon" role="img" aria-label="lock"></span>
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