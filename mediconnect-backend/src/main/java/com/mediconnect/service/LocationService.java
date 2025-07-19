package com.mediconnect.service;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mediconnect.dto.AddressResponse;
import com.mediconnect.model.Address;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class LocationService {

    @Value("${google.maps.api.key}")
    private String googleMapsApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PINCODE_API_URL = "https://api.postalpincode.in/postoffice/";

    public AddressResponse getLocationDetailsFromPincode(String pincode) {
        // Using PostPincode API for Indian pincodes
        String url = "https://api.postalpincode.in/pincode/" + pincode;
        ResponseEntity<Map[]> response = restTemplate.getForEntity(url, Map[].class);
        
        if (response.getBody() != null && "Success".equals(response.getBody()[0].get("Status"))) {
            List<Map<String, Object>> postOffices = (List<Map<String, Object>>) response.getBody()[0].get("PostOffice");
            if (postOffices != null && !postOffices.isEmpty()) {
                Map<String, Object> firstOffice = postOffices.get(0);
                
                AddressResponse address = new AddressResponse();
                address.setPincode(pincode);
                address.setState((String) firstOffice.get("State"));
                address.setCity((String) firstOffice.get("District"));
                
                // Get coordinates using Google Geocoding API
                geocodeAddress(address);
                
                return address;
            }
        }
        throw new RuntimeException("Invalid pincode or service unavailable");
    }

    public void geocodeAddress(AddressResponse address) {
        // Prioritize verified location data (pincode, state, district) over user-entered address
        String addressString = String.format("%s, %s, %s",
            address.getCity(),    // District from pincode
            address.getState(),   // State from pincode
            address.getPincode()  // Verified pincode
        );
        
        String url = String.format(
            "https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s",
            addressString.replace(" ", "+"),
            googleMapsApiKey
        );
        
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        
        if (response.getBody() != null) {
            Map<String, Object> result = (Map<String, Object>) response.getBody();
            if ("OK".equals(result.get("status"))) {
                Map<String, Object> location = (Map<String, Object>) 
                    ((Map<String, Object>) 
                        ((Map<String, Object>) 
                            ((java.util.List<?>) result.get("results")).get(0)
                        ).get("geometry")
                    ).get("location");
                
                Double lat = (Double) location.get("lat");
                Double lng = (Double) location.get("lng");
                
                // Set the GeoJsonPoint location with coordinates
                address.setLocation(new org.springframework.data.mongodb.core.geo.GeoJsonPoint(lng, lat));
            }
        }
    }

    public List<String> getPincodesForCity(String city, String state) {
        try {
            String url = PINCODE_API_URL + city;
            PincodeResponse[] response = restTemplate.getForObject(url, PincodeResponse[].class);
            
            if (response != null && response.length > 0 && response[0].getPostOffice() != null) {
                return response[0].getPostOffice().stream()
                    .filter(office -> state == null || office.getState().equalsIgnoreCase(state))
                    .map(office -> office.getPincode())
                    .toList();
            }
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching pincodes for city: " + city + ", error: " + e.getMessage());
        }
        return new ArrayList<>();
    }

    // Response classes for the API
    private static class PincodeResponse {
        @JsonProperty("PostOffice")
        private List<PostOffice> PostOffice;
        public List<PostOffice> getPostOffice() { return PostOffice; }
        public void setPostOffice(List<PostOffice> postOffice) { PostOffice = postOffice; }
    }

    private static class PostOffice {
        @JsonProperty("Name")
        private String Name;
        @JsonProperty("State")
        private String State;
        @JsonProperty("Pincode")
        private String Pincode;
        public String getName() { return Name; }
        public void setName(String name) { Name = name; }
        public String getState() { return State; }
        public void setState(String state) { State = state; }
        public String getPincode() { return Pincode; }
        public void setPincode(String pincode) { Pincode = pincode; }
    }
} 