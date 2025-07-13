import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';
import '../../styles/Auth.css';
import DashboardHome from './DashboardHome';
import Appointments from './Appointments';
import Patients from './Patients';
import Schedule from './Schedule';
import AddressMapSelector from '../../components/AddressMapSelector';
import CommonHeader from '../../components/CommonHeader';
import tokenService from '../../services/tokenService';
import { handleLogout } from '../../utils/logout';
import { useToast } from '../../context/ToastContext';

const menuOptions = [
  { label: 'Dashboard', id: 'dashboard' },
  { label: 'Appointments', id: 'appointments' },
  { label: 'Patients', id: 'patients' },
  { label: 'Schedule', id: 'schedule' },
];

const unverifiedMenuOptions = [
  { label: 'Dashboard', id: 'dashboard' },
];

const upcomingAppointments = [
  {
    id: 1,
    patientName: 'John Smith',
    date: '2025-05-21',
    time: '10:00 AM',
    status: 'confirmed',
    type: 'Follow-up',
    complaint: 'Persistent cough'
  },
  {
    id: 2,
    patientName: 'Emily Johnson',
    date: '2025-05-21',
    time: '11:30 AM',
    status: 'confirmed',
    type: 'New visit',
    complaint: 'Skin rash'
  },
  {
    id: 3,
    patientName: 'Michael Rodriguez',
    date: '2025-05-22',
    time: '09:15 AM',
    status: 'pending',
    type: 'Consultation',
    complaint: 'Joint pain'
  }
];

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

