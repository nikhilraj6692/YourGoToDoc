import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import '../styles/Common.css';
import './LoginModal.css';
import tokenService from '../services/tokenService';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';

const LoginModal = ({ open, onClose, userType = 'PATIENT', redirectUrl = '/patient/find-doctor', onLoginSuccess }) => {
  const navigate = useNavigate();
  const { refreshProfile } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: '',
  });
  
  const [signupFormData, setSignupFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: userType,
  });
  
  const { showToast } = useToast();

  const handleLoginChange = (e) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupFormData({
      ...signupFormData,
      [name]: value,
    });

    // Calculate password strength for password field
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    if (passwordStrength === 4) return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return '#e2e8f0';
    if (passwordStrength === 1) return '#fc8181';
    if (passwordStrength === 2) return '#f6ad55';
    if (passwordStrength === 3) return '#68d391';
    if (passwordStrength === 4) return '#38a169';
  };

  const nextStep = () => {
    if (step === 1) {
      if (!signupFormData.name || !signupFormData.email) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleLoginSubmit = async (e) => {
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
        body: JSON.stringify({
          ...loginFormData,
          context: 'booking' // Add context for booking-specific login
        }),
      });

      const data = await response.json();
      console.log('📥 Login response:', { status: response.status, data });

      if (!response.ok) {
        // Handle structured error response
        if (data.errorCode) {
          console.log('❌ Login failed with error code:', data.errorCode, data.message);
          showToast(data.message, 'error');
        } else {
          // Fallback for non-structured errors
          const errorMessage = data.message || data || 'Login failed. Please try again.';
          console.log('❌ Login failed:', errorMessage);
          showToast(errorMessage, 'error');
        }
        return;
      }

      console.log('✅ Login successful, storing tokens and user data');
      // Store new tokens and user data
      tokenService.setTokens(data.accessToken, data.refreshToken);
      tokenService.setUser(data.user);

      // Refresh UserContext to update the user state
      await refreshProfile();

      // Show success toast
      showToast('Login successful!', 'success');

      // Close modal
      onClose();
      
      // If callback is provided, call it; otherwise navigate
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      showToast('Login failed. Please try after some time.', 'error');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (signupFormData.password !== signupFormData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupFormData.name,
          email: signupFormData.email,
          phoneNumber: signupFormData.phone,
          password: signupFormData.password,
          role: signupFormData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle structured error response
        if (data.errorCode) {
          console.log('❌ Signup failed with error code:', data.errorCode, data.message);
          showToast(data.message, 'error');
        } else {
          // Fallback for non-structured errors
          const errorMessage = data.message || 'Signup failed. Please try again.';
          showToast(errorMessage, 'error');
        }
        return;
      }

      // Show success toast
      showToast('Account created successfully! Please login to continue.', 'success');

      // Switch back to login mode and reset form
      setIsSignup(false);
      setStep(1);
      setSignupFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: userType,
      });
      setPasswordStrength(0);
      
      // Pre-fill the login form with the email from signup
      setLoginFormData({
        email: signupFormData.email,
        password: '',
      });
    } catch (err) {
      showToast('Signup failed. Please try after some time.', 'error');
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isSignup ? 'Create Account' : 'Access Booking'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="auth-form-container">
            {!isSignup ? (
              // Login Form
              <>
                <div className="auth-welcome">
                  <div className="auth-tagline">Your secure gateway to quality healthcare</div>
                </div>

                <form className="auth-form" onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={loginFormData.email}
                      onChange={handleLoginChange}
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
                      value={loginFormData.password}
                      onChange={handleLoginChange}
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
                  Don't have an account? 
                  <a 
                    className="auth-link signup-link" 
                    onClick={() => {
                      setIsSignup(true);
                      setStep(1);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    Join Now
                  </a>
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
              </>
            ) : (
              // Signup Form
              <>
                <div className="auth-welcome">
                  <div className="auth-tagline">Join thousands of patients on MediConnect</div>
                </div>
                
                {/* Progress Indicator */}
                <div className="signup-progress">
                  <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Profile</div>
                  </div>
                  <div className="progress-line"></div>
                  <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Security</div>
                  </div>
                </div>

                <form className="signup-form" onSubmit={handleSignupSubmit}>
                  {step === 1 && (
                    <>
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="form-input"
                          value={signupFormData.name}
                          onChange={handleSignupChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input"
                          value={signupFormData.email}
                          onChange={handleSignupChange}
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          value={signupFormData.phone}
                          onChange={handleSignupChange}
                          placeholder="Enter your phone number"
                          pattern="[0-9]{10,15}"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="role">I am a</label>
                        <div className="role-selection">
                          <div
                            className={`role-option ${signupFormData.role === 'PATIENT' ? 'active' : ''}`}
                            onClick={() => setSignupFormData({ ...signupFormData, role: 'PATIENT' })}
                          >
                            <span className="role-icon">👨‍👩‍👧‍👦</span>
                            <span className="role-label">Patient</span>
                          </div>
                          <div
                            className="role-option disabled"
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            title="Only patients can book appointments"
                          >
                            <span className="role-icon">👨‍⚕️</span>
                            <span className="role-label">Doctor</span>
                            <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                              (Not available for booking)
                            </span>
                          </div>
                        </div>
                      </div>
                      <button type="button" className="plain-btn submit" onClick={nextStep}>
                        Continue
                      </button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          className="form-input"
                          value={signupFormData.password}
                          onChange={handleSignupChange}
                          placeholder="Create a password"
                          required
                        />
                        {/* Password strength indicator */}
                        {signupFormData.password && (
                          <div className="password-strength">
                            <div className="strength-bars">
                              {[...Array(4)].map((_, index) => (
                                <div
                                  key={index}
                                  className="strength-bar"
                                  style={{
                                    backgroundColor: index < passwordStrength
                                      ? getPasswordStrengthColor()
                                      : '#e2e8f0',
                                  }}
                                ></div>
                              ))}
                            </div>
                            <span className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                              {getPasswordStrengthLabel()}
                            </span>
                          </div>
                        )}
                        {/* Password requirements */}
                        <div className="password-requirements">
                          <p>Your password should:</p>
                          <ul>
                            <li className={signupFormData.password.length >= 8 ? 'met' : ''}>
                              Be at least 8 characters long
                            </li>
                            <li className={signupFormData.password.match(/[A-Z]/) ? 'met' : ''}>
                              Include at least one uppercase letter
                            </li>
                            <li className={signupFormData.password.match(/[0-9]/) ? 'met' : ''}>
                              Include at least one number
                            </li>
                            <li className={signupFormData.password.match(/[^A-Za-z0-9]/) ? 'met' : ''}>
                              Include at least one special character
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          className="form-input"
                          value={signupFormData.confirmPassword}
                          onChange={handleSignupChange}
                          placeholder="Confirm your password"
                          required
                        />
                        {signupFormData.password && signupFormData.confirmPassword && (
                          <div className="password-match">
                            {signupFormData.password === signupFormData.confirmPassword ? (
                              <span className="match-success">✓ Passwords match</span>
                            ) : (
                              <span className="match-error">✗ Passwords do not match</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="button-group">
                        <button type="button" className="back-button" onClick={prevStep}>
                          Back
                        </button>
                        <button type="submit" className="plain-btn submit">
                          Create Account
                        </button>
                      </div>
                    </>
                  )}
                </form>
                
                <div className="signup-box">
                  Already have an account? 
                  <a 
                    className="auth-link signup-link" 
                    onClick={() => {
                      setIsSignup(false);
                      setStep(1);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    Login
                  </a>
                </div>
                
                <div className="terms-privacy">
                  By creating an account, you agree to our
                  <a href="/terms" className="terms-link" target="_blank" rel="noopener noreferrer">Terms of Service</a> and
                  <a href="/privacy" className="terms-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 