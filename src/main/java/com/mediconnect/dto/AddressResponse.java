package com.mediconnect.dto;

import com.mediconnect.model.Address;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private String address1;
    private String address2;
    private String address3;
    private String city;
    private String state;
    private String pincode;
    private GeoJsonPoint location;

    public static AddressResponse fromAddress(Address address) {
        if (address == null) {
            return null;
        }
        return new AddressResponse(
            address.getAddress1(),
            address.getAddress2(),
            address.getAddress3(),
            address.getCity(),
            address.getState(),
            address.getPincode(),
                null
        );
    }
} 