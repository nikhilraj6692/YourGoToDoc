package com.mediconnect.model;

import lombok.Data;

@Data
public class Address {
    private String address1;
    private String address2;
    private String city;
    private String state;
    private String pincode;

    public static Address fromDocument(org.bson.Document doc) {
        if (doc == null) return null;
        Address address = new Address();
        address.setAddress1(doc.getString("address1"));
        address.setAddress2(doc.getString("address2"));
        address.setCity(doc.getString("city"));
        address.setState(doc.getString("state"));
        address.setPincode(doc.getString("pincode"));
        return address;
    }

    public org.bson.Document toDocument() {
        org.bson.Document doc = new org.bson.Document();
        doc.append("address1", address1);
        doc.append("address2", address2);
        doc.append("city", city);
        doc.append("state", state);
        doc.append("pincode", pincode);
        return doc;
    }
} 