import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="doctor-desk-home">
      {/* Header/Navigation */}
      <header className="main-header">
        <div className="logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
        <div className="auth-buttons">
          <Link to="/signup" className="sign-up-btn">Sign Up</Link>
          <Link to="/login" className="login-btn">Login</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Book Your Doctor's <span className="accent-text">Appointment</span> Effortlessly
          </h1>
          <p className="hero-subtitle">
            Find the best doctors near you, schedule appointments instantly, and manage your health easily.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="find-doctor-btn">Find a Doctor</Link>
            <Link to="/login" className="book-appointment-btn">Book an Appointment</Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="doctor-image-container">
            <img src="/images/doctor-hero.png" alt="Doctor" className="doctor-hero-image" />
          </div>
          
          <div className="stats-card">
            <div className="stats-number">500+</div>
            <div className="stats-text">specialized doctors</div>
            <div className="doctor-avatars">
              {/* Small circular doctor avatars */}
            </div>
          </div>
          
          <div className="chart-card">
            <img src="/images/chart.png" alt="Medical chart" className="chart-image" />
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
              <img src="/images/search-icon.png" alt="Search" />
            </div>
            <h3 className="step-title">Search for Your Doctor</h3>
            <p className="step-description">
              Find doctors by filtering based on specialty, location, or patient ratings. Get recommendations or browse through our extensive database of trusted professionals.
            </p>
          </div>
          
          <div className="step-card">
            <div className="step-icon">
              <img src="/images/clock-icon.png" alt="Clock" />
            </div>
            <h3 className="step-title">Choose a Convenient Time</h3>
            <p className="step-description">
              Check available slots and select a time that works for your schedule. You can see real availability in real-time.
            </p>
          </div>
          
          <div className="step-card">
            <div className="step-icon">
              <img src="/images/calendar-icon.png" alt="Calendar" />
            </div>
            <h3 className="step-title">Book an Appointment</h3>
            <p className="step-description">
              Confirm your booking with one click. Receive an instant confirmation and a reminder before your appointment to ensure you're prepared.
            </p>
          </div>
        </div>
        
        <div className="start-booking-container">
          <Link to="/signup" className="start-booking-btn">Start Booking</Link>
        </div>
      </section>

      {/* Doctor Listing Section */}
      <section className="doctors-section">
        <div className="doctors-header">
          <div className="doctors-title-container">
            <h2 className="doctors-title">Meet Our Top-Rated Doctors</h2>
            <p className="doctors-subtitle">Highly recommended professionals, trusted by patients. Find your perfect match and book an appointment today.</p>
          </div>
        </div>
        
        <div className="doctors-grid">
          {/* First Row */}
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="hospital-info">
                <img src="/images/hospital-icon.png" alt="Hospital" className="hospital-icon" />
                <span className="hospital-name">University College Hospital, UK</span>
              </div>
              <div className="doctor-rating">
                <span className="star-icon">★</span>
                <span className="rating-value">4.9 (115)</span>
              </div>
            </div>
            <img src="/images/doctor1.jpg" alt="Doctor Sarah James" className="doctor-image" />
            <div className="doctor-info">
              <span className="doctor-specialty">Dermatologist</span>
              <h3 className="doctor-name">Dr. Sarah James</h3>
              <Link to="/signup" className="book-now-btn outline">Book Now</Link>
            </div>
          </div>
          
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="hospital-info">
                <img src="/images/hospital-icon.png" alt="Hospital" className="hospital-icon" />
                <span className="hospital-name">University College Hospital, UK</span>
              </div>
              <div className="doctor-rating">
                <span className="star-icon">★</span>
                <span className="rating-value">5.0 (98)</span>
              </div>
            </div>
            <img src="/images/doctor2.jpg" alt="Doctor Alex Martin" className="doctor-image" />
            <div className="doctor-info">
              <span className="doctor-specialty">Cardiologist</span>
              <h3 className="doctor-name">Dr. Alex Martin</h3>
              <Link to="/signup" className="book-now-btn filled">Book Now</Link>
            </div>
          </div>
          
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="hospital-info">
                <img src="/images/hospital-icon.png" alt="Hospital" className="hospital-icon" />
                <span className="hospital-name">Mountfield UK Hospital, UK</span>
              </div>
              <div className="doctor-rating">
                <span className="star-icon">★</span>
                <span className="rating-value">4.8 (101)</span>
              </div>
            </div>
            <img src="/images/doctor3.jpg" alt="Tina Albrecht" className="doctor-image" />
            <div className="doctor-info">
              <span className="doctor-specialty">Physical Therapy</span>
              <h3 className="doctor-name">Tina Albrecht</h3>
              <Link to="/signup" className="book-now-btn outline">Book Now</Link>
            </div>
          </div>
          
          {/* Second Row */}
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="hospital-info">
                <img src="/images/hospital-icon.png" alt="Hospital" className="hospital-icon" />
                <span className="hospital-name">Columbia Medical Center, UK</span>
              </div>
              <div className="doctor-rating">
                <span className="star-icon">★</span>
                <span className="rating-value">4.7 (89)</span>
              </div>
            </div>
            <img src="/images/doctor4.jpg" alt="Ryan Gregor" className="doctor-image" />
            <div className="doctor-info">
              <span className="doctor-specialty">Dermatologist</span>
              <h3 className="doctor-name">Ryan Gregor</h3>
              <Link to="/signup" className="book-now-btn outline">Book Now</Link>
            </div>
          </div>
          
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="hospital-info">
                <img src="/images/hospital-icon.png" alt="Hospital" className="hospital-icon" />
                <span className="hospital-name">Royal London Hospital, UK</span>
              </div>
              <div className="doctor-rating">
                <span className="star-icon">★</span>
                <span className="rating-value">4.9 (148)</span>
              </div>
            </div>
            <img src="/images/doctor5.jpg" alt="Laura Bledsoe" className="doctor-image" />
            <div className="doctor-info">
              <span className="doctor-specialty">Pediatrics</span>
              <h3 className="doctor-name">Laura Bledsoe</h3>
              <Link to="/signup" className="book-now-btn outline">Book Now</Link>
            </div>
          </div>
          
          <div className="doctor-card">
            <div className="doctor-card-header">
              <div className="hospital-info">
                <img src="/images/hospital-icon.png" alt="Hospital" className="hospital-icon" />
                <span className="hospital-name">Northeastern Medical Center, UK</span>
              </div>
              <div className="doctor-rating">
                <span className="star-icon">★</span>
                <span className="rating-value">4.7 (204)</span>
              </div>
            </div>
            <img src="/images/doctor6.jpg" alt="Michael Cunningham" className="doctor-image" />
            <div className="doctor-info">
              <span className="doctor-specialty">Gastroenterology</span>
              <h3 className="doctor-name">Michael Cunningham</h3>
              <Link to="/signup" className="book-now-btn outline">Book Now</Link>
            </div>
          </div>
        </div>
        
        <div className="see-all-container">
          <Link to="/signup" className="see-all-btn">See All</Link>
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