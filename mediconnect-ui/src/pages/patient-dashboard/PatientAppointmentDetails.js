import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PatientAppointmentDetails.css';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import ChatSection from '../../components/ChatSection';
import CommonHeader from '../../components/CommonHeader';
import tokenService from '../../services/tokenService';
import { handleLogout } from '../../utils/logout';

const PatientAppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { showToast } = useToast();
  
  // Debug: Log the appointment ID and user data
  console.log('Appointment ID from URL:', id);
  console.log('User data in PatientAppointmentDetails:', user);
  console.log('User ID:', user?.id);
  console.log('User name:', user?.name);
  
  // State management
  const [activeDoctorTab, setActiveDoctorTab] = useState('info');
  const [basicInfoComplete, setBasicInfoComplete] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [appointmentData, setAppointmentData] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);

  // Fetch appointment data based on ID
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchAppointmentData = async () => {
      if (!id) {
        console.error('No appointment ID provided');
        setAppointmentLoading(false);
        return;
      }

      try {
        setAppointmentLoading(true);
        
        // Fetch appointment data from API
        const appointmentResponse = await tokenService.authenticatedFetch(`/api/appointments/${id}`);
        
        if (!appointmentResponse.ok) {
          throw new Error('Failed to fetch appointment data');
        }
        
        const appointmentData = await appointmentResponse.json();
        console.log('Fetched appointment data:', appointmentData);
        
        // Fetch appointment details from the new API
        const detailsResponse = await tokenService.authenticatedFetch(`/api/appointment-details/${id}`);
        
        let appointmentDetails = null;
        if (detailsResponse.ok) {
          appointmentDetails = await detailsResponse.json();
          console.log('Fetched appointment details:', appointmentDetails);
        } else if (detailsResponse.status !== 404) {
          console.error('Failed to fetch appointment details:', detailsResponse.status);
        }
        
        // Combine appointment data with details
        const combinedAppointment = {
          ...appointmentData,
          details: appointmentDetails,
          // Map appointment data to expected format
          doctorName: appointmentData.doctorName || 'Dr. Sarah Wilson',
          date: appointmentData.startTime ? new Date(appointmentData.startTime).toLocaleDateString() : '2024-06-20',
          time: appointmentData.startTime ? new Date(appointmentData.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '11:00 AM',
          status: appointmentData.status?.toLowerCase() || 'confirmed',
          type: appointmentData.type?.toLowerCase() || 'consultation',
          fee: 600, // This would come from doctor profile
          location: 'Video Consultation',
          doctor: {
            name: appointmentData.doctorName || 'Dr. Sarah Wilson',
            specialty: 'Internal Medicine',
            image: '/api/placeholder/48/48',
            rating: 4.8,
            experience: '12 years'
          },
          appointmentId: id,
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          isPaid: true,
          hasAppointment: true
        };
        
        setAppointmentData(combinedAppointment);
        
        // If appointment details exist, populate the form
        if (appointmentDetails) {
          setPatientForm(prev => ({
            ...prev,
            // Populate symptoms from appointment details
            currentSymptoms: appointmentDetails.symptoms || [],
            // Populate other fields from appointment details
            allergies: appointmentDetails.allergies?.join(', ') || '',
            // Populate contact info that may have changed
            phoneNumber: appointmentDetails.patientPhone || prev.phoneNumber,
            emergencyPhone: appointmentDetails.patientEmergencyContact || prev.emergencyPhone,
            // Populate medical information fields
            chiefComplaint: appointmentDetails.chiefComplaint || '',
            symptomDuration: appointmentDetails.symptomDuration || '',
            painLevel: appointmentDetails.painLevel || 0,
            currentMedications: appointmentDetails.currentMedications || '',
            medicalHistory: appointmentDetails.medicalHistory || '',
            additionalNotes: appointmentDetails.additionalNotes || ''
          }));
        }
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
          return;
        }
        console.error('Failed to fetch appointment data:', error);
        showToast('Failed to load appointment details', 'error');
      } finally {
        setAppointmentLoading(false);
      }
    };

    fetchAppointmentData();

    // Cleanup function to abort requests when component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [id, showToast]);

  // Use appointmentData instead of hardcoded appointment
  const appointment = appointmentData;

  // Debug: Monitor user data changes
  useEffect(() => {
    console.log('User data changed in PatientAppointmentDetails:', user);
  }, [user]);

  // Navigation functions
  const handleMenuClick = (menuId) => {
    switch (menuId) {
      case 'dashboard':
        navigate('/patient/dashboard');
        break;
      case 'appointments':
        navigate('/patient/appointments');
        break;
      case 'records':
        // TODO: Implement medical records page
        break;
      case 'prescriptions':
        // TODO: Implement prescriptions page
        break;
      case 'billing':
        // TODO: Implement billing page
        break;
      default:
        break;
    }
  };

  const handleBackToAppointments = () => {
    navigate('/patient/appointments');
  };

  // Patient form data (most fields come from user profile API)
  const [patientForm, setPatientForm] = useState({
    // Basic Information (from API - non-editable except phone numbers)
    fullName: user?.name || '',
    dateOfBirth: user?.dateOfBirth || '1990-01-01',
    gender: user?.gender || 'Male',
    phoneNumber: user?.phoneNumber || '', // Editable
    email: user?.email || '',
    emergencyContact: user?.emergencyContact || '',
    emergencyPhone: user?.emergencyPhone || '', // Editable
    
    // Medical Information
    chiefComplaint: '',
    currentSymptoms: [],
    symptomDuration: '',
    painLevel: 0,
    allergies: '',
    currentMedications: '',
    medicalHistory: '',
    
    // Appointment Preferences
    appointmentType: 'consultation',
    urgencyLevel: 'routine',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: ''
  });

  // Available symptoms list
  const availableSymptoms = [
    'Headache', 'Fever', 'Fatigue', 'Nausea', 'Cough', 'Sore Throat',
    'Body Aches', 'Dizziness', 'Shortness of Breath', 'Chest Pain',
    'Abdominal Pain', 'Back Pain', 'Joint Pain', 'Skin Rash',
    'Sleep Issues', 'Anxiety', 'Depression', 'Other'
  ];

  // Doctor data (in real app, fetch from API)
  const doctorData = {
    name: appointment?.doctorName || 'Dr. Sarah Wilson',
    specialization: 'Internal Medicine',
    experience: '12 years',
    rating: 4.8,
    reviews: 324,
    avatar: 'SW',
    education: ['MD, Johns Hopkins University', 'Residency, Mayo Clinic'],
    certifications: ['Board Certified Internal Medicine', 'Advanced Cardiac Life Support'],
    languages: ['English', 'Spanish', 'French'],
    availability: {
      today: '9:00 AM - 5:00 PM',
      tomorrow: '10:00 AM - 6:00 PM'
    },
    fees: {
      consultation: '$150',
      followUp: '$100',
      emergency: '$250'
    }
  };

  // Check if basic info is complete
  useEffect(() => {
    const requiredFields = [
      'fullName', 'dateOfBirth', 'gender', 'phoneNumber', 'email',
      'chiefComplaint', 'currentSymptoms', 'symptomDuration'
    ];
    
    const isComplete = requiredFields.every(field => {
      if (field === 'currentSymptoms') {
        return patientForm[field].length > 0;
      }
      const value = patientForm[field];
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    });
    
    setBasicInfoComplete(isComplete);
  }, [patientForm]);

  // Load user data from profile API on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Use existing profile API endpoint
        const response = await tokenService.authenticatedFetch('/api/profile');
        
        if (response.ok) {
          const userData = await response.json();
          setPatientForm(prev => ({
            ...prev,
            fullName: userData.fullName || userData.name || '',
            dateOfBirth: userData.dateOfBirth || '1990-01-01',
            gender: userData.gender || 'Male',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || '',
            emergencyContact: userData.emergencyContact || '',
            emergencyPhone: userData.emergencyPhone || ''
          }));
        } else {
          console.error('Failed to fetch user profile:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Keep default values if API fails
        setPatientForm(prev => ({
          ...prev,
          fullName: '',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          phoneNumber: '',
          email: '',
          emergencyContact: '',
          emergencyPhone: ''
        }));
      }
    };
    
    fetchUserProfile();
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle symptom selection
  const handleSymptomToggle = (symptom) => {
    if (symptom === 'Other') {
      setPatientForm(prev => ({
        ...prev,
        currentSymptoms: prev.currentSymptoms.includes(symptom)
          ? prev.currentSymptoms.filter(s => s !== symptom)
          : [...prev.currentSymptoms, symptom]
      }));
      if (!patientForm.currentSymptoms.includes(symptom)) {
        setCustomSymptom('');
      }
    } else {
      setPatientForm(prev => ({
        ...prev,
        currentSymptoms: prev.currentSymptoms.includes(symptom)
          ? prev.currentSymptoms.filter(s => s !== symptom)
          : [...prev.currentSymptoms, symptom]
      }));
    }
  };

  // Handle custom symptom input
  const handleCustomSymptomChange = (value) => {
    setCustomSymptom(value);
    // Update the symptoms array to include custom symptom
    if (value.trim()) {
      setPatientForm(prev => ({
        ...prev,
        currentSymptoms: prev.currentSymptoms.includes('Other')
          ? prev.currentSymptoms.map(s => s === 'Other' ? `Other: ${value.trim()}` : s)
          : [...prev.currentSymptoms, `Other: ${value.trim()}`]
      }));
    }
  };

  // Handle adding custom symptom
  const handleAddCustomSymptom = () => {
    if (customSymptom.trim()) {
      setPatientForm(prev => ({
        ...prev,
        currentSymptoms: [...prev.currentSymptoms, customSymptom.trim()]
      }));
      setCustomSymptom('');
    }
  };

  // Handle removing custom symptom
  const handleRemoveCustomSymptom = (symptomToRemove) => {
    setPatientForm(prev => ({
      ...prev,
      currentSymptoms: prev.currentSymptoms.filter(s => s !== symptomToRemove)
    }));
  };

  // Debug: Log form state changes
  useEffect(() => {
    console.log('Form state updated:', patientForm);
    console.log('Submit enabled:', isSubmitEnabled());
  }, [patientForm]);

  // Check if all required fields are complete for submission
  const isSubmitEnabled = () => {
    const validations = {
      fullName: patientForm.fullName && typeof patientForm.fullName === 'string' && patientForm.fullName.trim() !== '',
      dateOfBirth: patientForm.dateOfBirth && typeof patientForm.dateOfBirth === 'string' && patientForm.dateOfBirth.trim() !== '',
      gender: patientForm.gender && typeof patientForm.gender === 'string' && patientForm.gender.trim() !== '',
      phoneNumber: patientForm.phoneNumber && (typeof patientForm.phoneNumber === 'string' ? patientForm.phoneNumber.trim() !== '' : patientForm.phoneNumber.toString().trim() !== ''),
      email: patientForm.email && typeof patientForm.email === 'string' && patientForm.email.trim() !== '',
      chiefComplaint: patientForm.chiefComplaint && typeof patientForm.chiefComplaint === 'string' && patientForm.chiefComplaint.trim() !== '',
      currentSymptoms: Array.isArray(patientForm.currentSymptoms) && patientForm.currentSymptoms.length > 0,
      symptomDuration: patientForm.symptomDuration && typeof patientForm.symptomDuration === 'string' && patientForm.symptomDuration.trim() !== '',
      painLevel: patientForm.painLevel !== undefined && patientForm.painLevel !== null && patientForm.painLevel !== '' && patientForm.painLevel !== '0',
      currentMedications: true, // Optional field - always valid
      medicalHistory: true // Optional field - always valid
    };
    
    // Debug: Log which fields are failing
    const failedFields = Object.entries(validations).filter(([field, isValid]) => !isValid);
    if (failedFields.length > 0) {
      console.log('Submit validation failed for fields:', failedFields.map(([field]) => field));
      console.log('Current form state:', patientForm);
    }
    
    return Object.values(validations).every(Boolean);
  };

  // Submit patient information
  const handleSubmitInfo = async () => {
    if (!isSubmitEnabled()) {
      showToast('Please complete all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare appointment details data
      const appointmentDetailsData = {
        symptoms: patientForm.currentSymptoms,
        allergies: patientForm.allergies ? patientForm.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        patientPhone: patientForm.phoneNumber,
        patientEmergencyContact: patientForm.emergencyPhone,
        chiefComplaint: patientForm.chiefComplaint,
        symptomDuration: patientForm.symptomDuration,
        painLevel: patientForm.painLevel,
        currentMedications: patientForm.currentMedications,
        medicalHistory: patientForm.medicalHistory,
        additionalNotes: patientForm.additionalNotes,
        // Add other fields as needed
        diagnosis: '', // Will be filled by doctor
        prescription: '', // Will be filled by doctor
        treatmentPlan: '', // Will be filled by doctor
        followUpNotes: '' // Will be filled by doctor
      };

      // Submit to appointment details API
      const response = await tokenService.authenticatedFetch(`/api/appointment-details/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentDetailsData)
      });

      if (response.ok) {
        const savedDetails = await response.json();
        console.log('Appointment details saved:', savedDetails);
        showToast('Information submitted successfully!', 'success');
        
        // Update local state with saved data
        setAppointmentData(prev => ({
          ...prev,
          details: savedDetails
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit information');
      }
    } catch (error) {
      console.error('Failed to submit appointment details:', error);
      showToast(error.message || 'Failed to submit information', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check if chat should be enabled
  const isChatEnabled = () => {
    const details = appointment?.details;
    const statusConfirmed = appointment?.status && appointment.status.toLowerCase() === 'confirmed';
    
    console.log('Chat enablement check:', {
      details: details,
      status: appointment?.status,
      statusConfirmed: statusConfirmed,
      hasDetails: !!details
    });
    
    // Chat is only enabled if appointment is confirmed AND appointment details exist with required fields
    if (details && statusConfirmed) {
      // Check all required fields from appointment details API response
      const validations = {
        chiefComplaint: details.chiefComplaint && details.chiefComplaint.trim() !== '',
        symptoms: Array.isArray(details.symptoms) && details.symptoms.length > 0,
        symptomDuration: details.symptomDuration && details.symptomDuration.trim() !== '',
        painLevel: details.painLevel !== undefined && details.painLevel !== null,
        currentMedications: true, // Optional field - always valid
        medicalHistory: true // Optional field - always valid
      };
      
      console.log('Chat validation details:', validations);
      console.log('Raw details data:', details);
      
      const allValid = Object.values(validations).every(Boolean);
      console.log('Chat enabled:', allValid);
      
      return allValid;
    }
    
    console.log('Chat disabled - no details or not confirmed');
    // Chat is disabled if no appointment details exist or appointment is not confirmed
    return false;
  };

  // Toggle chat
  const toggleChat = () => {
    if (!isChatEnabled()) {
      const details = appointment?.details;
      const statusConfirmed = appointment?.status && appointment.status.toLowerCase() === 'confirmed';
      
      if (!statusConfirmed) {
        showToast('Chat is only available for confirmed appointments', 'warning');
      } else if (!details) {
        showToast('Please submit your information first to enable chat', 'warning');
      } else {
        showToast('Please complete all required fields in your submitted information to enable chat', 'warning');
      }
      return;
    }
    setIsChatOpen(!isChatOpen);
  };

  // Close chat
  const closeChat = () => {
    setIsChatOpen(false);
  };

  // Calculate form completion percentage
  const getCompletionPercentage = () => {
    const totalFields = 8; // Required fields count
    const completedFields = [
      patientForm.fullName,
      patientForm.dateOfBirth,
      patientForm.gender,
      patientForm.phoneNumber,
      patientForm.email,
      patientForm.chiefComplaint,
      patientForm.currentSymptoms.length > 0,
      patientForm.symptomDuration
    ].filter(Boolean).length;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  const userInfo = {
    name: user?.name,
    role: user?.role
  };

  // Show loading state while fetching appointment data
  if (appointmentLoading) {
    return (
      <div className="patient-appointment-details">
        <CommonHeader 
          user={userInfo}
          activeMenuItem="appointments"
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '1.1rem',
          color: '#64748b'
        }}>
          Loading appointment details...
        </div>
      </div>
    );
  }

  // Show error state if no appointment data
  if (!appointment) {
    return (
      <div className="patient-appointment-details">
        <CommonHeader 
          user={userInfo}
          activeMenuItem="appointments"
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '1.1rem',
          color: '#ef4444'
        }}>
          Appointment not found. Please check the URL.
        </div>
      </div>
    );
  }

  return (
    <div className="patient-appointment-details">
      {/* Common Header */}
      <CommonHeader 
        user={userInfo}
        activeMenuItem="appointments"
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />
      
      <div className="appointment-details-scroll-wrapper">
        <div className={`consultation-container ${isChatOpen ? 'chat-open' : ''}`}>
        {/* Left Sidebar - Doctor Information */}
        <div className="patient-sidebar">
          <div className="patient-tabs">
            <button 
              className={`patient-tab ${activeDoctorTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveDoctorTab('info')}
            >
              Doctor's Info
            </button>
            <button 
              className={`patient-tab ${activeDoctorTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveDoctorTab('history')}
            >
              Appointments History
            </button>
            <button 
              className={`patient-tab ${activeDoctorTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveDoctorTab('files')}
            >
              Uploaded Documents
            </button>
          </div>
          
          <div className="patient-content">
            {/* Info Tab */}
            {activeDoctorTab === 'info' && (
              <div className=".doctor-info-tab-panel active">
                <div className="doctor-info-group">
                  <div className="doctor-info-header">
                    <div className="doctor-avatar theme-blue">
                      <div className="avatar-initials">
                        {doctorData.avatar}
                      </div>
                    </div>
                    <div className="patient-appointment-doctor-info">
                      <h2 className="doctor-name">{doctorData.name}</h2>
                      <p className="doctor-specialization">{doctorData.specialization}</p>
                      <div className="doctor-rating">
                        ⭐ {doctorData.rating} ({doctorData.reviews} reviews)
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="info-group">
                  <h3>Doctor Information</h3>
                  <div className="info-item">
                    <span className="info-label">Experience</span>
                    <span className="info-value">{doctorData.experience}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Education</span>
                    <span className="info-value">{doctorData.education.join(', ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Certifications</span>
                    <span className="info-value">{doctorData.certifications.join(', ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Languages</span>
                    <span className="info-value">{doctorData.languages.join(', ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Consultation Fee</span>
                    <span className="info-value">{doctorData.fees.consultation}</span>
                  </div>
                </div>
                
                <div className="info-group">
                  <button 
                    className="plain-btn view-profile-btn"
                    onClick={() => setShowDoctorModal(true)}
                  >
                    View Full Doctor Profile
                  </button>
                </div>
              </div>
            )}
            
            {/* History Tab */}
            {activeDoctorTab === 'history' && (
              <div className="tab-panel active">
                <div className="info-group">
                  <h3>Previous Appointments</h3>
                  <div className="info-item">
                    <span className="info-label">Last Visit</span>
                    <span className="info-value">March 15, 2024</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Reason</span>
                    <span className="info-value">Annual Checkup</span>
                  </div>
                </div>
                
              </div>
            )}
            
            {/* Files Tab */}
            {activeDoctorTab === 'files' && (
              <div className="tab-panel active">
                <div className="info-group">
                  <h3>Uploaded Files</h3>
                  <div className="education-item">
                    <span className="education-text">📄 Lab Report - March 2024</span>
                  </div>
                  <div className="education-item">
                    <span className="education-text">📄 Prescription - March 2024</span>
                  </div>
                </div>
                
                <div className="info-group">
                  <h3>Upload New File</h3>
                  <input 
                    type="file" 
                    style={{ 
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content Area - Patient Form */}
        <div className="main-content">
          <div className="consultation-header">
            <div className="consultation-title">
              <h1>Patient Information Form</h1>
              <p className="consultation-subtitle">
                Please fill out your information to begin consultation
              </p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getCompletionPercentage()}%` }}></div>
                <span className="progress-text">{getCompletionPercentage()}% Complete</span>
              </div>
            </div>
            
            <div className="consultation-actions">
              <button 
                className={`plain-btn chat-btn ${!isChatEnabled() ? 'disabled' : ''}`}
                onClick={toggleChat}
                disabled={!isChatEnabled()}
                title={!isChatEnabled() ? 
                  (!isSubmitEnabled() ? 'Please complete all required fields to start chatting' : 'Chat is only available for confirmed appointments') : 
                  'Start chatting with your doctor'
                }
              >
                 Chat {!isChatEnabled()}
              </button>
              <button 
                className="plain-btn submit" 
                onClick={handleSubmitInfo}
                disabled={!isSubmitEnabled() || loading}
                title={!isSubmitEnabled() ? 'Please complete all required fields to submit' : loading ? 'Submitting information...' : 'Submit your information'}
              >
                {loading ? 'Submitting...' : (
                  <>
                    Submit<br />Information
                  </>
                )}
              </button>
              <button 
                className="plain-btn back" 
                onClick={handleBackToAppointments}
              >
                Back to<br />Appointments
              </button>
            </div>
          </div>
          
          <div className="patient-form-section">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information *</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={patientForm.fullName}
                    placeholder="Full name"
                    disabled
                    style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                    title="To change basic information, please update your profile"
                  />
                </div>
                
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={patientForm.dateOfBirth}
                    disabled
                    style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                    title="To change basic information, please update your profile"
                  />
                </div>
                
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    className="form-input"
                    value={patientForm.gender}
                    disabled
                    style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                    title="To change basic information, please update your profile"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={patientForm.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={patientForm.email}
                    placeholder="Email address"
                    disabled
                    style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                    title="To change basic information, please update your profile"
                  />
                </div>
                
                
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={patientForm.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#64748b', 
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0'
              }}>
                💡 To change disabled fields, please update your profile settings.
              </div>
            </div>

            {/* Medical Information */}
            <div className="form-section">
              <h3 className="section-title">Medical Information *</h3>
              
              <div className="form-group">
                <label>Chief Complaint *</label>
                <textarea
                  className="form-input"
                  value={patientForm.chiefComplaint}
                  onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                  placeholder="Describe your main concern or reason for this appointment"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Current Symptoms * (Select all that apply)</label>
                <div className="symptoms-grid">
                  {availableSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`symptom-btn ${patientForm.currentSymptoms.some(s => s === symptom || s.startsWith(symptom + ':')) ? 'selected' : ''}`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
                
                {/* Custom symptom input for "Other" */}
                {patientForm.currentSymptoms.some(s => s === 'Other' || s.startsWith('Other:')) && (
                  <div className="custom-symptoms-section">
                    <div className="custom-symptom-input-wrapper">
                      <input
                        type="text"
                        value={customSymptom}
                        onChange={(e) => setCustomSymptom(e.target.value)}
                        placeholder="Please mention your symptoms"
                        className="form-input custom-symptom-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSymptom()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSymptom}
                        className="custom-symptom-plus-btn"
                        disabled={!customSymptom.trim()}
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Display custom symptoms */}
                    {patientForm.currentSymptoms.filter(s => !availableSymptoms.includes(s)).length > 0 && (
                      <div className="custom-symptoms-section">
                        <h4 className="custom-symptoms-title">Added Symptoms:</h4>
                        <div className="symptoms-grid custom-symptoms-grid">
                          {patientForm.currentSymptoms
                            .filter(s => !availableSymptoms.includes(s))
                            .map((symptom, index) => (
                              <div
                                key={index}
                                className="symptom-btn custom-symptom-item"
                              >
                                {symptom}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomSymptom(symptom)}
                                  title="Remove symptom"
                                  className="custom-symptom-remove-btn"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>How long have you had these symptoms? *</label>
                  <select
                    className="form-input"
                    value={patientForm.symptomDuration}
                    onChange={(e) => handleInputChange('symptomDuration', e.target.value)}
                  >
                    <option value="">Select duration</option>
                    <option value="less-than-day">Less than a day</option>
                    <option value="1-3-days">1-3 days</option>
                    <option value="4-7-days">4-7 days</option>
                    <option value="1-2-weeks">1-2 weeks</option>
                    <option value="2-4-weeks">2-4 weeks</option>
                    <option value="more-than-month">More than a month</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Pain Level (0-10)</label>
                  <div className="pain-scale">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={patientForm.painLevel}
                      onChange={(e) => handleInputChange('painLevel', e.target.value)}
                      className="pain-slider"
                    />
                    <div className="pain-labels">
                      <span>0 (No pain)</span>
                      <span className="pain-value">{patientForm.painLevel}</span>
                      <span>10 (Severe)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Known Allergies</label>
                  <textarea
                    className="form-input"
                    value={patientForm.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="List any allergies to medications, foods, or other substances"
                    rows="2"
                  />
                </div>
                
                <div className="form-group">
                  <label>Current Medications</label>
                  <textarea
                    className="form-input"
                    value={patientForm.currentMedications}
                    onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                    placeholder="List all medications you are currently taking"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <h3 className="section-title">Additional Information</h3>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  className="form-input"
                  value={patientForm.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Any additional information you'd like to share with the doctor"
                  rows="3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Profile Modal */}
        {showDoctorModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              width: '90%'
            }}>
              <button
                onClick={() => setShowDoctorModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
              
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Doctor Profile</h2>
              
              <div className="info-group">
                <h3>Experience</h3>
                <div className="info-item">
                  <span className="info-label">Years of Practice</span>
                  <span className="info-value">{doctorData.experience}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Specialization</span>
                  <span className="info-value">{doctorData.specialization}</span>
                </div>
              </div>
              
              <div className="info-group">
                <h3>Education</h3>
                {doctorData.education.map((edu, index) => (
                  <div key={index} className="education-item">
                    <span className="education-text">{edu}</span>
                  </div>
                ))}
              </div>
              
              <div className="info-group">
                <h3>Certifications</h3>
                {doctorData.certifications.map((cert, index) => (
                  <div key={index} className="certification-item">
                    <span className="certification-text">✓ {cert}</span>
                  </div>
                ))}
              </div>
              
              <div className="info-group">
                <h3>Languages</h3>
                <div className="languages-list">
                  {doctorData.languages.map((lang, index) => (
                    <span key={index} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div>
              
              <div className="info-group">
                <h3>Availability</h3>
                <div className="info-item">
                  <span className="info-label">Today</span>
                  <span className="info-value available">{doctorData.availability.today}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tomorrow</span>
                  <span className="info-value available">{doctorData.availability.tomorrow}</span>
                </div>
              </div>
              
              <div className="info-group">
                <h3>Consultation Fees</h3>
                <div className="info-item">
                  <span className="info-label">Initial Consultation</span>
                  <span className="info-value fee">{doctorData.fees.consultation}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Follow-up Visit</span>
                  <span className="info-value fee">{doctorData.fees.followUp}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Emergency Consultation</span>
                  <span className="info-value fee">{doctorData.fees.emergency}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Section - Only show when chat is open */}
        {isChatOpen && (
          <ChatSection 
            patientData={{
              name: doctorData.name,
              avatar: doctorData.avatar
            }}
            appointmentId={id}
            onClose={closeChat}
            showToast={showToast}
          />
        )}
      </div>
    </div>
    </div>
  );
};

export default PatientAppointmentDetails;