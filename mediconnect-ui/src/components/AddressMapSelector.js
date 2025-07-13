import React, { useState, useEffect, useRef } from 'react';
import './AddressMapSelector.css';

const AddressMapSelector = ({ 
  initialLocation,
  onAddressChange,
  onLocationChange,
  address1,
  address2,
  address3,
  city,
  state,
  pincode,
  disabled = false
}) => {
  
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [localAddress1, setLocalAddress1] = useState(address1);
  const [localAddress2, setLocalAddress2] = useState(address2);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [addressUpdateCount, setAddressUpdateCount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isPincodeFromPlace, setIsPincodeFromPlace] = useState(false);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideAddress, setOverrideAddress] = useState(address3 || '');

  // Update local states when props change
  useEffect(() => {
    setLocalAddress1(address1);
  }, [address1]);

  useEffect(() => {
    setLocalAddress2(address2);
  }, [address2]);

  useEffect(() => {
    setOverrideAddress(address3 || '');
  }, [address3]);

  // Helper function to extract address components
  const extractAddressFromPlace = (place) => {
    if (!place || !place.address_components) {
      return {
        streetAddress: '',
        city: '',
        state: '',
        pincode: ''
      };
    }

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
      const types = component.types;
      const longName = component.long_name;

      if (types.includes('street_number')) {
        streetNumber = longName;
      }
      if (types.includes('route')) {
        route = longName;
      }
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        sublocality = longName;
      }
      if (types.includes('sublocality_level_2')) {
        sublocality2 = longName;
      }
      if (types.includes('neighborhood')) {
        neighborhood = longName;
      }
      
      // Multiple ways to get city - prioritize locality
      if (types.includes('locality')) {
        city = longName;
      } else if (types.includes('administrative_area_level_3')) {
        city = city || longName;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = longName;
      }
      
      // Get state
      if (types.includes('administrative_area_level_1')) {
        state = longName;
      }
      
      // Get pincode
      if (types.includes('postal_code')) {
        pincode = longName;
      }
    }

    // Build street address with all components in a single format
    const addressParts = [];
    
    // Add place name if available
    if (placeName) {
      addressParts.push(placeName);
    }
    
    // Add route if available and doesn't match place name
    if (route && route !== placeName) {
      if (streetNumber) {
        addressParts.push(`${streetNumber} ${route}`);
      } else {
        addressParts.push(route);
      }
    }
    
    // Add sublocality components in order if they don't match place name
    if (sublocality2 && sublocality2 !== placeName) {
      addressParts.push(sublocality2);
    }
    if (sublocality && sublocality !== placeName) {
      addressParts.push(sublocality);
    }

    // Add neighborhood if available and doesn't match place name
    if (neighborhood && neighborhood !== placeName) {
      addressParts.push(neighborhood);
    }

    // If no parts were added, use a fallback
    if (addressParts.length === 0) {
      const formattedAddress = place.formatted_address;
      if (formattedAddress) {
        const parts = formattedAddress.split(',');
        if (parts.length > 0) {
          const firstPart = parts[0].trim();
          if (!/^\d+$/.test(firstPart) && 
              !firstPart.includes('Unnamed') && 
              !firstPart.includes('+') &&
              firstPart.length > 0 &&
              firstPart !== placeName) {
            addressParts.push(firstPart);
          }
        }
      }
      if (addressParts.length === 0) {
        addressParts.push('Unnamed Location');
      }
    }

    const streetAddress = addressParts.join(', ');

    const result = {
      streetAddress,
      city,
      state,
      pincode
    };

    return result;
  };

  // Initialize autocomplete for address2
  useEffect(() => {
    const initializeAutocomplete = () => {
      const address2Input = document.getElementById('address2');
      if (!address2Input || !window.google || !window.google.maps || !window.google.maps.places) {
        return;
      }

      try {
        // Clear any existing autocomplete instance
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          address2Input,
          { 
            types: ['address'],
            componentRestrictions: { country: 'in' },
            fields: ['address_components', 'geometry', 'formatted_address', 'name']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.geometry) {
            return;
          }

          // Update location
          const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          setSelectedLocation(newLocation);
          onLocationChange?.(newLocation);

          // Extract and update address
          const addressData = extractAddressFromPlace(place);
          setIsPincodeFromPlace(true);

          const updatedAddress = {
            address1,
            address2: addressData.streetAddress,
            city: addressData.city,
            state: addressData.state,
            pincode: addressData.pincode || ''
          };

          onAddressChange?.(updatedAddress);
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    // Check for Google Maps API
    const checkGoogleMapsAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        clearInterval(checkGoogleMapsLoaded);
      }
    };

    const checkGoogleMapsLoaded = setInterval(checkGoogleMapsAPI, 100);

    return () => {
      clearInterval(checkGoogleMapsLoaded);
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [address1, onAddressChange, onLocationChange]);

  // Simple function to get address from coordinates using only Geocoding API
  const getAddressFromCoordinates = async (location) => {
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: location }, (results, status) => {
        
        if (status === 'OK' && results && results.length > 0) {
          // Try to find the most specific address
          let bestResult = results[0];
          
          // Look for more specific results first
          for (const result of results) {
            if (result.types.includes('street_address') || 
                result.types.includes('premise') ||
                result.types.includes('establishment')) {
              bestResult = result;
              break;
            }
          }

          const addressData = extractAddressFromGeocoderResult(bestResult);
          resolve(addressData);
        } else {
          console.error('Geocoding failed:', status);
          resolve({
            streetAddress: 'Location',
            city: '',
            state: '',
            pincode: ''
          });
        }
      });
    });
  };

  // Extract address from geocoder result
  const extractAddressFromGeocoderResult = (result) => {
    const addressComponents = result.address_components || [];
    let streetNumber = '';
    let route = '';
    let sublocality = '';
    let sublocality2 = '';
    let neighborhood = '';
    let city = '';
    let state = '';
    let pincode = '';

    // Extract meaningful place name from formatted address
    let placeName = '';
    const formattedAddress = result.formatted_address;
    if (formattedAddress) {
      const addressParts = formattedAddress.split(',');
      if (addressParts.length > 0) {
        const firstPart = addressParts[0].trim();
        // Only use as place name if it's not just a number or coordinates
        if (!/^\d+$/.test(firstPart) && 
            !firstPart.includes('Unnamed') && 
            !firstPart.includes('+') &&
            firstPart.length > 0) {
          placeName = firstPart;
        }
      }
    }

    for (const component of addressComponents) {
      const types = component.types;
      const longName = component.long_name;
      const shortName = component.short_name;

      if (types.includes('street_number')) {
        streetNumber = longName;
      }
      if (types.includes('route')) {
        route = longName;
      }
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        sublocality = longName;
      }
      if (types.includes('sublocality_level_2')) {
        sublocality2 = longName;
      }
      if (types.includes('neighborhood')) {
        neighborhood = longName;
      }
      
      // Multiple ways to get city - prioritize locality
      if (types.includes('locality')) {
        city = longName;
      } else if (types.includes('administrative_area_level_3')) {
        city = city || longName; // Only use if city not already set
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = longName; // Use as fallback
      }
      
      // Get state
      if (types.includes('administrative_area_level_1')) {
        state = longName;
      }
      
      // Get pincode
      if (types.includes('postal_code')) {
        pincode = longName;
      }
    }

    // Build street address with all components in a single format
    const addressParts = [];
    
    // Add place name if available
    if (placeName) {
      addressParts.push(placeName);
    }
    
    // Add route if available and doesn't match place name
    if (route && route !== placeName) {
      if (streetNumber) {
        addressParts.push(`${streetNumber} ${route}`);
      } else {
        addressParts.push(route);
      }
    }
    
    // Add neighborhood if available
    if (neighborhood) {
      addressParts.push(neighborhood);
    }
    
    // Add sublocality components in order
    if (sublocality2) {
      addressParts.push(sublocality2);
    }
    if (sublocality) {
      addressParts.push(sublocality);
    }

    // If no parts were added, use a fallback
    if (addressParts.length === 0) {
      if (formattedAddress) {
        const parts = formattedAddress.split(',');
        if (parts.length > 0) {
          const firstPart = parts[0].trim();
          if (!/^\d+$/.test(firstPart) && 
              !firstPart.includes('Unnamed') && 
              !firstPart.includes('+') &&
              firstPart.length > 0) {
            addressParts.push(firstPart);
          }
        }
      }
      if (addressParts.length === 0) {
        addressParts.push('Location');
      }
    }

    const streetAddress = addressParts.join(', ');

    return {
      streetAddress,
      city,
      state,
      pincode
    };
  };

  // Initialize map and marker
  useEffect(() => {
    if (window.google && window.google.maps && mapContainerRef.current && selectedLocation && !mapRef.current) {
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: selectedLocation,
          zoom: 20,
          mapId: '4072f14667d79f7252eee5f5',
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER
          }
        });

        const marker = new window.google.maps.Marker({
          map,
          position: selectedLocation,
          draggable: true,
          animation: window.google.maps.Animation.DROP
        });

        // Two-step process: Geocoding -> Places API using place_id
        marker.addListener('dragend', async () => {
          const position = marker.getPosition();
          const newLocation = {
            lat: position.lat(),
            lng: position.lng()
          };
          console.log('Marker dragged to:', newLocation);

          // Zoom in when marker is dragged
          map.setZoom(20);
          map.setCenter(newLocation);

          try {
            // Step 1: Get formatted address and place_id from Geocoding API
            const geocoder = new window.google.maps.Geocoder();
            console.log('Calling geocoding service with location:', newLocation);
            const geocodeResult = await new Promise((resolve, reject) => {
              geocoder.geocode({ 
                location: newLocation,
                bounds: new window.google.maps.LatLngBounds(
                  new window.google.maps.LatLng(newLocation.lat - 0.0001, newLocation.lng - 0.0001),
                  new window.google.maps.LatLng(newLocation.lat + 0.0001, newLocation.lng + 0.0001)
                )
              }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                  // Prioritize results based on type
                  let bestResult = results[0];
                  let highestPriority = -1;

                  for (const result of results) {
                    const types = result.types;
                    let currentPriority = -1;

                    // Check for highest priority types first
                    if (types.includes('establishment') || types.includes('point_of_interest')) {
                      currentPriority = 3;
                    } else if (types.includes('premise')) {
                      currentPriority = 2;
                    } else if (types.includes('street_address')) {
                      currentPriority = 1;
                    }

                    // Update best result if current result has higher priority
                    if (currentPriority > highestPriority) {
                      highestPriority = currentPriority;
                      bestResult = result;
                    }
                  }

                  console.log('Selected result type:', bestResult.types);
                  resolve(bestResult);
                } else {
                  reject(new Error('Geocoding failed: ' + status));
                }
              });
            });

            console.log('Geocoding result:', geocodeResult);
            const placeId = geocodeResult.place_id;

            // Step 2: Use place_id directly to get detailed address components
            const placesService = new window.google.maps.places.PlacesService(map);
            console.log('Calling places service with place_id:', placeId);
            const placeResult = await new Promise((resolve, reject) => {
              placesService.getDetails(
                {
                  placeId: placeId,
                  fields: ['address_components', 'formatted_address', 'name']
                },
                (place, detailStatus) => {
                  if (detailStatus === 'OK' && place) {
                    console.log('Places service response:', place);
                    resolve(place);
                  } else {
                    console.log('Places service failed, using geocoding result');
                    resolve(geocodeResult);
                  }
                }
              );
            });

            // Extract address using existing function
            const addressData = extractAddressFromPlace(placeResult);
            setIsPincodeFromPlace(true);

            const updatedAddress = {
              address1,
              address2: addressData.streetAddress,
              city: addressData.city,
              state: addressData.state,
              pincode: addressData.pincode || ''
            };
            
            // Update address fields
            onAddressChange?.(updatedAddress);

            // Update location
            setSelectedLocation(newLocation);
            onLocationChange?.(newLocation);
          } catch (error) {
            console.error('Error in address lookup:', error);
          }
        });

        mapRef.current = map;
        map.marker = marker;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
  }, [selectedLocation, address1, onAddressChange, onLocationChange]);

  // Update marker position when location changes
  useEffect(() => {
    if (mapRef.current?.marker && selectedLocation) {
      mapRef.current.marker.setPosition(selectedLocation);
      mapRef.current.setCenter(selectedLocation);
    }
  }, [selectedLocation]);

  const handleOverride = () => {
    if (isOverriding) {
      // Apply the override
      onAddressChange?.({
        address1,
        address2,
        address3: overrideAddress,
        city,
        state,
        pincode
      });
      setLocalAddress2(overrideAddress);
    }
    setIsOverriding(!isOverriding);
  };

  // Reset pincode from place flag when manually changing pincode
  const handlePincodeChange = (e) => {
    setIsPincodeFromPlace(false);
    onAddressChange?.({ address1, address2, city, state, pincode: e.target.value });
  };

  return (
    <div className="address-map-selector">
      <div className="address-fields">
        <div className="form-group">
          <label htmlFor="address1">Address Line 1</label>
          <input
            type="text"
            id="address1"
            name="address1"
            className="form-input"
            value={localAddress1}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalAddress1(newValue);
              onAddressChange?.({
                address1: newValue,
                address2,
                city,
                state,
                pincode
              });
            }}
            placeholder="Enter flat, house, building number or name"
            required
            disabled={disabled}
            autoComplete="off"
            data-google-places-autocomplete="false"
          />
        </div>

        <div className="form-group">
          <label htmlFor="address2">Street Address</label>
          <input
            type="text"
            id="address2"
            name="address2"
            className="form-input"
            value={localAddress2}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalAddress2(newValue);
            }}
            placeholder="Start typing to search address"
            required
            disabled={disabled}
            autoComplete="off"
          />
          <div className="disclaimer">
            Note: The selected location may not display the exact place name. You can manually <b className="override-text">override</b> the street address below, if needed. Location coordinates will remain unchanged - only the address text will update. Please verify address accuracy before proceeding.
          </div>
          <div className="override-controls">
            {!isOverriding ? (
              <button 
                type="button"
                onClick={() => {
                  setIsOverriding(true);
                  setOverrideAddress(address3 || '');
                }}
                className="override-button"
              >
                Override Street Address
              </button>
            ) : (
              <div className="override-input-group">
                <input
                  type="text"
                  id="overrideAddress"
                  name="overrideAddress"
                  value={overrideAddress}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setOverrideAddress(newValue);
                    onAddressChange?.({
                      address1,
                      address2,
                      address3: newValue,
                      city,
                      state,
                      pincode
                    });
                  }}
                  placeholder="Enter custom street address"
                  className="override-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsOverriding(false);
                    setOverrideAddress(address3 || '');
                    // Restore the original address from the map
                    onAddressChange?.({
                      address1,
                      address2: localAddress2,
                      address3: '',
                      city,
                      state,
                      pincode
                    });
                  }}
                  className="override-cancel-button"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              className="form-input"
              value={city}
              onChange={(e) => onAddressChange?.({ address1, address2, city: e.target.value, state, pincode })}
              disabled
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              className="form-input"
              value={state}
              onChange={(e) => onAddressChange?.({ address1, address2, city, state: e.target.value, pincode })}
              disabled
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pincode">Pincode</label>
          <div className="pincode-search-container">
            <input
              type="text"
              id="pincode"
              name="pincode"
              className="form-input"
              value={pincode}
              onChange={handlePincodeChange}
              required
              disabled={disabled || (isPincodeFromPlace && pincode?.length === 6) || (!address2 && !city && !state)}
            />
            {!pincode && address2 && city && state && (
              <div className="disclaimer">
                We could not fetch the pincode. Please enter your pincode.
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className={`map-container ${!selectedLocation ? 'empty-state' : ''}`}
        ref={mapContainerRef}
      >
        {!selectedLocation && (
          <div className="map-message-overlay">
            <div className="pin-icon">📍</div>
            <div>Enter an address or pincode to set your location</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressMapSelector;