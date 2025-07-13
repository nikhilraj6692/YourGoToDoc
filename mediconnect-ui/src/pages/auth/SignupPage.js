import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Auth.css';
import { useToast } from '../../context/ToastContext';
import tokenService from '../../services/tokenService';

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
  });
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const userType = searchParams.get('userType');
  const redirectUrl = searchParams.get('redirect');

  // Set role from URL parameter if provided
  if (userType && !formData.role) {
    formData.role = userType;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
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
      if (!formData.name || !formData.email) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
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
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the message from the API response if available
        const errorMessage = data.message || 'Signup failed. Please try again.';
        showToast(errorMessage, 'error');
        return;
      }

      // Store new tokens and user data
      tokenService.setTokens(data.accessToken, data.refreshToken);
      tokenService.setUser(data.user);

      // Show success toast
      showToast('Account created successfully!', 'success');

      // If there's a redirect URL, use it; otherwise use default navigation
      if (redirectUrl) {
        console.log('📍 Navigating to redirect URL:', redirectUrl);
        navigate(redirectUrl);
      } else if (data.user.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      showToast('Signup failed. Please try after some time.', 'error');
    }
  };

  return (
    <div className="signup-page">
      {/* Header - Simple header with logo and login link */}
      <header className="main-header">
        <div className="logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
        <div className="button-group">
          <span className="account-text">Already have an account?</span>
          <a href="/login" className="plain-btn bright">Login</a>
        </div>
      </header>

      <div className="signup-container">
        <div className="signup-content">
          {/* Left side - signup form */}
          <div className="signup-form-container">
            <div className="signup-header">
              <h1>Create Your Account</h1>
              <p className="signup-subtitle">Join thousands of patients and healthcare providers on MediConnect</p>
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

            <form className="signup-form" onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleChange}
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
                      value={formData.email}
                      onChange={handleChange}
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
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10,15}"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">I am a</label>
                    <div className="role-selection">
                      <div
                        className={`role-option ${formData.role === 'PATIENT' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                      >
                        <span className="role-icon">👨‍👩‍👧‍👦</span>
                        <span className="role-label">Patient</span>
                      </div>
                      <div
                        className={`role-option ${formData.role === 'DOCTOR' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, role: 'DOCTOR' })}
                      >
                        <span className="role-icon">👨‍⚕️</span>
                        <span className="role-label">Doctor</span>
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
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                    />
                    {/* Password strength indicator */}
                    {formData.password && (
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
                        <li className={formData.password.length >= 8 ? 'met' : ''}>
                          Be at least 8 characters long
                        </li>
                        <li className={formData.password.match(/[A-Z]/) ? 'met' : ''}>
                          Include at least one uppercase letter
                        </li>
                        <li className={formData.password.match(/[0-9]/) ? 'met' : ''}>
                          Include at least one number
                        </li>
                        <li className={formData.password.match(/[^A-Za-z0-9]/) ? 'met' : ''}>
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
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                    />
                    {formData.password && formData.confirmPassword && (
                      <div className="password-match">
                        {formData.password === formData.confirmPassword ? (
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
            <div className="terms-privacy">
              By creating an account, you agree to our
              <a href="/terms" className="terms-link" target="_blank" rel="noopener noreferrer">Terms of Service</a> and
              <a href="/privacy" className="terms-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </div>
          </div>
          {/* Right side - benefits */}
          <div className="signup-benefits">
            <div className="benefits-card">
              <h3>Why Choose MediConnect?</h3>
              <div className="benefit-item">
                <div className="benefit-icon">🏥</div>
                <div className="benefit-content">
                  <h4>Connect with Top Healthcare Providers</h4>
                  <p>Access a network of verified doctors and specialists across multiple disciplines.</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📅</div>
                <div className="benefit-content">
                  <h4>Simplified Appointment Booking</h4>
                  <p>Schedule, reschedule, or cancel appointments with just a few clicks.</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <div className="benefit-content">
                  <h4>Secure Health Records</h4>
                  <p>Your medical information is protected with enterprise-grade security.</p>
                </div>
              </div>
              <div className="testimonial">
                <div className="quote">"MediConnect transformed how I manage my family's healthcare. Finding specialists and booking appointments has never been easier."</div>
                <div className="author">— Sarah M., Patient</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;