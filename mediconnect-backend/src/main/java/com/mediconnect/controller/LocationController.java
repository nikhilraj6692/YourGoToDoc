package com.mediconnect.controller;

import com.mediconnect.dto.AddressResponse;
import com.mediconnect.model.Address;
import com.mediconnect.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/location")
@Tag(name = "Location", description = "APIs for location services")
public class LocationController {

    @Autowired
    private LocationService locationService;

    @GetMapping("/pincode/{pincode}")
    @Operation(summary = "Get location details from pincode", description = "Retrieves city and state information for a given pincode")
    public ResponseEntity<AddressResponse> getLocationFromPincode(@PathVariable String pincode) {
        AddressResponse address = locationService.getLocationDetailsFromPincode(pincode);
        return ResponseEntity.ok(address);
    }
} 