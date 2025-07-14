import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AppointmentDetails.css';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import ChatSection from '../../components/ChatSection';
import tokenService from '../../services/tokenService';

const AppointmentDetails = ({ appointment: propAppointment, onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { showToast } = useToast();
  
  // State for appointment data
  const [appointment, setAppointment] = useState(propAppointment);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  
  // State management
  const [activePatientTab, setActivePatientTab] = useState('overview');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [medications, setMedications] = useState([
    {
      id: 1,
      name: 'Ibuprofen 400mg',
      dosage: 'Take 1 tablet every 6-8 hours as needed for pain • 20 tablets'
    },
    {
      id: 2,
      name: 'Amoxicillin 500mg',
      dosage: 'Take 1 capsule twice daily for 7 days • 14 capsules'
    }
  ]);
  const [loading, setLoading] = useState(!propAppointment);
  const [consultationStarted, setConsultationStarted] = useState(false);
  const [consultationStartTime, setConsultationStartTime] = useState(new Date());
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getAvatarTheme = (fullName) => {
    const themes = ['theme-green', 'theme-purple', 'theme-pink', 'theme-orange', 'theme-teal', 'theme-indigo', 'theme-cyan'];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = ((hash << 5) - hash) + fullName.charCodeAt(i);
      hash = hash & hash;
    }
    return themes[Math.abs(hash) % themes.length];
  };
  
  // Mock patient data (in real app, fetch from API)
  const patientData = {
    name: appointment?.patientName || 'John Doe',
    age: 35,
    gender: 'Male',
    id: 'P12345',
    avatar: appointment?.patientName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'JD',
    basicInfo: {
      dob: 'Jan 15, 1989',
      bloodType: 'O+',
      phone: appointment?.patientPhone || '+1 (555) 123-4567',
      email: appointment?.patientEmail || 'john.doe@email.com'
    },
    symptoms: ['Headache', 'Fever', 'Fatigue', 'Nausea'],
    allergies: {
      drugs: 'Penicillin',
      food: 'Shellfish'
    },
    currentMedications: [
      { name: 'Lisinopril', dosage: '10mg daily' },
      { name: 'Metformin', dosage: '500mg twice daily' }
    ],
    history: [
      {
        date: 'March 15, 2025',
        title: 'Annual Checkup',
        description: 'Routine physical examination. Blood pressure slightly elevated. Recommended lifestyle changes.'
      },
      {
        date: 'January 22, 2025',
        title: 'Flu Symptoms',
        description: 'Treated for influenza-like symptoms. Prescribed antiviral medication.'
      },
      {
        date: 'November 8, 2024',
        title: 'Diabetes Follow-up',
        description: 'HbA1c levels improved. Continue current medication regimen.'
      }
    ],
    attachments: [
      { name: 'Lab Results - Blood Work', type: 'PDF', size: '245 KB', date: 'Today', icon: '📄' },
      { name: 'X-Ray Chest', type: 'JPEG', size: '1.2 MB', date: 'Yesterday', icon: '📸' },
      { name: 'Previous Prescription', type: 'PDF', size: '89 KB', date: 'March 15', icon: '📋' },
      { name: 'ECG Report', type: 'PDF', size: '156 KB', date: 'March 10', icon: '📊' }
    ]
  };



  // Add medication
  const handleAddMedication = () => {
    const medicationName = prompt('Enter medication name:');
    const dosage = prompt('Enter dosage instructions:');
    
    if (medicationName && dosage) {
      const newMedication = {
        id: Date.now(),
        name: medicationName,
        dosage: dosage
      };
      setMedications(prev => [...prev, newMedication]);
    }
  };

  // Remove medication
  const handleRemoveMedication = (medicationId) => {
    setMedications(prev => prev.filter(med => med.id !== medicationId));
  };

  // Save notes
  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      // Here you would save to your backend
      // await axios.put(`/api/appointments/${appointment.id}/notes`, { notes: consultationNotes });
      showToast('Notes saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save notes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (consultationNotes) {
        // Auto-save notes
        console.log('Notes auto-saved');
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [consultationNotes]);

  // Start consultation
  const handleStartConsultation = () => {
    setConsultationStarted(true);
    setConsultationStartTime(new Date());
    showToast('Consultation started!', 'success');
  };

  // Complete consultation
  const handleCompleteConsultation = () => {
    if (window.confirm('Are you sure you want to complete this consultation? This action cannot be undone.')) {
      showToast('Consultation completed successfully!', 'success');
      handleBack();
    }
  };

  // End consultation
  const handleEndConsultation = () => {
    if (window.confirm('Are you sure you want to return to appointments list? Any unsaved notes will be lost.')) {
      showToast('Returning to appointments list', 'info');
      handleBack();
    }
  };

  // Toggle chat
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Close chat
  const closeChat = () => {
    setIsChatOpen(false);
  };

  const completeBtnRef = useRef(null);
  const [chatBtnWidth, setChatBtnWidth] = useState(undefined);

  useEffect(() => {
    if (completeBtnRef.current) {
      setChatBtnWidth(completeBtnRef.current.offsetWidth);
    }
  }, [consultationStarted, isChatOpen]);

  // Fetch appointment data when accessed via URL
  useEffect(() => {
    if (id && !propAppointment) {
      fetchAppointmentData();
    }
  }, [id, propAppointment]);

  // Fetch appointment data from API
  const fetchAppointmentData = async () => {
    try {
      setAppointmentLoading(true);
      const response = await tokenService.authenticatedFetch(`/api/appointments/${id}`);
      
      if (response.ok) {
        const appointmentData = await response.json();
        setAppointment(appointmentData);
      } else {
        showToast('Failed to fetch appointment details', 'error');
        navigate('/doctor/appointments');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      showToast('Error fetching appointment details', 'error');
      navigate('/doctor/appointments');
    } finally {
      setAppointmentLoading(false);
      setLoading(false);
    }
  };

  // Handle navigation back
  const handleBack = () => {
    if (onClose) {
      // If used as modal, call onClose
      onClose();
    } else {
      // If used as standalone page, navigate back
      const returnUrl = new URLSearchParams(location.search).get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate('/doctor/appointments');
      }
    }
  };

  // Show loading state
  if (loading || appointmentLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading appointment details...</p>
      </div>
    );
  }

  // Show error state if no appointment data
  if (!appointment) {
    return (
      <div className="error-container">
        <p>No appointment data found</p>
        <button className="plain-btn" onClick={handleBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="appointment-details-scroll-wrapper">
      {/* Back button for standalone page */}
      {!onClose && (
        <div className="back-button-container" style={{
          padding: '1rem',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <button 
            className="plain-btn"
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            ← Back to Appointments
          </button>
        </div>
      )}
      <div className={`consultation-container ${isChatOpen ? 'chat-open' : ''}`}>
        {/* Left Sidebar - Patient Information */}
        <div className="patient-sidebar">
          <div className="patient-header">
            <div className={`patient-avatar ${getAvatarTheme(appointment.patientName)}`}>
                <div 
                    className="avatar-initials" 
                    style={{ display: 'flex' }}
                >
                    {patientData.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
            </div>
            <h2 className="patient-name">{patientData.name}</h2>
          </div>
          
          <div className="patient-tabs">
            <button 
              className={`patient-tab ${activePatientTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActivePatientTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`patient-tab ${activePatientTab === 'history' ? 'active' : ''}`}
              onClick={() => setActivePatientTab('history')}
            >
              History
            </button>
            <button 
              className={`patient-tab ${activePatientTab === 'files' ? 'active' : ''}`}
              onClick={() => setActivePatientTab('files')}
            >
              Files
            </button>
          </div>
          
          <div className="patient-content">
            {/* Overview Tab */}
            {activePatientTab === 'overview' && (
              <div className="tab-panel active">
                <div className="info-group">
                  <h3>Basic Information</h3>
                  <div className="info-item">
                    <span className="info-label">Age</span>
                    <span className="info-value">{patientData.age} years</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{patientData.gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Blood Type</span>
                    <span className="info-value">{patientData.basicInfo.bloodType}</span>
                  </div>
                </div>
                
                <div className="info-group">
                  <h3>Current Symptoms</h3>
                  <div className="symptoms-list">
                    {patientData.symptoms.map((symptom, index) => (
                      <span key={index} className="symptom-tag">{symptom}</span>
                    ))}
                  </div>
                </div>
                
                <div className="info-group">
                  <h3>Allergies</h3>
                  <div className="info-item">
                    <span className="info-label">Drug Allergies</span>
                    <span className="info-value">{patientData.allergies.drugs}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Food Allergies</span>
                    <span className="info-value">{patientData.allergies.food}</span>
                  </div>
                </div>
                
                <div className="info-group">
                  <h3>Current Medications</h3>
                  {patientData.currentMedications.map((medication, index) => (
                    <div key={index} className="info-item">
                      <span className="info-label">{medication.name}</span>
                      <span className="info-value">{medication.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* History Tab */}
            {activePatientTab === 'history' && (
              <div className="tab-panel active">
                <div className="info-group">
                  <h3>Recent Visits</h3>
                  {patientData.history.map((visit, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">{visit.date}</div>
                      <div className="history-title">{visit.title}</div>
                      <div className="history-description">{visit.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Files Tab */}
            {activePatientTab === 'files' && (
              <div className="tab-panel active">
                <div className="info-group">
                  <h3>Patient Attachments</h3>
                  {patientData.attachments.map((file, index) => (
                    <div key={index} className="attachment-item" onClick={() => {
                      showToast(`Opening: ${file.name}`, 'info');
                    }}>
                      <div className="attachment-info">
                        <div className="attachment-name">{file.name}</div>
                        <div className="attachment-size">{file.type} • {file.size} • {file.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="main-content">
          <div className="consultation-header">
            <div className="consultation-title">
              <h1>Consultation Form</h1>
              <p className="consultation-subtitle">
                Please fill out the consultation form below
              </p>
            </div>
            
            <div className="consultation-actions">
              {/* Show Chat button in usual place when chat is closed */}
              {consultationStarted && !isChatOpen && (
                <button 
                  className="plain-btn chat-btn"
                  onClick={toggleChat}
                  style={chatBtnWidth ? { width: chatBtnWidth } : {}}
                >
                  Chat
                </button>
              )}
              {/* Start/Complete Consultation button */}
              {!consultationStarted ? (
                <button 
                  className="plain-btn start" 
                  onClick={handleStartConsultation}
                >
                  Start<br />Consultation
                </button>
              ) : (
                <button 
                  className="plain-btn submit" 
                  onClick={handleCompleteConsultation}
                  ref={completeBtnRef}
                >
                  Complete<br />Consultation
                </button>
              )}
              <button 
                className="plain-btn back" 
                onClick={handleEndConsultation}
              >
                Back to<br />Appointments
              </button>
            </div>
          </div>
          
          <div className="notes-section">
            <div className="notes-header">
              <h3 className="notes-title">Consultation Notes</h3>
              <button 
                className="plain-btn submit-sub" 
                onClick={handleSaveNotes}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea 
              className="notes-textarea" 
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              placeholder={`Enter your consultation notes here...

Patient presents with complaints of:
- 

Physical examination findings:
- 

Assessment:
- 

Plan:
- `}
            />
            
            <div className="prescription-section">
              <div className="prescription-header">
                <h3 className="prescription-title">Prescription</h3>
                <button className="plain-btn submit-sub" onClick={handleAddMedication}>
                  Add Medication
                </button>
              </div>
              
              {medications.map((medication) => (
                <div key={medication.id} className="medication-item">
                  <div className="medication-info">
                    <h4>{medication.name}</h4>
                    <p className="medication-dosage">{medication.dosage}</p>
                  </div>
                  <button 
                    className="plain-btn remove"
                    onClick={() => handleRemoveMedication(medication.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Section - Only show when chat is open */}
        {isChatOpen && (
          <ChatSection 
            patientData={patientData}
            appointmentId={appointment.id}
            onClose={closeChat}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentDetails;