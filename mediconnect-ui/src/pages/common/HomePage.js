import React from 'react';
import { Link } from 'react-router-dom';
import HomeHeader from '../../components/HomeHeader';
import './HomePage.css';

function HomePage() {
  return (
    <div className="doctor-desk-home">
      {/* Header/Navigation */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Book Your Doctor's <br/><span className="accent-text">Appointment</span> Effortlessly
            </h1>
            <p className="hero-subtitle">
              Find the best doctors near you, schedule appointments instantly, and manage your health easily.
            </p>
            <Link to="/patient/find-doctor" className="plain-btn find-doctor-hero-btn">Find Doctor</Link>
          </div>
          
          <div className="hero-visual-horizontal">
            <div className="doctor-image-container">
              <img src="/images/doctor-hero.jpg" alt="Doctor" className="doctor-hero-image" />
            </div>
            
          </div>
        </div>

        <div className="hero-cards">
          <div className="stats-card">
            <div className="stats-number">500+</div>
            <div className="stats-text">specialized doctors</div>
          </div>
        </div>
        
        <div className="top-right-card">
          <div className="top-right-content">
            <div className="top-right-number">24/7</div>
            <div className="top-right-text">Support Available</div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <div className="steps-header">
          <h2>Simple Steps to Book Your Doctor</h2>
          <p className="steps-subtitle">Booking an appointment has never been easier. Just follow these three quick steps!</p>
        </div>
        
        <div className="steps-container">
          <div className="step-card">
            <div className="step-icon">
              <span className="icon">🔍</span>
            </div>
            <h3 className="step-title">Search for Your Doctor</h3>
            <p className="step-description">
              Find doctors by filtering based on specialty, location, or patient ratings. Get recommendations or browse through our extensive database of trusted professionals.
            </p>
          </div>
          
          <div className="step-card">
            <div className="step-icon">
              <span className="icon">⏰</span>
            </div>
            <h3 className="step-title">Choose a Convenient Time</h3>
            <p className="step-description">
              Check available slots and select a time that works for your schedule. You can see real availability in real-time.
            </p>
          </div>
          
          <div className="step-card">
            <div className="step-icon">
              <span className="icon">📅</span>
            </div>
            <h3 className="step-title">Book an Appointment</h3>
            <p className="step-description">
              Confirm your booking with one click. Receive an instant confirmation and a reminder before your appointment to ensure you're prepared.
            </p>
          </div>
        </div>
        
        <div className="start-booking-container">
          <Link to="/patient/find-doctor" className="plain-btn sec-submit-btn">Start Booking</Link>
        </div>
      </section>

      {/* Find Doctor CTA Section */}
      <section className="find-doctor-cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Find Your Perfect Doctor</h2>
          <p className="cta-subtitle">Search through our extensive network of qualified healthcare professionals. Filter by specialty, location, ratings, and availability to find the right doctor for your needs.</p>
          <div className="cta-features">
            <div className="feature">
              <span className="feature-icon">🔍</span>
              <span>Search by location, specialty, or ratings</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⭐</span>
              <span>Verified and rated doctors</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📅</span>
              <span>Real-time availability</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💳</span>
              <span>Secure online booking</span>
            </div>
          </div>
          <Link to="/patient/find-doctor" className="plain-btn find-doctor-btn">Find Doctor</Link>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="testimonials-title">Our Patients Feedback</h2>
        <p className="testimonials-subtitle">You'll find something to spark your curiosity and enhance your health journey.</p>
        
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">The booking process was so easy and the doctor was very professional. Highly recommend!</p>
            <p className="testimonial-author">- Priya S.</p>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">Thanks to the course of treatment, I feel much better. The reminders were super helpful!</p>
            <p className="testimonial-author">- Rahul T.</p>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-text">This has been a long and busy year, but DoctorDesk made it easy to manage my appointments.</p>
            <p className="testimonial-author">- Anjali M.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;