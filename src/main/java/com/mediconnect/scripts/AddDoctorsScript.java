package com.mediconnect.scripts;

import com.mediconnect.enums.Status;
import com.mediconnect.enums.UserRole;
import com.mediconnect.enums.VerificationStatus;
import com.mediconnect.model.Address;
import com.mediconnect.model.DoctorProfile;
import com.mediconnect.model.User;
import com.mediconnect.repository.DoctorProfileRepository;
import com.mediconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
public class AddDoctorsScript {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Center coordinates (Bihar)
    private static final double CENTER_LAT = 26.112585878580482;
    private static final double CENTER_LON = 85.39163437645426;
    
    // Radius range in kilometers
    private static final double MIN_RADIUS = 100.0;
    private static final double MAX_RADIUS = 200.0;

    private final List<String> specializations = Arrays.asList(
        "Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics",
        "Gynecology", "Ophthalmology", "ENT", "Dentistry", "Psychiatry"
    );

    private final List<String> cities = Arrays.asList(
        "Patna", "Muzaffarpur", "Gaya", "Bhagalpur", "Darbhanga",
        "Purnia", "Ara", "Begusarai", "Katihar", "Chapra"
    );

    private final List<String> states = Arrays.asList(
        "Bihar", "Bihar", "Bihar", "Bihar", "Bihar",
        "Bihar", "Bihar", "Bihar", "Bihar", "Bihar"
    );

    private final Random random = new Random();

    public void addDoctors() {
        for (int i = 1; i <= 50; i++) {
            // Create User
            User user = new User();
            user.setFullName("Dr. " + getRandomName());
            user.setEmail("doctor" + i + "@mediconnect.com");
            user.setPassword(passwordEncoder.encode("Doctor@123"));
            user.setPhoneNumber(1000000000L + i);
            user.setRole(UserRole.DOCTOR);
            user.setStatus(Status.ACTIVE);

            // Create Address
            Address address = new Address();
            int cityIndex = random.nextInt(cities.size());
            address.setAddress1(random.nextInt(1000) + " Medical Center Dr");
            address.setCity(cities.get(cityIndex));
            address.setState(states.get(cityIndex));
            address.setPincode(String.valueOf(800000 + random.nextInt(100000))); // Bihar pincodes
            user.setAddress(address);

            // Save User
            user = userRepository.save(user);

            // Create DoctorProfile
            DoctorProfile profile = new DoctorProfile();
            profile.setUserId(user.getId());
            profile.setSpecialization(specializations.get(random.nextInt(specializations.size())));
            profile.setLicenseNumber("MD" + String.format("%06d", i));
            profile.setYearsOfExperience(1 + random.nextInt(30));
            profile.setBio("Experienced " + profile.getSpecialization() + " specialist with " + 
                          profile.getYearsOfExperience() + " years of practice.");
            profile.setVerificationStatus(VerificationStatus.VERIFIED);
            
            // Generate random location within radius
            double[] location = generateRandomLocation();
            profile.setLocation(new GeoJsonPoint(location[1], location[0])); // longitude, latitude

            // Save DoctorProfile
            doctorProfileRepository.save(profile);

            System.out.println("Added doctor: " + user.getFullName() + 
                             " at location: " + location[0] + ", " + location[1]);
        }
    }

    private double[] generateRandomLocation() {
        // Generate random radius between MIN_RADIUS and MAX_RADIUS
        double radius = MIN_RADIUS + (random.nextDouble() * (MAX_RADIUS - MIN_RADIUS));
        
        // Generate random angle
        double angle = random.nextDouble() * 2 * Math.PI;
        
        // Convert radius from kilometers to degrees (approximate)
        // 1 degree of latitude ≈ 111 km
        // 1 degree of longitude ≈ 111 km * cos(latitude)
        double radiusInDegrees = radius / 111.0;
        
        // Calculate new coordinates
        double lat = CENTER_LAT + (radiusInDegrees * Math.cos(angle));
        double lon = CENTER_LON + (radiusInDegrees * Math.sin(angle) / Math.cos(Math.toRadians(CENTER_LAT)));
        
        return new double[]{lat, lon};
    }

    private String getRandomName() {
        List<String> firstNames = Arrays.asList(
            "Rajesh", "Priya", "Amit", "Neha", "Suresh",
            "Anita", "Vikram", "Pooja", "Rahul", "Meera"
        );
        List<String> lastNames = Arrays.asList(
            "Kumar", "Singh", "Sharma", "Verma", "Gupta",
            "Yadav", "Mishra", "Pandey", "Choudhary", "Patel"
        );
        return firstNames.get(random.nextInt(firstNames.size())) + " " + 
               lastNames.get(random.nextInt(lastNames.size()));
    }
} 