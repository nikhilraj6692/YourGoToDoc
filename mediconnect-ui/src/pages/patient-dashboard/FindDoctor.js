import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FindDoctor.css';
import '../../styles/Auth.css';
import '../../styles/Common.css';
import { useUser } from '../../context/UserContext';
import BookingModal from '../../components/BookingModal';
import LoginModal from '../../components/LoginModal';
import InfiniteScroll from '../../components/InfiniteScroll';
import Toast from '../../components/Toast';
import { useToast } from '../../context/ToastContext';
import HomeHeader from '../../components/HomeHeader';
import tokenService from '../../services/tokenService';
import { handleLogout } from '../../utils/logout';

// Minimal Header Component - only logo and logo text
const MinimalHeader = () => {
  return (
    <div className="common-header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
      </div>
    </div>
  );
};

// Common Header Component for authenticated patients
const CommonHeader = ({ user, activeMenuItem, onMenuClick, onLogout, menuItems }) => {
  return (
    <div className="common-header">
      <div className="header-container">
        <div className="header-logo">
          <span className="logo-icon">⚕️</span>
          <span className="logo-text">MediConnect</span>
        </div>
        
        <div className="header-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
              onClick={() => onMenuClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="header-right">
          <div className="user-profile-mini">
            <div className="user-info">
              <span className="user-greeting">Hello, {user?.name?.split(' ')[0]}</span>
              <span className="user-account">Manage your account</span>
            </div>
          </div>
          <button className="plain-btn logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// Using HomeHeader component for unauthenticated users

// Specialization options for dropdown
const specializationOptions = [
  { value: '', label: 'Select Specialization' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Ophthalmology', label: 'Ophthalmology' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'Gynecology', label: 'Gynecology' },
  { value: 'Internal Medicine', label: 'Internal Medicine' },
  { value: 'Family Medicine', label: 'Family Medicine' },
];

const specializationIcons = {
  Dermatology: '🧴',
  Cardiology: '❤️',
  Neurology: '🧠',
  Pediatrics: '👶',
  Orthopedics: '🦴',
  Ophthalmology: '👁️',
  Psychiatry: '🧑‍⚕️',
  Gynecology: '🤰',
  'Internal Medicine': '💊',
  'Family Medicine': '👨‍👩‍👧‍👦',
};

const getAvatarTheme = (fullName) => {
  const themes = ['theme-green', 'theme-purple', 'theme-pink', 'theme-orange', 'theme-teal', 'theme-indigo', 'theme-cyan'];
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = ((hash << 5) - hash) + fullName.charCodeAt(i);
    hash = hash & hash;
  }
  return themes[Math.abs(hash) % themes.length];
};

const FindDoctor = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('location');
  const [loading, setLoading] = useState(false);
  // Removed error state - using toast notifications instead
  const [locationError, setLocationError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  
  // Pagination states
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const PAGE_SIZE = 10;

  // Refs
  const cityInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Login modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Load more doctors (scroll down)
  const loadMoreDoctors = useCallback(async (page) => {
    console.log('🔄 loadMoreDoctors called - loadingMore:', loadingMore, 'hasMore:', hasMore, 'page:', page);
    
    if (loadingMore || !hasMore) {
      console.log('🛑 loadMoreDoctors blocked - loadingMore:', loadingMore, 'hasMore:', hasMore);
      return;
    }
    
    console.log('✅ loadMoreDoctors starting - setting loadingMore to true');
    setLoadingMore(true);
    
    try {
      const expectedPage = Math.floor(doctors.length / PAGE_SIZE);
      const pageToLoad = (page === expectedPage) ? page : expectedPage;
      
      if (page !== expectedPage) {
        console.warn('Page mismatch - expected:', expectedPage, 'got:', page, 'using:', pageToLoad);
      }
    
      console.log('📡 Fetching doctors page:', pageToLoad);
      const result = await fetchDoctorsPage(pageToLoad);
      
      if (result && result.doctors && result.doctors.length > 0) {
        console.log('✅ loadMoreDoctors success - got', result.doctors.length, 'doctors');
        setDoctors(prev => [...prev, ...result.doctors]);
        const newHasMore = result.doctors.length === PAGE_SIZE;
        setHasMore(newHasMore);
      } else {
        console.log('📭 loadMoreDoctors - no more doctors');
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error loading more doctors:', err);
      showToast('Error during operation. Please try after some time', 'error');
    } finally {
      console.log('🏁 loadMoreDoctors finished - setting loadingMore to false');
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, doctors.length]);

  // Search params for each tab
  const [locationSearchParams, setLocationSearchParams] = useState({
    radius: 10,
    specialty: '',
    currentLocation: null
  });

  const [pincodeSearchParams, setPincodeSearchParams] = useState({
    pincode: '',
    radius: 10,
    specialty: ''
  });

  const [citySearchParams, setCitySearchParams] = useState({
    city: '',
    state: '',
    specialty: ''
  });

  // Previous search params tracking
  const [prevLocationParams, setPrevLocationParams] = useState(null);
  const [prevPincodeParams, setPrevPincodeParams] = useState(null);
  const [prevCityParams, setPrevCityParams] = useState(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let initializationAttempts = 0;
    const maxAttempts = 10;

    const initializeAutocomplete = () => {
      if (!cityInputRef.current) {
        if (initializationAttempts < maxAttempts) {
          initializationAttempts++;
          setTimeout(initializeAutocomplete, 500); // Retry after 500ms
        }
        return;
      }

      if (!window.google || !window.google.maps || !window.google.maps.places) {
        return;
      }

      try {
        // Clear any existing autocomplete instance
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(cityInputRef.current, {
          types: ['(cities)'],
          fields: ['address_components', 'formatted_address', 'geometry'],
          componentRestrictions: { country: 'in' }
        });


        // Prevent form submission on enter
        cityInputRef.current.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place.geometry) {
            const cityComponent = place.address_components.find(
              component => component.types.includes('locality')
            );
            const stateComponent = place.address_components.find(
              component => component.types.includes('administrative_area_level_1')
            );
            
            if (cityComponent) {
              const cityName = cityComponent.long_name;
              const stateName = stateComponent ? stateComponent.long_name : '';
              const formattedLocation = stateName ? `${cityName}, ${stateName}` : cityName;
              
              
              // Update the input field with formatted location
              if (cityInputRef.current) {
                cityInputRef.current.value = formattedLocation;
              }
              
              setCitySearchParams(prev => ({ 
                ...prev, 
                city: cityName,
                state: stateName
              }));
              
              // Trigger search after setting the city and state
              searchDoctorsByCity();
            }
          }
        });

      } catch (error) {
        console.error('Error creating autocomplete:', error);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
    } else {
      // If not loaded, wait for it
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initializeAutocomplete();
          clearInterval(checkGoogleMaps);
        }
      }, 100);

      // Cleanup interval after 10 seconds if Google Maps doesn't load
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
      }, 10000);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [activeTab]); // Add activeTab as a dependency to reinitialize when tab changes

  // Handle city input changes
  const handleCityInputChange = (e) => {
    const value = e.target.value;
    // Don't update the input value directly, let Google Places handle it
    setCitySearchParams(prev => ({ ...prev, city: value }));
  };

  // Helper function to build query params for current search
  const buildQueryParams = (page, locationOverride = null) => {
    if (activeTab === 'location' && (userLocation || locationOverride)) {
      const location = locationOverride || userLocation;
      return new URLSearchParams({
        latitude: location.lat,
        longitude: location.lng,
        radius: locationSearchParams.radius,
        specialization: locationSearchParams.specialty || '',
        page: page,
        size: PAGE_SIZE
      });
    } else if (activeTab === 'pincode' && pincodeSearchParams.pincode) {
      return new URLSearchParams({
        pincode: pincodeSearchParams.pincode,
        radius: pincodeSearchParams.radius,
        specialization: pincodeSearchParams.specialty || '',
        page: page,
        size: PAGE_SIZE
      });
    } else if (activeTab === 'city' && citySearchParams.city) {
      return new URLSearchParams({
        city: citySearchParams.city,
        state: citySearchParams.state || '',
        specialization: citySearchParams.specialty || '',
        page: page,
        size: PAGE_SIZE
      });
    }
    
    return null;
  };

  // Generic function to fetch doctors for a specific page
  const fetchDoctorsPage = async (page, locationOverride = null) => {
    const queryParams = buildQueryParams(page, locationOverride);
    
    if (!queryParams) {
      return null;
    }

    const response = await fetch(`/api/doctors/search?${queryParams}`, {
      credentials: 'omit' // Don't send cookies/session data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch doctors');
    }

    const data = await response.json();
    
    // Return both content and pagination info
    const result = {
      doctors: data.content || [],
      totalPages: data.totalPages || 0,
      currentPage: data.number || 0,
      totalElements: data.totalElements || 0,
      isLast: data.last || false,
      isFirst: data.first || false
    };
    
    return result;
  };

  // Reset pagination and state for new search
  const resetPagination = () => {
    setHasMore(true);
    setDoctors([]);
  };

  // Initial search function for location
  const getCurrentLocation = () => {
    console.log('📍 getCurrentLocation called');
    
    const currentParams = {
      radius: locationSearchParams.radius,
      specialty: locationSearchParams.specialty
    };
    
    console.log('📍 Current params:', currentParams);
    console.log('📍 Previous params:', prevLocationParams);
    console.log('📍 User location:', userLocation);
    
    // Only skip if we have previous params AND they match AND we have location
    if (prevLocationParams && 
        prevLocationParams.radius === currentParams.radius && 
        prevLocationParams.specialty === currentParams.specialty &&
        userLocation && locationSearchParams.currentLocation) {
      console.log('🛑 getCurrentLocation skipped - same params');
      return;
    }

    console.log('✅ getCurrentLocation starting - setting loading to true');
    setLoading(true);
    resetPagination();
    
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser', 'error');
      setLoading(false);
      return;
    }

    const handleLocationSuccess = async (position) => {
      console.log('📍 Got position:', position.coords);
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserLocation(location);
      setLocationSearchParams(prev => ({ ...prev, currentLocation: location }));
                  
      try {
        console.log('📡 Making API call with location:', location);
        const initialResult = await fetchDoctorsPage(0, location);
        console.log('📡 Initial API result:', initialResult);
        
        if (initialResult && initialResult.doctors) {
          console.log('✅ Setting doctors:', initialResult.doctors.length, 'doctors');
          setDoctors(initialResult.doctors);
          setPrevLocationParams(currentParams);
          console.log('✅ Successfully set initial data');
        } else {
          console.log('📭 No doctors in initial result or result is null');
        }
      } catch (err) {
        console.error('❌ Error searching doctors:', err);
        showToast('Failed to search doctors. Please try again.', 'error');
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    const handleLocationError = (error) => {
      console.error('Geolocation error:', error);
      
      let errorMessage = 'Unable to get your location. ';
      
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage += 'Location access denied. Please enable location access in your browser settings or use pincode/city search.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage += 'Location services unavailable. This might be due to poor GPS signal, network issues, or location services being disabled. Please try pincode or city search instead.';
          break;
        case 3: // TIMEOUT
          errorMessage += 'Location request timed out. Please try again or use pincode/city search.';
          break;
        default:
          errorMessage += 'Please try pincode or city search instead.';
      }
      
      showToast(errorMessage, 'error');
      setLocationError(errorMessage);
      setLoading(false);
    };

    const tryHighAccuracy = () => {
      console.log('Trying high accuracy location...');
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        (error) => {
          console.log('High accuracy failed, trying low accuracy...', error);
          if (error.code === 1) {
            // Permission denied - don't try low accuracy
            handleLocationError(error);
          } else {
            // For other errors (timeout, unavailable), try low accuracy
            tryLowAccuracy();
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout
          maximumAge: 60000
        }
      );
    };

    const tryLowAccuracy = () => {
      console.log('Trying low accuracy location...');
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        (error) => {
          console.log('Low accuracy also failed:', error);
          handleLocationError(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000, // Increased timeout for low accuracy
          maximumAge: 300000
        }
      );
    };

    navigator.permissions.query({ name: 'geolocation' }).then(function(permissionStatus) {
      console.log('Permission status:', permissionStatus.state);
      if (permissionStatus.state === 'denied') {
        showToast('Location access denied by user. Please enable location access in your browser settings or use pincode search.', 'error');
        setLoading(false);
        return;
      }
      tryHighAccuracy();
    }).catch(() => {
      console.log('Permissions API not supported, trying location directly...');
      tryHighAccuracy();
    });
  };

  // Search by pincode
  const searchDoctorsByPincode = async () => {
    const currentParams = {
      pincode: pincodeSearchParams.pincode,
      radius: pincodeSearchParams.radius,
      specialty: pincodeSearchParams.specialty
    };
    
    if (prevPincodeParams && 
        prevPincodeParams.pincode === currentParams.pincode && 
        prevPincodeParams.radius === currentParams.radius && 
        prevPincodeParams.specialty === currentParams.specialty) {
      return;
    }

    setLoading(true);
    resetPagination();

    if (!pincodeSearchParams.pincode) {
      showToast('Please enter a pincode', 'error');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(pincodeSearchParams.pincode)) {
      showToast('Please enter a valid 6-digit pincode', 'error');
      setLoading(false);
      return;
    }

    try {
      const initialResult = await fetchDoctorsPage(0);
      
      if (initialResult && initialResult.doctors) {
        setDoctors(initialResult.doctors);
        setHasMore(initialResult.doctors.length === PAGE_SIZE);
        setPrevPincodeParams(currentParams);
      }
    } catch (err) {
      console.error('Error searching doctors by pincode:', err);
      showToast('Error during operation. Please try after some time', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Search by city
  const searchDoctorsByCity = async () => {
    const currentParams = {
      city: citySearchParams.city,
      state: citySearchParams.state,
      specialty: citySearchParams.specialty
    };
    
    if (prevCityParams && 
        prevCityParams.city === currentParams.city && 
        prevCityParams.state === currentParams.state &&
        prevCityParams.specialty === currentParams.specialty) {
      return;
    }

    setLoading(true);
    resetPagination();

    if (!citySearchParams.city) {
      showToast('Please enter a city', 'error');
      setLoading(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        city: citySearchParams.city,
        state: citySearchParams.state || '',
        specialization: citySearchParams.specialty || '',
        page: 0,
        size: PAGE_SIZE
      });

      const response = await fetch(`/api/doctors/search?${queryParams}`, {
        credentials: 'omit' // Don't send cookies/session data
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      
      if (data && data.content) {
        setDoctors(data.content);
        setHasMore(data.content.length === PAGE_SIZE);
        setPrevCityParams(currentParams);
      } else {
        showToast('No doctors found in this area', 'error');
      }
    } catch (err) {
      console.error('Error searching doctors by city:', err);
      showToast('Error during operation. Please try after some time', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setDoctors([]);
    // Removed setError(null);
    setLocationError(null);
    setPrevLocationParams(null);
    setPrevPincodeParams(null);
    setPrevCityParams(null);
    resetPagination();
    
    // Reset search parameters for each tab
    setLocationSearchParams({
      radius: 10,
      specialty: '',
      currentLocation: null
    });
    setPincodeSearchParams({
      pincode: '',
      radius: 10,
      specialty: ''
    });
    setCitySearchParams({
      city: '',
      state: '',
      specialty: ''
    });
    
    // Reset loading states
    setLoading(false);
    
    // Clear user location for location tab
    if (tab !== 'location') {
      setUserLocation(null);
    }
  };

  // Menu navigation
  const handleMenuClick = (menuId) => {
    
    switch (menuId) {
      case 'dashboard':
        window.location.href = '/patient/dashboard';
        break;
      case 'appointments':
        window.location.href = '/patient/appointments';
        break;
      case 'records':
        window.location.href = '/patient/records';
        break;
      case 'prescriptions':
        window.location.href = '/patient/prescriptions';
        break;
      case 'billing':
        window.location.href = '/patient/billing';
        break;
      default:
        break;
    }
  };

  // Booking modal functions
  const handleOpenBookingModal = (doctor) => {
    console.log('🎯 handleOpenBookingModal called for doctor:', doctor.fullName);
    console.log('🎯 User auth status:', { isAuthenticated: tokenService.isAuthenticated(), userRole: user?.role });
    
    // Check if user is authenticated and is a PATIENT
    if (!tokenService.isAuthenticated() || user?.role !== 'PATIENT') {
      console.log('🎯 User not authenticated or not PATIENT, showing login modal');
      // Store the doctor for later booking
      const doctorWithId = {
        ...doctor,
        id: doctor._id || doctor.id
      };
      setSelectedDoctor(doctorWithId);
      
      // Show login modal with callback to open booking modal after login
      setLoginModalOpen(true);
      return;
    }
    
    console.log('🎯 User authenticated and is PATIENT, opening booking modal directly');
    const doctorWithId = {
      ...doctor,
      id: doctor._id || doctor.id
    };
    setSelectedDoctor(doctorWithId);
    setBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setBookingModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleLoginSuccess = () => {
    // After successful login, open the booking modal if a doctor is selected
    console.log('🎯 Login success callback - selectedDoctor:', selectedDoctor);
    if (selectedDoctor) {
      console.log('🎯 Opening booking modal for doctor:', selectedDoctor.fullName);
      setBookingModalOpen(true);
    }
  };

  const handleBookAppointment = (date, slot, appointmentData) => {
    handleCloseBookingModal();
    showToast('Appointment requested successfully! The doctor will confirm your appointment shortly.', 'success');
  };

  const handleViewProfile = (doctorId) => {
    window.location.href = `/doctor/profile/${doctorId}`;
  };

  const handleCallDoctor = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Utility functions
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="rating-stars">
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  };

  const formatFee = (fee) => {
    return `₹${fee}`;
  };

  const userInfo = {
    name: user?.name,
    role: user?.role
  };

  const renderDoctorCard = (doctor) => (
    <div key={`${doctor._id || doctor.id}`} data-doctor-id={doctor._id || doctor.id}>
      <div className="doctor-info">
        <div className="doctor-info-header">
          {/* Avatar */}
          <div className={`doctor-avatar ${getAvatarTheme(doctor.fullName)}`}>
            {doctor.profilePhotoId ? (
              <img 
                src={`/api/documents/${doctor.profilePhotoId}`} 
                alt={`Dr. ${doctor.fullName}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="avatar-initials" 
              style={{ display: doctor.profilePhotoId ? 'none' : 'flex' }}
            >
              {doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
          
          {/* Doctor Details */}
          <div className="doctor-details">
            <h3 className="doctor-name">
              {doctor.fullName.toLowerCase().startsWith('dr') ? doctor.fullName : `Dr. ${doctor.fullName}`}
            </h3>
            <p className="doctor-specialty">{doctor.specialization}</p>
            <p className="doctor-experience">{doctor.yearsOfExperience} years experience overall</p>
            {doctor.distance && <p className="doctor-location">{formatDistance(doctor.distance)}</p>}
            <p className="consultation-fee">₹{doctor.consultationFee} Consultation fee</p>
            
            {/* Rating */}
            <div className="doctor-rating">
              <span className="rating-percentage">👍 {Math.round((doctor.rating || 4.5) * 20)}%</span>
              <span className="patient-stories">{doctor.reviewCount || 0} Patient Stories</span>
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="doctor-actions-right">
            <div className={`availability-status ${doctor.availableSlots && doctor.availableSlots > 0 ? 'available' : 'booked'}`}>
              {doctor.availableSlots && doctor.availableSlots > 0 ? 
              '🟢 ' + doctor.availableSlots + ' slots available' : '🔴 All slots booked today'}
            </div>
            <button 
              className="plain-btn plain-btn sec-submit-btn"
              onClick={() => handleOpenBookingModal(doctor)}
            >
              Book Online Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Extract existing search forms into functions
  const renderLocationSearchForm = () => (
    <div className="search-form location-search">
      <div className="search-form-row">
        <div className="form-group">
          <label htmlFor="specialty">Specialty (Optional)</label>
          <select
            id="specialty"
            value={locationSearchParams.specialty}
            onChange={(e) => setLocationSearchParams(prev => ({ ...prev, specialty: e.target.value }))}
            className="dropdown-select"
          >
            {specializationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value && specializationIcons[option.value] ? specializationIcons[option.value] + ' ' : ''}{option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group radius-group">
          <label>Search Radius: {locationSearchParams.radius} km</label>
          <div className="radius-slider-container">
            <input
              type="range"
              min="5"
              max="200"
              value={locationSearchParams.radius}
              onChange={(e) => setLocationSearchParams(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="radius-slider"
            />
            <div className="radius-marks">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        className="plain-btn submit"
        onClick={getCurrentLocation}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Find Doctors Near Me'}
      </button>
      
      
    </div>
  );

  const renderPincodeSearchForm = () => (
    <div className="search-form location-search">
      <div className="search-form-row">
        <div className="form-group">
          <label htmlFor="pincode">Pincode</label>
          <input 
            type="text"
            id="pincode"
            className="form-input"
            placeholder="Enter pincode (e.g., 800001)"
            value={pincodeSearchParams.pincode}
            onChange={(e) => setPincodeSearchParams(prev => ({ ...prev, pincode: e.target.value }))}
            maxLength={6}
          />
          {/* Removed error display - using toast notifications instead */}
        </div>

        <div className="form-group">
          <label htmlFor="searchRadius">Search Radius: {pincodeSearchParams.radius} km</label>
          <div className="radius-slider-container">
            <input
              type="range"
              min="5"
              max="200"
              value={pincodeSearchParams.radius}
              onChange={(e) => setPincodeSearchParams(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="radius-slider"
            />
            <div className="radius-marks">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="specialty">Specialty (Optional)</label>
          <select
            id="specialty"
            value={pincodeSearchParams.specialty}
            onChange={(e) => setPincodeSearchParams(prev => ({ ...prev, specialty: e.target.value }))}
            className="dropdown-select"
          >
            {specializationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value && specializationIcons[option.value] ? specializationIcons[option.value] + ' ' : ''}{option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        className="plain-btn submit"
        onClick={searchDoctorsByPincode}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Find Doctors'}
      </button>
    </div>
  );

  const renderCitySearchForm = () => (
    <div className="search-form location-search">
      <div className="search-form-row">
        <div className="form-group city-search-group">
          <label htmlFor="city">City</label>
          <div className="city-input-container">
            <input 
              ref={cityInputRef}
              type="text"
              id="city"
              className="form-input"
              placeholder="Type to see suggestions (e.g., Mumbai, Maharashtra)"
              onChange={handleCityInputChange}
              autoComplete="off"
            />
          </div>
        </div>


        <div className="form-group">
          <label htmlFor="specialty">Specialty (Optional)</label>
          <select
            id="specialty"
            value={citySearchParams.specialty}
            onChange={(e) => setCitySearchParams(prev => ({ ...prev, specialty: e.target.value }))}
            className="dropdown-select"
          >
            {specializationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value && specializationIcons[option.value] ? specializationIcons[option.value] + ' ' : ''}{option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        className="plain-btn submit"
        onClick={searchDoctorsByCity}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Find Doctors'}
      </button>
    </div>
  );

  // Update the tab content rendering to remove doctor search
  const renderTabContent = () => {
    switch (activeTab) {
      case 'location':
        return renderLocationSearchForm();
      case 'pincode':
        return renderPincodeSearchForm();
      case 'city':
        return renderCitySearchForm();
      default:
        return null;
    }
  };

  // Check if user is authenticated and is a patient
  const isAuthenticatedPatient = !!user && user.role === 'PATIENT';
  
  // Debug logging for header condition
  console.log('🔍 Header Debug - user:', user, 'isAuthenticatedPatient:', isAuthenticatedPatient);

  return (
    <div>
      {/* Conditional Header */}
      {isAuthenticatedPatient ? (
        <CommonHeader 
          user={user}
          activeMenuItem="doctors"
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          menuItems={[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'appointments', label: 'Appointments' },
            { id: 'billing', label: 'Billing' }
          ]}
        />
      ) : (
        <MinimalHeader />
      )}

      <div className="find-doctor-container">
        {/* Page Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Find Your Perfect Doctor</h2>
            <p className="section-subtitle">Connect with qualified, verified healthcare professionals near you and get the care you deserve</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          {/* Search Tabs */}
          <div className="search-tabs">
            <button 
              className={`search-tab ${activeTab === 'location' ? 'active' : ''}`}
              onClick={() => handleTabChange('location')}
            >
              Search by Current Location
            </button>
            <button 
              className={`search-tab ${activeTab === 'pincode' ? 'active' : ''}`}
              onClick={() => handleTabChange('pincode')}
            >
              Search by Pincode
            </button>
            <button 
              className={`search-tab ${activeTab === 'city' ? 'active' : ''}`}
              onClick={() => handleTabChange('city')}
            >
              Search by City
            </button>
          </div>

          {renderTabContent()}

          {/* Location Error */}
          {locationError && (
            <div className="error-container">
              <div className="error-message">{locationError}</div>
              <button className="plain-btn remove" onClick={getCurrentLocation}>
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Debug logging */}
        {console.log('🎨 RENDER - loading:', loading, 'loadingMore:', loadingMore, 'doctors.length:', doctors.length, 'hasMore:', hasMore)}

        {/* Main Loading State - Prominent Position */}
        {loading && (
          <>
            {console.log('🎨 RENDERING main loader')}
            <div className="main-loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <div className="loading-text">Searching for doctors...</div>
            </div>
          </>
        )}

        {/* Results Section - Only show when not loading */}
        {!loading && (
          <>
            {console.log('🎨 RENDERING results section')}
            <div className="results-section">
              {/* Results Content */}
              {doctors.length > 0 && (
                <>
                  {console.log('🎨 RENDERING doctors list with InfiniteScroll')}
                  {/* Results Header */}
                  <div className="results-header">
                    
                  </div>

                  <InfiniteScroll
                    items={doctors}
                    hasMore={hasMore && doctors.length >= PAGE_SIZE}
                    loading={loadingMore && !loading}
                    onLoadMore={loadMoreDoctors}
                    renderItem={renderDoctorCard}
                    className="doctors-list"
                    pageSize={PAGE_SIZE}
                  />
                </>
              )}

              {/* Initial State - No search performed */}
              {!locationSearchParams.currentLocation && !pincodeSearchParams.pincode && !citySearchParams.city && !locationError && (
                <>
                  {console.log('🎨 RENDERING empty state')}
                  <div className="empty-state">
                    <div className="empty-title">Ready to Find Your Doctor?</div>
                    <div className="empty-message">
                      Use the search options above to find qualified healthcare professionals in your area.
                    </div>
                    <div className="empty-suggestion">
                      • Enter your pincode for area-specific search<br/>
                      • Filter by medical specialty for targeted results<br/>
                      • Allow location access for nearby doctors<br/>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <BookingModal
        open={bookingModalOpen}
        onClose={handleCloseBookingModal}
        doctor={selectedDoctor}
        onBook={handleBookAppointment}
      />

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        userType="PATIENT"
        redirectUrl="/patient/find-doctor"
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default FindDoctor;