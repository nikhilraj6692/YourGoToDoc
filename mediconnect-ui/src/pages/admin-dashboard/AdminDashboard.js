import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import '../../styles/Common.css';
import '../../styles/Auth.css';
import tokenService from '../../services/tokenService';
import { handleLogout } from '../../utils/logout';
import { useToast } from '../../context/ToastContext';
import CommonHeader from '../../components/CommonHeader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeMenu, setActiveMenu] = useState('approvals');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doctorData, setDoctorData] = useState({
    PENDING: [],
    VERIFIED: [],
    REJECTED: []
  });

  // Enhanced stats with trend indicators
  const [stats, setStats] = useState({
    pendingApprovals: { value: 0, change: '+0', trend: 'positive' },
    totalDoctors: { value: 0, change: '+0', trend: 'positive' },
    rejectedApplications: { value: 0, change: '+0', trend: 'positive' },
    verifiedToday: { value: 0, change: '+0', trend: 'positive' }
  });

  // Specialization icons mapping
  const specializationIcons = {
    'Cardiology': '❤️',
    'Dermatology': '🧴',
    'Neurology': '🧠',
    'Pediatrics': '👶',
    'Orthopedics': '🦴',
    'Ophthalmology': '👁️',
    'Psychiatry': '🧑‍⚕️',
    'Gynecology': '🤰',
    'Internal Medicine': '💊',
    'Family Medicine': '👨‍👩‍👧‍👦'
  };

  useEffect(() => {
    // Fetch all statuses when the page loads
    const fetchAllStatuses = async () => {
      try {
        setLoading(true);
        const statuses = ['PENDING', 'VERIFIED', 'REJECTED'];
        await Promise.all(statuses.map(status => fetchDoctorsByStatus(status)));
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStatuses();
  }, []); // Empty dependency array means this runs once on mount

  // Refresh data when tab changes
  useEffect(() => {
    if (activeTab) {
      fetchDoctorsByStatus(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (showDocumentViewer) {
      document.body.classList.add('document-viewer-open');
    } else {
      document.body.classList.remove('document-viewer-open');
    }
    return () => {
      document.body.classList.remove('document-viewer-open');
    };
  }, [showDocumentViewer]);

  const fetchDoctorsByStatus = async (status) => {
    try {
      setLoading(true);
      console.log(`Fetching doctors with status: ${status}`);
      
      const response = await tokenService.authenticatedFetch(`/api/admin/doctors/approvals?status=${status}`);

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      console.log(`Received ${data.length} doctors for status ${status}:`, data);
      
      setDoctorData(prev => ({
        ...prev,
        [status]: data
      }));
      updateStats(data, status);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data, status) => {
    setStats(prev => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count verified profiles for today
      const verifiedToday = data.filter(doctor => {
        if (doctor.verifiedAt) {
          const verifiedDate = new Date(doctor.verifiedAt);
          verifiedDate.setHours(0, 0, 0, 0);
          return verifiedDate.getTime() === today.getTime();
        }
        return false;
      }).length;

      return {
        ...prev,
        pendingApprovals: { 
          ...prev.pendingApprovals, 
          value: status === 'PENDING' ? data.length : prev.pendingApprovals.value 
        },
        totalDoctors: { 
          ...prev.totalDoctors, 
          value: status === 'VERIFIED' ? data.length : prev.totalDoctors.value 
        },
        rejectedApplications: { 
          ...prev.rejectedApplications, 
          value: status === 'REJECTED' ? data.length : prev.rejectedApplications.value 
        },
        verifiedToday: {
          ...prev.verifiedToday,
          value: verifiedToday,
          change: verifiedToday > 0 ? `+${verifiedToday}` : '0'
        }
      };
    });
  };



  const handleDoctorSelect = async (doctor) => {
    try {
      setLoading(true);
      console.log('Doctor selected from tile:', doctor);

      // Use the doctor's ID directly from the list data
      const response = await tokenService.authenticatedFetch(`/api/admin/doctors/${doctor.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch doctor profile');
      }

      const data = await response.json();
      console.log('Doctor data from API:', data);
      
      // Set the selected doctor with the complete data
      setSelectedDoctor({
        ...data,
        id: doctor.id // Ensure we keep the original ID
      });
      
      console.log('Selected doctor after setting:', {
        ...data,
        id: doctor.id
      });
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentView = async (doctorId, documentType) => {
    try {
      setLoading(true);
      console.log(`Fetching document: ${documentType} for doctor: ${doctorId}`);

      const response = await tokenService.authenticatedFetch(`/api/s3/documents/${doctorId}/${documentType}`);

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      setCurrentDocument({
        url,
        type: blob.type,
        name: `${documentType.toLowerCase()}.${blob.type.split('/')[1] || 'pdf'}`
      });
      setShowDocumentViewer(true);
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (action, comment) => {
    console.log('Current selected doctor:', selectedDoctor);
    
    if (!selectedDoctor) {
      console.error('No doctor selected');
      return;
    }

    if (!selectedDoctor.id) {
      console.error('Missing doctor ID in selected doctor:', selectedDoctor);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Sending verification request:', {
        doctorId: selectedDoctor.id,
        action,
        comment,
        selectedDoctor
      });

      const response = await tokenService.authenticatedFetch(`/api/admin/doctors/verify/${selectedDoctor.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'VERIFIED' : action === 'reject' ? 'REJECTED' : 'PENDING',
          reason: comment || (action === 'reject' ? 'Application rejected' : 'More information requested')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update doctor status');
      }
      
      // Refresh all statuses after successful submission
      const statuses = ['PENDING', 'VERIFIED', 'REJECTED'];
      await Promise.all(statuses.map(status => fetchDoctorsByStatus(status)));
      
      // Refresh the doctor's data in the main page
      const doctorResponse = await tokenService.authenticatedFetch(`/api/admin/doctors/${selectedDoctor.id}`);

      if (!doctorResponse.ok) {
        throw new Error('Failed to refresh doctor data');
      }

      const updatedDoctorData = await doctorResponse.json();
      setSelectedDoctor({
        ...updatedDoctorData,
        id: selectedDoctor.id
      });

      // Show success toast based on action
      const actionMessages = {
        'approve': `Dr. ${selectedDoctor.fullName} has been approved successfully!`,
        'reject': `Dr. ${selectedDoctor.fullName} has been rejected.`,
        'review': `More information requested from Dr. ${selectedDoctor.fullName}.`
      };
      
      const toastType = action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning';
      showToast(actionMessages[action], toastType, 4000);

      // Close the details panel after successful update
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error processing verification:', error);
      const errorMessage = error.message || 'Failed to process the request. Please try again.';
      showToast(`${errorMessage}`, 'error', 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.state,
      address.pincode
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  };

  const getCurrentTabData = () => {
    return doctorData[activeTab] || [];
  };

  const getCurrentTabCount = () => {
    return getCurrentTabData().length;
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const statuses = ['PENDING', 'VERIFIED', 'REJECTED'];
      await Promise.all(statuses.map(status => fetchDoctorsByStatus(status)));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && activeMenu === 'approvals') {
    return (
      <div className="admin-dashboard">
        
        <main className="admin-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '60vh',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div className="loading-skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
            <p>Loading dashboard data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <CommonHeader 
        activeTab={activeMenu}
        onMenuClick={setActiveMenu}
        onLogout={handleLogout}
        menuItems={[
          { id: 'approvals', label: 'Approvals' },
          { id: 'analytics', label: 'Analytics' }
        ]}
      />

      {/* Main Content */}
      <main className="admin-content">
        {activeMenu === 'approvals' && (
          <>
            {/* Section Header with Stats */}
            <div className="section-header">
              <div>
                <h2 className="section-title">Application Verification</h2>
                <p className="section-subtitle">Oversee physician application lifecycle management and approval flows</p>
              </div>
              
              <div className="header-actions">
                <div className="stats-display">
                  <span>⏳ Pending: {stats.pendingApprovals.value}</span>
                  <span>👨‍⚕️ Total: {stats.totalDoctors.value}</span>
                  <span>❌ Rejected: {stats.rejectedApplications.value}</span>
                  <span>✅ Verified Today: {stats.verifiedToday.value}</span>
                </div>
              </div>
            </div>

                        <div className="approvals-section">

            <div className="approval-tabs">
              <button 
                className={`tab ${activeTab === 'PENDING' ? 'active' : ''}`}
                onClick={() => setActiveTab('PENDING')}
              >
                Pending 
                <span className="tab-count">{doctorData.PENDING.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'VERIFIED' ? 'active' : ''}`}
                onClick={() => setActiveTab('VERIFIED')}
              >
                Verified 
                <span className="tab-count">{doctorData.VERIFIED.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setActiveTab('REJECTED')}
              >
                Rejected 
                <span className="tab-count">{doctorData.REJECTED.length}</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
                <p>Loading doctors...</p>
              </div>
            ) : getCurrentTabData().length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  {activeTab === 'PENDING' ? '📋' : activeTab === 'VERIFIED' ? '✅' : '❌'}
                </div>
                <h3>No {activeTab.toLowerCase()} applications</h3>
                <p>
                  {activeTab === 'PENDING' 
                    ? 'All applications have been reviewed' 
                    : activeTab === 'VERIFIED'
                    ? 'No verified applications yet'
                    : 'No rejected applications'
                  }
                </p>
              </div>
            ) : (
              <div className="doctor-tiles">
                {getCurrentTabData().map((doctor) => {
                  console.log('Doctor in tile:', doctor);
                  return (
                    <div key={doctor.id} className="doctor-tile">
                      <div className="doctor-header">
                        <h3 className="doctor-name">Dr. {doctor.name}</h3>
                      </div>
                      
                      <div className="admin-doctor-info">
                        <p className="specialty">
                          
                          {doctor.specialty || 'Unknown Specialty'}
                        </p>
                        <p className="experience">
                          {doctor.experience ? `${doctor.experience} years experience` : 'Unknown Experience'}
                        </p>
                        <p className="location">
                          {doctor.location || 'Unknown Location'}
                        </p>
                      </div>
                      
                      <div className="dates">
                        <div className="date-item">
                          <span className="date-label">Submitted:</span>
                          <span>{formatDate(doctor.submittedDate)}</span>
                        </div>
                        {doctor.lastUpdated && (
                          <div className="date-item">
                            <span className="date-label">Updated:</span>
                            <span>{formatDate(doctor.lastUpdated)}</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className="plain-btn sec-submit-btn"
                        style={{
                          width: '100%',
                        }}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        {activeTab === 'PENDING' ? 'Review Application' : 'View Details'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </>
        )}

        {activeMenu === 'analytics' && (
          <div className="approvals-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Analytics Dashboard</h2>
                <p className="section-subtitle">Platform insights and metrics</p>
              </div>
            </div>
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>Analytics Coming Soon</h3>
              <p>Advanced analytics and reporting features will be available soon.</p>
            </div>
          </div>
        )}

        {activeMenu === 'notifications' && (
          <div className="approvals-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Notifications</h2>
                <p className="section-subtitle">System alerts and updates</p>
              </div>
            </div>
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <h3>No New Notifications</h3>
              <p>You're all caught up! Check back later for updates.</p>
            </div>
          </div>
        )}

        {/* Enhanced Doctor Details Panel */}
        {selectedDoctor && (
          
          <div className="doctor-details-panel">
            <div className="panel-header">
              <h2>
                {activeTab === 'PENDING' ? 'Review Application' : 'Doctor Details'}
              </h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedDoctor(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="panel-content">
              <div className="documents-section">
                <div className="section-header-wrapper">
                  <div className="section-header-with-background">
                    <h3>Doctor Information</h3>
                  </div>
                </div>
                <div className="profile-photo-section">
                  {selectedDoctor.id ? (
                    <img 
                      src={`/api/s3/documents/${selectedDoctor.id}/PROFILE_PHOTO`}
                      alt="Doctor profile" 
                      className="doctor-profile-photo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-profile.png';
                      }}
                      crossOrigin="anonymous"
                      ref={(img) => {
                        if (img) {
                          const token = tokenService.getAccessToken();
                          if (token) {
                            img.onload = () => {
                              // Image loaded successfully
                            };
                            img.onerror = () => {
                              img.src = '/default-profile.png';
                            };
                            // Add authorization header
                            fetch(`/api/s3/documents/${selectedDoctor.id}/PROFILE_PHOTO`, {
                              headers: {
                                'Authorization': 'Bearer ' + token
                              }
                            })
                            .then(response => response.blob())
                            .then(blob => {
                              img.src = URL.createObjectURL(blob);
                            })
                            .catch(() => {
                              img.src = '/default-profile.png';
                            });
                          }
                        }
                      }}
                    />
                  ) : (
                    <img 
                      src="/default-profile.png" 
                      alt="Doctor profile" 
                      className="doctor-profile-photo"
                    />
                  )}
                </div>
              <div className="admin-doctor-info">
                <div className="doctor-info-list">
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Full Name</div>
                      <div className="info-value">{selectedDoctor.fullName}</div>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Specialty</div>
                      <div className="info-value">{selectedDoctor.specialization}</div>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Experience</div>
                      <div className="info-value">{selectedDoctor.yearsOfExperience} years experience</div>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">License Number</div>
                      <div className="info-value">{selectedDoctor.licenseNumber}</div>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Email Address</div>
                      <div className="info-value">{selectedDoctor.email}</div>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Phone Number</div>
                      <div className="info-value">{selectedDoctor.phoneNumber}</div>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Location</div>
                      <div className="info-value">{formatAddress(selectedDoctor.address)}</div>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-content">
                      <div className="info-label">Professional Bio</div>
                      <div className="bio-text-boxes">
                        {selectedDoctor.bio}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {selectedDoctor.documents && (
                <div className="documents-section">
                  <div className="section-header-wrapper">
                    <div className="section-header-with-background">
                      <h3>Verification Documents</h3>
                    </div>
                  </div>
                  <div className="document-list">
                    {['LICENSE', 'QUALIFICATION', 'IDENTITY'].map((docType) => {
                      const isAvailable = selectedDoctor.documents[docType];
                      
                      return (
                        <div 
                          key={docType} 
                          className={`document-item ${isAvailable ? 'clickable' : ''}`}
                          onClick={() => isAvailable && handleDocumentView(selectedDoctor.id, docType)}
                        >
                          <span className="document-type">{docType}</span>
                          <span className="document-icon">
                            {isAvailable ? '✅' : '❌'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'PENDING' && (
                <div className="documents-section">
                  <div className="section-header-wrapper">
                    <div className="section-header-with-background">
                      <h3>Review Actions</h3>
                    </div>
                  </div>
                <div className="approval-actions">
                  <div className="form-group">
                    <label htmlFor="review-reason">Review Comments *</label>
                    <textarea 
                      id="review-reason"
                      className="comment-box"
                      placeholder="Add your review comments, feedback, or reason for rejection..."
                      required
                    />
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="action-btn approve"
                      onClick={() => {
                        const reason = document.getElementById('review-reason')?.value;
                        if (!reason) {
                          alert('Please provide review comments before proceeding.');
                          return;
                        }
                        handleApprovalAction('approve', reason);
                      }}
                    >
                      Approve Application
                    </button>
                    <button 
                      className="action-btn reject"
                      onClick={() => {
                        const reason = document.getElementById('review-reason')?.value;
                        if (!reason) {
                          alert('Please provide review comments before proceeding.');
                          return;
                        }
                        handleApprovalAction('reject', reason);
                      }}
                    >
                      Reject Application
                    </button>
                    <button 
                      className="action-btn review"
                      onClick={() => {
                        const reason = document.getElementById('review-reason')?.value;
                        if (!reason) {
                          alert('Please provide review comments before proceeding.');
                          return;
                        }
                        handleApprovalAction('review', reason);
                      }}
                    >
                      Request More Info
                    </button>
                  </div>
                </div>
                </div>
              )}

              {activeTab === 'REJECTED' && (
                <div className="documents-section">
                  <div className="section-header-wrapper">
                    <div className="section-header-with-background">
                      <h3>⚖️ Review Actions</h3>
                    </div>
                  </div>
                <div className="approval-actions">
                  <div className="form-group">
                    <label htmlFor="review-reason">Review Comments *</label>
                    <textarea 
                      id="review-reason"
                      className="comment-box"
                      placeholder="Add your review comments for reopening the profile..."
                      required
                    />
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="action-btn approve"
                      onClick={() => {
                        const reason = document.getElementById('review-reason')?.value;
                        if (!reason) {
                          alert('Please provide review comments before proceeding.');
                          return;
                        }
                        handleApprovalAction('review', reason);
                      }}
                    >
                      Reopen Profile
                    </button>
                  </div>
                </div>
                </div>
              )}

              {selectedDoctor && selectedDoctor.verificationStatus === 'PENDING' && selectedDoctor.statusReason && (
                <div className="status-reason-container">
                  <div style={{
                    background: '#fff7e6',
                    color: '#b7791f',
                    border: '1px solid #f6ad55',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    fontWeight: 500
                  }}>
                    <span style={{ fontWeight: 700 }}>Review Note: </span>{selectedDoctor.statusReason}
                  </div>
                </div>
              )}
              {selectedDoctor && selectedDoctor.verificationStatus === 'REJECTED' && selectedDoctor.statusReason && (
                <div className="status-reason-container">
                  <div style={{
                    background: '#fff7e6',
                    color: '#b7791f',
                    border: '1px solid #f6ad55',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    fontWeight: 500
                  }}>
                    <span style={{ fontWeight: 700 }}>Review Note: </span>{selectedDoctor.statusReason}
                  </div>
                </div>
              )}

              {activeTab === 'VERIFIED' && (
                <div className="documents-section">
                  <div className="section-header-wrapper">
                    <div className="section-header-with-background">
                      <h3>⚖️ Review Actions</h3>
                    </div>
                  </div>
                  <div className="approval-actions">
                    <div className="form-group">
                      <label htmlFor="block-reason">Block Reason *</label>
                      <textarea 
                        id="block-reason"
                        className="comment-box"
                        placeholder="Add your reason for blocking this doctor..."
                        required
                      />
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="action-btn reject"
                        onClick={() => {
                          const reason = document.getElementById('block-reason')?.value;
                          if (!reason) {
                            alert('Please provide a reason for blocking the doctor.');
                            return;
                          }
                          handleApprovalAction('reject', reason);
                        }}
                      >
                        Block Doctor
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Document Viewer Panel */}
        {showDocumentViewer && (
          <>
            <div className="blur-overlay" />
            <div className="document-viewer-overlay">
              <div className="document-viewer-panel">
                <div className="modal-header">
                <h2 className="modal-title">📄 {currentDocument?.name || 'Document Viewer'}</h2>
                  <button 
                    className="modal-close"
                    onClick={() => {
                      setShowDocumentViewer(false);
                      if (currentDocument?.url) {
                        window.URL.revokeObjectURL(currentDocument.url);
                        setCurrentDocument(null);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="document-content">
                  {loading ? (
                    <div className="loading-state">
                      <div className="loading-skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
                      <p>Loading document...</p>
                    </div>
                  ) : currentDocument ? (
                    currentDocument.type.startsWith('image/') ? (
                      <img 
                        src={currentDocument.url} 
                        alt={currentDocument.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <object
                        data={currentDocument.url}
                        type="application/pdf"
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          borderRadius: '0.8rem'
                        }}
                      >
                        <iframe 
                          src={currentDocument.url}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '0.8rem'
                          }}
                          title="Document Viewer"
                        />
                      </object>
                    )
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📄</div>
                      <h3>Document Not Available</h3>
                      <p>Unable to load the document. Please try again later.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;