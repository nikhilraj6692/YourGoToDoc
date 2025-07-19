package com.mediconnect.repository;

import com.mediconnect.model.Calendar;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarRepository extends MongoRepository<Calendar, String> {
    Optional<Calendar> findByDoctorIdAndDate(String doctorId, LocalDate date);

    @Query("{ 'doctorId': ?0, 'date': { $gte: ?1, $lte: ?2 } }")
    List<Calendar> findByDoctorIdAndDateBetween(String doctorId, LocalDate startDate, LocalDate endDate);

    List<Calendar> findByDoctorIdAndDateIn(String doctorId, List<LocalDate> dates);

    Optional<Calendar> findByIdAndDoctorId(String calendarId, String doctorId);
}