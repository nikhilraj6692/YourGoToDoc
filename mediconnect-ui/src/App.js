import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';
import HomePage from './pages/common/HomePage';
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import DoctorDashboard from './pages/doctor-dashboard/DoctorDashboard';
import DashboardRedirect from './pages/common/DashboardRedirect';
import AdminDashboard from './pages/admin-dashboard/AdminDashboard';
import PatientDashboard from './pages/patient-dashboard/PatientDashboard';
import FindDoctor from './pages/patient-dashboard/FindDoctor';
import PatientAppointments from './pages/patient-dashboard/Appointments';
import PatientAppointmentDetails from './pages/patient-dashboard/PatientAppointmentDetails';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './contexts/ChatContext';

// Import doctor dashboard components
import Schedule from './pages/doctor-dashboard/Schedule';
import Appointments from './pages/doctor-dashboard/Appointments';
import Patients from './pages/doctor-dashboard/Patients';
import Messages from './pages/doctor-dashboard/Messages';

// Placeholder About and Contact pages if not present
function AboutPage() {
  return <div style={{padding: 32}}><h2>About MediConnect</h2><p>This is the about page. (Design coming soon!)</p></div>;
}
function ContactPage() {
  return <div style={{padding: 32}}><h2>Contact Us</h2><p>This is the contact page. (Design coming soon!)</p></div>;
}

function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <ChatProvider>
          <Router>
            <div className="app-container">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor/schedule" element={<Schedule />} />
                <Route path="/doctor/appointments" element={<Appointments />} />
                <Route path="/doctor/patients" element={<Patients />} />
                <Route path="/doctor/messages" element={<Messages />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/patient/find-doctor" element={<FindDoctor />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/appointment-details/:id" element={<PatientAppointmentDetails />} />
                <Route path="/dashboard" element={<DashboardRedirect />} />
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </UserProvider>
    </ToastProvider>
  );
}

export default App; 