// Add this mapping at the top of the file, after specializationOptions:
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

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: {
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: '',
      pincode: ''
    },
    specialization: '',
    yearsOfExperience: '',
    bio: '',
    licenseNumber: ''
  });

  // Dashboard statistics
  const [stats, setStats] = useState({
    appointmentsToday: 5,
    totalPatients: 128,
    pendingRequests: 3,
    earnings: '$1,850'
  });

  const [selectedDocType, setSelectedDocType] = useState('LICENSE');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    console.log('🏥 DoctorDashboard component mounted');
    fetchProfile();
  }, []);

  // Initialize autocomplete for address2
  useEffect(() => {
    let checkGoogleMapsLoaded;
    let autocompleteInstance;

    const initializeAutocomplete = () => {
      const address2Input = document.getElementById('address2');
      if (!address2Input || !window.google || !window.google.maps || !window.google.maps.places) {
        console.log('Waiting for Google Maps API or address2 input...');
        return;
      }

      console.log('Initializing autocomplete for address2...');
      
      try {
        // Create new autocomplete instance
        autocompleteInstance = new window.google.maps.places.Autocomplete(
          address2Input,
          { 
            types: ['address'],
            componentRestrictions: { country: 'in' },
            fields: ['address_components', 'geometry', 'formatted_address']
          }
        );

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          console.log('Place selected from autocomplete:', place);
          
          if (place.geometry) {
            const newLocation = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            console.log('Setting new location from autocomplete:', newLocation);
            setSelectedLocation(newLocation);

            const addressComponents = place.address_components;
            let streetNumber = '';
            let route = '';
            let sublocality = '';
            let sublocality2 = '';
            let neighborhood = '';
            let city = '';
            let state = '';
            let pincode = '';

            for (const component of addressComponents) {
              if (component.types.includes('street_number')) {
                streetNumber = component.long_name;
              }
              if (component.types.includes('route')) {
                route = component.long_name;
              }
              if (component.types.includes('sublocality_level_1')) {
                sublocality = component.long_name;
              }
              if (component.types.includes('sublocality_level_2')) {
                sublocality2 = component.long_name;
              }
              if (component.types.includes('neighborhood')) {
                neighborhood = component.long_name;
              }
              if (component.types.includes('administrative_area_level_3')) {
                city = component.long_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
              if (component.types.includes('postal_code')) {
                pincode = component.long_name;
              }
            }

            // Construct street address from components
            const streetAddress = [streetNumber, route, sublocality, sublocality2, neighborhood]
              .filter(Boolean)
              .join(', ');

            console.log('Extracted address from autocomplete:', { streetAddress, city, state, pincode });
            
            // Update all address fields
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                // Keep the existing flat/house name
                address1: prev.address.address1,
                // Update other address fields
                address2: streetAddress,
                city: city,
                state: state,
                pincode: pincode || '' // Clear pincode if not provided
              }
            }));

            // Update pincode field state
            const pincodeInput = document.getElementById('pincode');
            if (pincodeInput) {
              // Enable pincode input only if we have address details but no pincode
              const shouldEnablePincode = !pincode && streetAddress && city && state;
              pincodeInput.disabled = !shouldEnablePincode;
            }
          } else {
            console.error('No geometry found in place:', place);
          }
        });

        // Store the instance in ref
        autocompleteRef.current = autocompleteInstance;
        console.log('Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    // Function to check if Google Maps API is loaded
    const checkGoogleMapsAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        clearInterval(checkGoogleMapsLoaded);
      }
    };

    // Start checking for Google Maps API
    checkGoogleMapsLoaded = setInterval(checkGoogleMapsAPI, 100);

    // Cleanup function
    return () => {
      clearInterval(checkGoogleMapsLoaded);
      if (autocompleteInstance) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, []);

  // Initialize map and marker
  useEffect(() => {
    if (window.google && window.google.maps && mapContainerRef.current && selectedLocation && !mapRef.current) {
      console.log('Initializing map...');
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: selectedLocation,
          zoom: 15,
          mapId: 'YOUR_MAP_ID',
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });

        // Create marker
        const marker = new window.google.maps.Marker({
          map,
          position: selectedLocation,
          draggable: true,
          animation: window.google.maps.Animation.DROP
        });

        // Add dragend listener to the marker
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          const newLocation = {
            lat: position.lat(),
            lng: position.lng()
          };
          console.log('Marker dragged to:', newLocation);

          // Create a PlacesService instance
          const placesService = new window.google.maps.places.PlacesService(map);
          
          // Create a LatLng object for the request
          const latLng = new window.google.maps.LatLng(newLocation.lat, newLocation.lng);
          
          // First, find the place ID using textSearch
          const request = {
            location: latLng,
            radius: 50, // 50 meters radius
            query: 'building' // Search for buildings/establishments
          };

          placesService.textSearch(request, (results, status) => {
            console.log('Places API textSearch status:', status);
            console.log('Places API textSearch results:', results);

            if (status === 'OK' && results && results.length > 0) {
              // Get the place ID from the first result
              const placeId = results[0].place_id;
              
              // Get detailed place information using the place ID
              const placeRequest = {
                placeId: placeId,
                fields: ['name', 'address_components', 'formatted_address', 'geometry']
              };

              placesService.getDetails(placeRequest, (place, placeStatus) => {
                console.log('Place details status:', placeStatus);
                console.log('Place details:', place);

                if (placeStatus === 'OK' && place) {
                  const addressComponents = place.address_components;
                  let streetNumber = '';
                  let route = '';
                  let sublocality = '';
                  let sublocality2 = '';
                  let neighborhood = '';
                  let city = '';
                  let state = '';
                  let pincode = '';
                  let placeName = place.name || '';

                  for (const component of addressComponents) {
                    if (component.types.includes('street_number')) {
                      streetNumber = component.long_name;
                    }
                    if (component.types.includes('route')) {
                      route = component.long_name;
                    }
                    if (component.types.includes('sublocality_level_1')) {
                      sublocality = component.long_name;
                    }
                    if (component.types.includes('sublocality_level_2')) {
                      sublocality2 = component.long_name;
                    }
                    if (component.types.includes('neighborhood')) {
                      neighborhood = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_3')) {
                      city = component.long_name;
                    }
                    if (component.types.includes('administrative_area_level_1')) {
                      state = component.long_name;
                    }
                    if (component.types.includes('postal_code')) {
                      pincode = component.long_name;
                    }
                  }

                  // Construct street address from components, including place name if available
                  const streetAddress = [placeName, streetNumber, route, sublocality, sublocality2, neighborhood]
                    .filter(Boolean)
                    .join(', ');

                  console.log('Extracted address from marker drag:', { streetAddress, city, state, pincode });
                  
                  // Update all address fields
                  setFormData(prev => ({
                    ...prev,
                    address: {
                      ...prev.address,
                      // Keep the existing flat/house name
                      address1: prev.address.address1,
                      // Update other address fields
                      address2: streetAddress,
                      city: city,
                      state: state,
                      pincode: pincode || '' // Clear pincode if not provided
                    }
                  }));

                  // Update pincode field state
                  const pincodeInput = document.getElementById('pincode');
                  if (pincodeInput) {
                    // Enable pincode input only if we have address details but no pincode
                    const shouldEnablePincode = !pincode && streetAddress && city && state;
                    pincodeInput.disabled = !shouldEnablePincode;
                  }

                  // Update the address2 input value directly to ensure it's visible
                  const address2Input = document.getElementById('address2');
                  if (address2Input) {
                    address2Input.value = streetAddress;
                  }

                  // Update selected location after getting the address details
                  setSelectedLocation(newLocation);
                } else {
                  // Fallback to Geocoder if Places API fails
                  fallbackToGeocoder(newLocation);
                }
              });
            } else {
              // Fallback to Geocoder if no places found
              fallbackToGeocoder(newLocation);
            }
          });
        });

        // Helper function for Geocoder fallback
        const fallbackToGeocoder = (location) => {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: location }, (results, status) => {
            console.log('Geocoding status:', status);
            console.log('Geocoding results:', results);
            
            if (status === 'OK' && results[0]) {
              const addressComponents = results[0].address_components;
              let streetNumber = '';
              let route = '';
              let sublocality = '';
              let sublocality2 = '';
              let neighborhood = '';
              let city = '';
              let state = '';
              let pincode = '';
              let placeName = '';

              // Try to get place name from the formatted address
              const formattedAddress = results[0].formatted_address;
              const addressParts = formattedAddress.split(',');
              if (addressParts.length > 0) {
                placeName = addressParts[0].trim();
              }

              for (const component of addressComponents) {
                if (component.types.includes('street_number')) {
                  streetNumber = component.long_name;
                }
                if (component.types.includes('route')) {
                  route = component.long_name;
                }
                if (component.types.includes('sublocality_level_1')) {
                  sublocality = component.long_name;
                }
                if (component.types.includes('sublocality_level_2')) {
                  sublocality2 = component.long_name;
                }
                if (component.types.includes('neighborhood')) {
                  neighborhood = component.long_name;
                }
                if (component.types.includes('administrative_area_level_3')) {
                  city = component.long_name;
                }
                if (component.types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                }
                if (component.types.includes('postal_code')) {
                  pincode = component.long_name;
                }
              }

              // Construct street address from components
              const streetAddress = [placeName, streetNumber, route, sublocality, sublocality2, neighborhood]
                .filter(Boolean)
                .join(', ');

              console.log('Extracted address from geocoder:', { streetAddress, city, state, pincode });
              
              // Update all address fields
              setFormData(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  // Keep the existing flat/house name
                  address1: prev.address.address1,
                  // Update other address fields
                  address2: streetAddress,
                  city: city,
                  state: state,
                  pincode: pincode || '' // Clear pincode if not provided
                }
              }));

              // Update pincode field state
              const pincodeInput = document.getElementById('pincode');
              if (pincodeInput) {
                // Enable pincode input only if we have address details but no pincode
                const shouldEnablePincode = !pincode && streetAddress && city && state;
                pincodeInput.disabled = !shouldEnablePincode;
              }

              // Update the address2 input value directly to ensure it's visible
              const address2Input = document.getElementById('address2');
              if (address2Input) {
                address2Input.value = streetAddress;
              }

              // Update selected location after getting the address details
              setSelectedLocation(location);
            } else {
              console.error('Geocoding failed:', status);
            }
          });
        };

        mapRef.current = map;
        map.marker = marker;
        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, [selectedLocation]);

  // Update marker position only when location changes from pincode search or address selection
  useEffect(() => {
    if (mapRef.current?.marker && selectedLocation) {
      mapRef.current.marker.setPosition(selectedLocation);
      mapRef.current.setCenter(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchProfile = async () => {
    try {
      console.log('📡 Fetching doctor profile...');
      
      if (!tokenService.isAuthenticated()) {
        console.log('❌ No token found, redirecting to login');
        navigate('/login');
        return;
      }

      const response = await tokenService.authenticatedFetch('/api/doctors/profile');
      console.log('📥 Profile response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      console.log('✅ Profile data received:', data);
      setProfile(data);
      setIsVerified(data.verificationStatus === 'VERIFIED');
      
      // Set form data with address information
      setFormData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        address: {
          address1: data.address?.address1 || '',
          address2: data.address?.address2 || '',
          address3: data.address?.address3 || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || ''
        },
        specialization: data.specialization || '',
        yearsOfExperience: data.yearsOfExperience ? String(data.yearsOfExperience) : '',
        bio: data.bio || '',
        licenseNumber: data.licenseNumber || ''
      });

      // Set location if available in the profile
      if (data.address?.location) {
        setSelectedLocation({
          lat: data.address.location.coordinates[1], // MongoDB stores coordinates as [longitude, latitude]
          lng: data.address.location.coordinates[0]
        });
      }

      // Load profile photo if exists
      if (data.profilePhotoId) {
        const photoResponse = await tokenService.authenticatedFetch(`/api/doctors/documents/PROFILE_PHOTO?documentId=${encodeURIComponent(data.profilePhotoId)}`);
        if (photoResponse.ok) {
          const blob = await photoResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setProfile(prev => ({ ...prev, photoUrl: imageUrl }));
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('💥 Profile fetch error:', err);
      showToast(`${err.message}`, 'error', 5000);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for years of experience
    if (name === 'yearsOfExperience') {
      const numValue = parseInt(value);
      if (numValue < 0) {
        return; // Don't update if negative
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (newAddress) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        ...newAddress
      }
    }));
  };

  const handleLocationChange = (newLocation) => {
    setSelectedLocation(newLocation);
  };

  const handlePincodeSearch = async () => {
    const pincode = formData.address.pincode;
    if (pincode && pincode.length === 6) {
      try {
        const response = await tokenService.authenticatedFetch(`/api/location/pincode/${pincode}`);
        if (response.ok) {
          const addressData = await response.json();
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              city: addressData.city || '',
              state: addressData.state || ''
            }
          }));

          // Update map location based on pincode coordinates
          if (addressData.latitude && addressData.longitude) {
            const newLocation = {
              lat: addressData.latitude,
              lng: addressData.longitude
            };
            setSelectedLocation(newLocation);
          }
        }
      } catch (error) {
        console.error('Error fetching location details:', error);
      }
    }
  };

  const handlePincodeBlur = (e) => {
    handlePincodeSearch();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataData = new FormData();
    formDataData.append('file', file);
    formDataData.append('documentType', selectedDocType);
    
    try {
      const response = await tokenService.authenticatedFetch('/api/doctors/documents', {
        method: 'POST',
        body: formDataData
      });
      if (response.ok) {
        const documentId = await response.text();
        // Update profile.documents in state
        setProfile(prev => ({
          ...prev,
          documents: {
            ...(prev.documents || {}),
            [selectedDocType]: { documentId }
          }
        }));
        
        // Show success toast
        const documentNames = {
          'LICENSE': 'Medical License',
          'QUALIFICATION': 'Qualification Certificate',
          'IDENTITY': 'Identity Document',
          'PROFILE_PHOTO': 'Profile Photo'
        };
        showToast(`${documentNames[selectedDocType] || 'Document'} uploaded successfully!`, 'success', 4000);
      } else {
        showToast('Failed to upload document', 'error', 5000);
      }
    } catch (err) {
      showToast(`Failed to upload document: ${err.message}`, 'error', 5000);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataData = new FormData();
    formDataData.append('file', file);
    formDataData.append('documentType', 'PROFILE_PHOTO');
    
    try {
      const uploadResponse = await tokenService.authenticatedFetch('/api/doctors/documents', {
        method: 'POST',
        body: formDataData
      });
      if (uploadResponse.ok) {
        const documentId = await uploadResponse.text();
        // Download the file using the documentId
        const downloadResponse = await tokenService.authenticatedFetch(`/api/doctors/documents/PROFILE_PHOTO?documentId=${encodeURIComponent(documentId)}`);
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob();
          const imageUrl = URL.createObjectURL(blob);
          setProfile(prev => ({ ...prev, photoUrl: imageUrl }));
          showToast('Profile photo uploaded successfully!', 'success', 4000);
        } else {
          showToast('Failed to download profile photo', 'error', 5000);
        }
      } else {
        showToast('Failed to upload photo', 'error', 5000);
      }
    } catch (err) {
      showToast(`Failed to upload/download photo: ${err.message}`, 'error', 5000);
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare the data with location coordinates
      const profileData = {
        ...formData,
        address: {
          ...formData.address,
          location: selectedLocation ? {
            type: 'Point',
            coordinates: [selectedLocation.lng, selectedLocation.lat] // MongoDB expects [longitude, latitude]
          } : null
        }
      };

      const response = await tokenService.authenticatedFetch('/api/doctors/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }
      showToast('Profile updated and submitted for verification. Our team will review your documents shortly.', 'success', 5000);
      fetchProfile(); // Refresh profile
    } catch (err) {
      showToast(`${err.message}`, 'error', 5000);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // If doctor is not verified, only show profile section
  if (!isVerified) {
    const getSelectedDocument = () => {
      if (!profile || !profile.documents) return null;
      return profile.documents[selectedDocType] || null;
    };

    return (
      <div>
        <CommonHeader 
          user={profile}
          activeTab={activeTab}
          onMenuClick={setActiveTab}
          onLogout={handleLogout}
          menuItems={unverifiedMenuOptions}
        />

        <main className="dashboard-main">
          <div className="verification-banner">
            <div className="verification-content">
              {profile && profile.verificationStatus === 'PENDING' && (
                <div className="verification-message">
                  <h2>Complete Your Profile Verification</h2>
                  <p>To access all features of the MediConnect platform, please complete your profile and upload your medical license and other verification documents.</p>
                </div>
              )}
              {profile && profile.verificationStatus === 'REJECTED' && (
                <div className="verification-message">
                  <h2>Profile Verification Rejected</h2>
                  <p>Your profile verification has been rejected. To reopen your profile for resubmission, please contact our customer care at <strong>+111-1111-1111</strong></p>
                </div>
              )}
              {profile && profile.verificationStatus === 'VERIFIED' && (
                <div className="verification-message">
                  <h2>Your Profile is Verified</h2>
                  <p>Your profile has been successfully verified. You now have access to all features of the MediConnect platform.</p>
                </div>
              )}
              <div className={`verification-status-indicator ${
                profile && profile.verificationStatus === 'REJECTED' ? 'rejected' : 
                profile && profile.verificationStatus === 'PENDING' ? 'pending' : 
                'verified'
              }`}>
                <span className="status-icon">
                  {profile && profile.verificationStatus === 'REJECTED' ? '❌' : 
                   profile && profile.verificationStatus === 'PENDING' ? '⏳' : 
                   '✅'}
                </span>
                <span className="status-text">
                  {profile && profile.verificationStatus === 'REJECTED' ? 'Rejected' : 
                   profile && profile.verificationStatus === 'PENDING' ? 'Verification Pending' : 
                   'Verified'}
                </span>
              </div>
            </div>
          </div>
          {profile && profile.verificationStatus === 'PENDING' && profile.statusReason && (
            <div className="status-reason-container">
              <div style={{
                background: '#fff7e6',
                color: '#b7791f',
                border: '1px solid #f6ad55',
                borderRadius: '0.2rem',
                padding: '1rem',
                fontWeight: 500
              }}>
                <span style={{ fontWeight: 700 }}>Review Note: </span>{profile.statusReason}
              </div>
            </div>
          )}
          {profile && profile.verificationStatus === 'REJECTED' && profile.statusReason && (
            <div className="status-reason-container">
              <div style={{
                background: '#fff5f5',
                color: '#c53030',
                border: '1px solid #feb2b2',
                borderRadius: '0.2rem',
                padding: '1rem',
                fontWeight: 500
              }}>
                <span style={{ fontWeight: 700 }}>Rejection Reason: </span>{profile.statusReason}
              </div>
            </div>
          )}
          <div className="profile-container">
            <div className="profile-header">
              <div className="page-title">
                <h2>Complete Your Profile</h2>
                <p>Please provide accurate information to help us verify your medical credentials</p>
              </div>
            </div>
            
    
            
            <div className="profile-content">
              <div className="profile-sections-container">
                <div className="document-section">
                  <div className="document-upload-section">
                    <h3>Verification Documents</h3>
                    <p className="upload-instruction">Please upload the following documents:</p>
                    <ul className="document-list">
                      <li>Medical License (Required)</li>
                      <li>Board Certification</li>
                      <li>Government ID</li>
                      <li>Practice Certificate</li>
                    </ul>
                    
                    <div className="document-selector-container">
                      <select
                        value={selectedDocType}
                        onChange={e => setSelectedDocType(e.target.value)}
                        className={`form-input dropdown-select document-selector ${getSelectedDocument() ? 'has-document' : ''}`}
                      >
                        <option value="">Select Document Type</option>
                        <option value="LICENSE">Medical License</option>
                        <option value="IDENTITY">Government ID</option>
                        <option value="QUALIFICATION">Qualification Certificate</option>
                      </select>
                      {getSelectedDocument() && (
                        <button
                          type="button"
                          className="document-download-btn"
                          title="Download Document"
                          onClick={async () => {
                            const token = tokenService.getToken();
                            const res = await fetch(`/api/doctors/documents/${selectedDocType}?documentId=${getSelectedDocument().documentId}`, {
                              headers: { 'Authorization': 'Bearer ' + token }
                            });
                            if (res.ok) {
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = getSelectedDocument().documentId;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            }
                          }}
                        >
                          ⬇️
                        </button>
                      )}
                    </div>
                    
                    <label className="plain-btn small sec-submit-btn">
                      <input type="file" onChange={handleFileUpload} className="hidden-input" />
                      <span>Upload Document</span>
                    </label>
                    
                    {documents.length > 0 && (
                      <div className="uploaded-documents">
                        <h4>Uploaded Documents</h4>
                        <ul className="document-items">
                          {documents.map((doc, index) => (
                            <li key={index} className="document-item">
                              <div className="document-info">
                                <span className="document-icon">📄</span>
                                <span className="document-name">{doc.name}</span>
                              </div>
                              <button 
                                className="remove-document" 
                                onClick={() => handleRemoveDocument(index)}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="profile-image-section">
                  <div className="profile-image-container">
                    <img src={profile && profile.photoUrl && profile.photoUrl.trim() !== '' ? profile.photoUrl : '/default-profile.png'} alt="Doctor profile" className="profile-image" />
                    <div className="profile-image-overlay">
                      <span className="upload-icon">📷</span>
                    </div>
                  </div>
                  <label className="plain-btn small sec-submit-btn">
                    <input type="file" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    <span>Upload Photo</span>
                  </label>
                </div>
              </div>
              
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      className="form-input"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      className="form-input"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="address-section">
                  <AddressMapSelector
                    initialLocation={selectedLocation}
                    onAddressChange={handleAddressChange}
                    onLocationChange={handleLocationChange}
                    address1={formData.address.address1}
                    address2={formData.address.address2}
                    address3={formData.address.address3}
                    city={formData.address.city}
                    state={formData.address.state}
                    pincode={formData.address.pincode}
                    disabled={profile?.verificationStatus === 'VERIFIED'}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="specialization">Specialization</label>
                    <select
                      id="specialization"
                      name="specialization"
                      className="form-input dropdown-select"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                    >
                      {specializationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value && specializationIcons[option.value] ? specializationIcons[option.value] + ' ' : ''}{option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="yearsOfExperience">Years of Experience</label>
                    <input
                      type="number"
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      className="form-input"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="licenseNumber">License Number</label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    className="form-input"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="bio">Professional Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell patients about your background, expertise, and approach to patient care"
                    required
                  />
                  <div className="disclaimer">This will be displayed on your public profile to help patients learn about you</div>
                </div>

                <div className="form-actions">
                  {profile && profile.verificationStatus !== 'REJECTED' && (
                    <button type="submit" className="plain-btn submit">
                      Submit for Verification
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Regular dashboard for verified doctors
  return (
    <div>
      <CommonHeader 
        user={profile}
        activeTab={activeTab}
        onMenuClick={setActiveTab}
        onLogout={handleLogout}
        menuItems={menuOptions}
      />
        {activeTab === 'dashboard' && <DashboardHome stats={stats} upcomingAppointments={upcomingAppointments} formatDate={formatDate} />}
        {activeTab === 'appointments' && <Appointments />}
        {activeTab === 'patients' && <Patients />}
        {activeTab === 'schedule' && <Schedule />}
    </div>
  );
};

export default DoctorDashboard;