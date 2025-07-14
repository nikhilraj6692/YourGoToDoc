import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Import doctor dashboard components
import Schedule from './pages/doctor-dashboard/Schedule';
import Appointments from './pages/doctor-dashboard/Appointments';
import AppointmentDetails from './pages/doctor-dashboard/AppointmentDetails';
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
                {/* Public Routes - Redirect authenticated users to their dashboard */}
                <Route path="/" element={
                  <PublicRoute>
                    <HomePage />
                  </PublicRoute>
                } />
                <Route path="/about" element={
                  <PublicRoute>
                    <AboutPage />
                  </PublicRoute>
                } />
                <Route path="/contact" element={
                  <PublicRoute>
                    <ContactPage />
                  </PublicRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                } />
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                
                {/* Doctor Routes - Require DOCTOR role */}
                <Route path="/doctor/dashboard" element={
                  <ProtectedRoute requiredRole="DOCTOR">
                    <DoctorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/doctor/schedule" element={
                  <ProtectedRoute requiredRole="DOCTOR">
                    <Schedule />
                  </ProtectedRoute>
                } />
                <Route path="/doctor/appointments" element={
                  <ProtectedRoute requiredRole="DOCTOR">
                    <Appointments />
                  </ProtectedRoute>
                } />
                <Route path="/doctor/appointment-details/:id" element={
                  <ProtectedRoute requiredRole="DOCTOR">
                    <AppointmentDetails />
                  </ProtectedRoute>
                } />
                <Route path="/doctor/patients" element={
                  <ProtectedRoute requiredRole="DOCTOR">
                    <Patients />
                  </ProtectedRoute>
                } />
                <Route path="/doctor/messages" element={
                  <ProtectedRoute requiredRole="DOCTOR">
                    <Messages />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes - Require ADMIN role */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Patient Routes - Require PATIENT role */}
                <Route path="/patient/dashboard" element={
                  <ProtectedRoute requiredRole="PATIENT">
                    <PatientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/patient/find-doctor" element={
                  <ProtectedRoute allowUnauthenticated={true}>
                    <FindDoctor />
                  </ProtectedRoute>
                } />
                <Route path="/patient/appointments" element={
                  <ProtectedRoute requiredRole="PATIENT">
                    <PatientAppointments />
                  </ProtectedRoute>
                } />
                <Route path="/patient/appointment-details/:id" element={
                  <ProtectedRoute requiredRole="PATIENT">
                    <PatientAppointmentDetails />
                  </ProtectedRoute>
                } />
                
                {/* Generic Dashboard Redirect - Requires authentication but no specific role */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </ChatProvider>
      </UserProvider>
    </ToastProvider>
  );
}

export default App; 