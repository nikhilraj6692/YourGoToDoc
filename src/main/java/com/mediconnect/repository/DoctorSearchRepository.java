package com.mediconnect.repository;

import com.mediconnect.model.DoctorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorSearchRepository extends MongoRepository<DoctorProfile, String> {
    
    @Query(value = "{'specialization': ?0, 'yearsOfExperience': {$gte: ?1}, 'verificationStatus': 'VERIFIED'}")
    Page<DoctorProfile> findBySpecializationAndMinExperience(String specialization, Integer minExperience, Pageable pageable);

    @Query(value = "{'specialization': ?0, 'verificationStatus': 'VERIFIED', 'location': {$near: {$geometry: {type: 'Point', coordinates: [?2, ?3]}, $maxDistance: ?4}}}")
    Page<DoctorProfile> findBySpecializationNearLocation(
        String specialization, 
        Integer minExperience, 
        Double longitude, 
        Double latitude, 
        Double maxDistanceInMeters,
        Pageable pageable
    );

    @Query(value = "{'verificationStatus': 'VERIFIED', 'location': {$near: {$geometry: {type: 'Point', coordinates: [?0, ?1]}, $maxDistance: ?2}}}")
    Page<DoctorProfile> findByLocationNear(
        Double longitude, 
        Double latitude, 
        Double maxDistanceInMeters,
        Pageable pageable
    );

    @Query("{ 'address.pincode': { $in: ?0 } }")
    Page<DoctorProfile> findByPincodes(List<String> pincodes, Pageable pageable);

    @Query(value = "{'city': ?0, 'state': ?1, 'specialization': ?2, 'verificationStatus': 'VERIFIED'}")
    Page<DoctorProfile> findByCityAndStateAndSpecialization(String city, String state, String specialization, Pageable pageable);

    @Query(value = "{'city': ?0, 'state': ?1, 'verificationStatus': 'VERIFIED'}")
    Page<DoctorProfile> findByCityAndState(String city, String state, Pageable pageable);

    @Query(value = "[{ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } }, " +
            "{ $unwind: '$user' }, " +
            "{ $match: { $text: { $search: ?0, $caseSensitive: false, $diacriticSensitive: false }, 'specialization': ?1, 'verificationStatus': 'VERIFIED' } }]")
    Page<DoctorProfile> findByFullNameRegexAndSpecialization(String name, String specialization, Pageable pageable);

    @Aggregation(pipeline = {
            "{ $search: { " +
                    "    index: 'default', " +
                    "    text: { " +
                    "      query: ?0, " +
                    "      path: ['fullName'], " +
                    "      fuzzy: { maxEdits: 2, prefixLength: 1 } " +
                    "    } " +
                    "} }",
            "{ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } }",
            "{ $unwind: '$user' }",
            "{ $match: { 'verificationStatus': 'VERIFIED' } }"
    })
    List<DoctorProfile> findByFullNameRegex(String name, Pageable pageable);
} 