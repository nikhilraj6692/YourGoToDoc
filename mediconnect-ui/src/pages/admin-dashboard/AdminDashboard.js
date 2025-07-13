import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import '../../styles/Common.css';
import '../../styles/Auth.css';
import tokenService from '../../services/tokenService';
import { handleLogout } from '../../utils/logout';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
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
      const token = tokenService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await tokenService.authenticatedFetch(`/api/admin/doctors/approvals?status=${status}`);

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
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
      const token = tokenService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Debug logs
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
      const token = tokenService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

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
      const token = tokenService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

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

      // Close the details panel after successful update
      setSelectedDoctor(null);
    } catch (error) {
      console.error('Error processing verification:', error);
      alert('Failed to process the request. Please try again.');
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
      {/* Enhanced Header */}
      <header className="common-header">
        <div className="header-container">
          <div className="header-logo">
            <span className="logo-icon">⚕️</span>
            <span className="logo-text">MediConnect</span>
          </div>
          
          <nav className="header-menu">
            <button 
              className={`menu-item ${activeMenu === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveMenu('approvals')}
            >
              Approvals
            </button>
            <button 
              className={`menu-item ${activeMenu === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveMenu('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`menu-item ${activeMenu === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveMenu('notifications')}
            >
              Notifications
            </button>
          </nav>
          
          <div className="header-right">
          
            <button className="plain-btn logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-content">
        {/* Stats Dashboard */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Approvals</h3>
              <div className="stat-value">{stats.pendingApprovals.value}</div>
              
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">👨‍⚕️</div>
            <div className="stat-content">
              <h3>Total Doctors</h3>
              <div className="stat-value">{stats.totalDoctors.value}</div>
              
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>Rejected Applications</h3>
              <div className="stat-value">{stats.rejectedApplications.value}</div>
              
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Verified Today</h3>
              <div className="stat-value">{stats.verifiedToday.value}</div>
              <div className={`stat-change ${stats.verifiedToday.trend}`}>
                {stats.verifiedToday.change} from yesterday
              </div>
            </div>
          </div>
        </div>

        {activeMenu === 'approvals' && (
          <div className="approvals-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Doctor Verification</h2>
                <p className="section-subtitle">Review and approve doctor applications</p>
              </div>
            </div>

            <div className="approval-tabs">
              <button 
                className={`tab ${activeTab === 'PENDING' ? 'active' : ''}`}
                onClick={() => setActiveTab('PENDING')}
              >
                ⏳ Pending 
                <span className="tab-count">{doctorData.PENDING.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'VERIFIED' ? 'active' : ''}`}
                onClick={() => setActiveTab('VERIFIED')}
              >
                ✅ Verified 
                <span className="tab-count">{doctorData.VERIFIED.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setActiveTab('REJECTED')}
              >
                ❌ Rejected 
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
                        <h3>{doctor.name}</h3>
                      </div>
                      
                      <div className="doctor-info">
                        <p className="specialty">
                          <span className="specialty-icon">
                            {specializationIcons[doctor.specialty] || '🏥'}
                          </span>
                          {doctor.specialty || 'Unknown Specialty'}
                        </p>
                        <p className="experience">
                          <span className="info-icon">⏱️</span>
                          {doctor.experience ? `${doctor.experience} years` : 'Unknown Experience'}
                        </p>
                        <p className="experience">
                          <span className="info-icon">📍</span>
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
                        className="details-btn"
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
                className="close-btn"
                onClick={() => setSelectedDoctor(null)}
              >
                ×
              </button>
            </div>
            
            <div className="panel-content">
              <div className="documents-section">
              <h3>ℹ️ Doctor Information</h3>
              <div className="doctor-info">
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
                <h3>
                  <span className="info-icon">👨‍⚕️</span>
                  {selectedDoctor.fullName}
                </h3>
                <p>
                  <span className="info-icon">🏥</span>
                  <strong>Specialty:</strong> {selectedDoctor.specialization}
                </p>
                <p>
                  <span className="info-icon">⏱️</span>
                  <strong>Experience:</strong> {selectedDoctor.yearsOfExperience}
                </p>
                <p>
                  <span className="info-icon">📋</span>
                  <strong>License:</strong> {selectedDoctor.licenseNumber}
                </p>
                
                <p>
                  <span className="info-icon">📧</span>
                  <strong>Email:</strong> {selectedDoctor.email}
                </p>
              
              
                <p>
                  <span className="info-icon">📱</span>
                  <strong>Phone:</strong> {selectedDoctor.phoneNumber}
                </p>
              
              
                <p>
                  <span className="info-icon">📍</span>
                  <strong>Location:</strong> {formatAddress(selectedDoctor.address)}
                </p>

                <div className="bio-container">
                  <p>
                    <span className="info-icon">📋</span>
                    <strong>Bio:</strong>
                  </p>
                  <div className="bio-text-box">
                    {selectedDoctor.bio}
                  </div>
                </div>
                
                </div>
              </div>

              {selectedDoctor.documents && (
                <div className="documents-section">
                  <h3>📄 Verification Documents</h3>
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
                  <h3>⚖️ Review Actions</h3>
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
                  <h3>⚖️ Review Actions</h3>
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
                  <h3>⚖️ Review Actions</h3>
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
                <div className="viewer-header">
                  <h3>📄 {currentDocument?.name || 'Document Viewer'}</h3>
                  <button 
                    className="viewer-header close-btn"
                    onClick={() => {
                      setShowDocumentViewer(false);
                      if (currentDocument?.url) {
                        window.URL.revokeObjectURL(currentDocument.url);
                        setCurrentDocument(null);
                      }
                    }}
                  >
                    ×
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