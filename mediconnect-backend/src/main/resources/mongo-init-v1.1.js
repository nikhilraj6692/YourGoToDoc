// MongoDB initialization script for MediConnect - Version 1.1
// This script sets up the database, collections, indexes, and sample data
// Safe to run multiple times - includes "if not exists" checks

// Switch to mediconnect database
db = db.getSiblingDB('mediconnect');

print('Starting MediConnect database initialization - Version 1.1...');

// =============================================================================
// CREATE COLLECTIONS (with existence checks)
// =============================================================================

print('Creating collections...');

// Core collections
var collections = [
    'users', 'doctors', 'appointments', 'appointmentDetails', 
    'schedules', 'messages', 'feedback', 'notifications', 
    'notification_preferences', 'doctor_profiles', 'chats', 'payments'
];

collections.forEach(function(collectionName) {
    if (!db.getCollectionNames().includes(collectionName)) {
        db.createCollection(collectionName);
        print('Created collection: ' + collectionName);
    } else {
        print('Collection already exists: ' + collectionName);
    }
});

print('Collections setup completed!');

// =============================================================================
// CREATE INDEXES FOR BETTER PERFORMANCE (with existence checks)
// =============================================================================

print('Creating indexes...');

// User indexes (skip _id as it's auto-created)
if (!db.users.getIndexes().some(idx => idx.name === 'email_1')) {
    db.users.createIndex({ "email": 1 }, { unique: true });
    print('Created unique index on users.email');
}
if (!db.users.getIndexes().some(idx => idx.name === 'phone_1')) {
    db.users.createIndex({ "phone": 1 });
    print('Created index on users.phone');
}
if (!db.users.getIndexes().some(idx => idx.name === 'role_1')) {
    db.users.createIndex({ "role": 1 });
    print('Created index on users.role');
}
if (!db.users.getIndexes().some(idx => idx.name === 'status_1')) {
    db.users.createIndex({ "status": 1 });
    print('Created index on users.status');
}

// Doctor indexes (skip _id as it's auto-created)
if (!db.doctors.getIndexes().some(idx => idx.name === 'email_1')) {
    db.doctors.createIndex({ "email": 1 }, { unique: true });
    print('Created unique index on doctors.email');
}
if (!db.doctors.getIndexes().some(idx => idx.name === 'specialization_1')) {
    db.doctors.createIndex({ "specialization": 1 });
    print('Created index on doctors.specialization');
}
if (!db.doctors.getIndexes().some(idx => idx.name === 'location_1')) {
    db.doctors.createIndex({ "location": 1 });
    print('Created index on doctors.location');
}
if (!db.doctors.getIndexes().some(idx => idx.name === 'verificationStatus_1')) {
    db.doctors.createIndex({ "verificationStatus": 1 });
    print('Created index on doctors.verificationStatus');
}

// Appointment indexes (skip _id as it's auto-created)
if (!db.appointments.getIndexes().some(idx => idx.name === 'doctorId_1')) {
    db.appointments.createIndex({ "doctorId": 1 });
    print('Created index on appointments.doctorId');
}
if (!db.appointments.getIndexes().some(idx => idx.name === 'patientId_1')) {
    db.appointments.createIndex({ "patientId": 1 });
    print('Created index on appointments.patientId');
}
if (!db.appointments.getIndexes().some(idx => idx.name === 'startTime_1')) {
    db.appointments.createIndex({ "startTime": 1 });
    print('Created index on appointments.startTime');
}
if (!db.appointments.getIndexes().some(idx => idx.name === 'status_1')) {
    db.appointments.createIndex({ "status": 1 });
    print('Created index on appointments.status');
}
if (!db.appointments.getIndexes().some(idx => idx.name === 'doctorId_1_startTime_1')) {
    db.appointments.createIndex({ "doctorId": 1, "startTime": 1 });
    print('Created compound index on appointments.doctorId and startTime');
}
if (!db.appointments.getIndexes().some(idx => idx.name === 'patientId_1_startTime_1')) {
    db.appointments.createIndex({ "patientId": 1, "startTime": 1 });
    print('Created compound index on appointments.patientId and startTime');
}

// Schedule indexes (skip _id as it's auto-created)
if (!db.schedules.getIndexes().some(idx => idx.name === 'doctorId_1')) {
    db.schedules.createIndex({ "doctorId": 1 });
    print('Created index on schedules.doctorId');
}
if (!db.schedules.getIndexes().some(idx => idx.name === 'startTime_1')) {
    db.schedules.createIndex({ "startTime": 1 });
    print('Created index on schedules.startTime');
}
if (!db.schedules.getIndexes().some(idx => idx.name === 'doctorId_1_startTime_1')) {
    db.schedules.createIndex({ "doctorId": 1, "startTime": 1 });
    print('Created compound index on schedules.doctorId and startTime');
}

// Message indexes (skip _id as it's auto-created)
if (!db.messages.getIndexes().some(idx => idx.name === 'appointmentId_1')) {
    db.messages.createIndex({ "appointmentId": 1 });
    print('Created index on messages.appointmentId');
}
if (!db.messages.getIndexes().some(idx => idx.name === 'timestamp_1')) {
    db.messages.createIndex({ "timestamp": 1 });
    print('Created index on messages.timestamp');
}
if (!db.messages.getIndexes().some(idx => idx.name === 'chatId_1_createdAt_-1')) {
    db.messages.createIndex({ "chatId": 1, "createdAt": -1 });
    print('Created compound index on messages.chatId and createdAt');
}

// Notification indexes (skip _id as it's auto-created)
if (!db.notifications.getIndexes().some(idx => idx.name === 'userId_1_createdAt_-1')) {
    db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
    print('Created compound index on notifications.userId and createdAt');
}
if (!db.notification_preferences.getIndexes().some(idx => idx.name === 'userId_1')) {
    db.notification_preferences.createIndex({ "userId": 1 }, { unique: true });
    print('Created unique index on notification_preferences.userId');
}

// Doctor profile indexes (skip _id as it's auto-created)
if (!db.doctor_profiles.getIndexes().some(idx => idx.name === 'userId_1')) {
    db.doctor_profiles.createIndex({ "userId": 1 }, { unique: true });
    print('Created unique index on doctor_profiles.userId');
}
if (!db.doctor_profiles.getIndexes().some(idx => idx.name === 'specialization_1')) {
    db.doctor_profiles.createIndex({ "specialization": 1 });
    print('Created index on doctor_profiles.specialization');
}
if (!db.doctor_profiles.getIndexes().some(idx => idx.name === 'location_2dsphere')) {
    db.doctor_profiles.createIndex({ "location": "2dsphere" });
    print('Created geospatial index on doctor_profiles.location');
}

// Chat indexes (skip _id as it's auto-created)
if (!db.chats.getIndexes().some(idx => idx.name === 'appointmentId_1')) {
    db.chats.createIndex({ "appointmentId": 1 });
    print('Created index on chats.appointmentId');
}

// Payment indexes (skip _id as it's auto-created)
if (!db.payments.getIndexes().some(idx => idx.name === 'appointmentId_1')) {
    db.payments.createIndex({ "appointmentId": 1 });
    print('Created index on payments.appointmentId');
}

print('Indexes setup completed!');

// =============================================================================
// CREATE ADMIN USER (with existence check)
// =============================================================================

print('Creating admin user...');

// Check if admin already exists
var adminUser = db.users.findOne({ "email": "admin@mediconnect.com" });

if (!adminUser) {
    db.users.insertOne({
        email: "admin@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "admin123"
        role: "ADMIN",
        status: "ACTIVE",
        fullName: "System Admin",
        createdAt: new Date(),
        updatedAt: new Date()
    });
    print('Admin user created successfully!');
} else {
    print('Admin user already exists!');
}

// =============================================================================
// CREATE SAMPLE DOCTORS (with existence checks)
// =============================================================================

print('Creating sample doctors...');

// Sample doctor data
var sampleDoctors = [
    {
        email: "dr.smith@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "doctor123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. John Smith",
        specialization: "Cardiology",
        location: "New York",
        verificationStatus: "VERIFIED",
        experience: 15,
        consultationFee: 150,
        rating: 4.8,
        totalPatients: 1200,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "dr.johnson@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "doctor123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Sarah Johnson",
        specialization: "Dermatology",
        location: "Los Angeles",
        verificationStatus: "VERIFIED",
        experience: 12,
        consultationFee: 120,
        rating: 4.9,
        totalPatients: 800,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "dr.williams@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "doctor123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Michael Williams",
        specialization: "Neurology",
        location: "Chicago",
        verificationStatus: "VERIFIED",
        experience: 18,
        consultationFee: 180,
        rating: 4.7,
        totalPatients: 1500,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "dr.brown@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "doctor123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Emily Brown",
        specialization: "Pediatrics",
        location: "Boston",
        verificationStatus: "VERIFIED",
        experience: 10,
        consultationFee: 100,
        rating: 4.9,
        totalPatients: 600,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "dr.davis@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "doctor123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Robert Davis",
        specialization: "Orthopedics",
        location: "Houston",
        verificationStatus: "VERIFIED",
        experience: 20,
        consultationFee: 200,
        rating: 4.8,
        totalPatients: 2000,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert sample doctors if they don't exist
sampleDoctors.forEach(function(doctor) {
    var existingDoctor = db.doctors.findOne({ "email": doctor.email });
    if (!existingDoctor) {
        db.doctors.insertOne(doctor);
        print('Created sample doctor: ' + doctor.fullName);
    } else {
        print('Sample doctor already exists: ' + doctor.fullName);
    }
});

print('Sample doctors setup completed!');

// =============================================================================
// CREATE SAMPLE PATIENTS (with existence checks)
// =============================================================================

print('Creating sample patients...');

// Sample patient data
var samplePatients = [
    {
        email: "john.doe@example.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "patient123"
        role: "PATIENT",
        status: "ACTIVE",
        fullName: "John Doe",
        phone: "+1234567890",
        dateOfBirth: new Date("1990-05-15"),
        gender: "MALE",
        address: "123 Main St, New York, NY 10001",
        medicalHistory: "No significant medical history",
        allergies: "None",
        emergencyContact: {
            name: "Jane Doe",
            phone: "+1234567891",
            relationship: "Spouse"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "jane.smith@example.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "patient123"
        role: "PATIENT",
        status: "ACTIVE",
        fullName: "Jane Smith",
        phone: "+1234567892",
        dateOfBirth: new Date("1985-08-22"),
        gender: "FEMALE",
        address: "456 Oak Ave, Los Angeles, CA 90210",
        medicalHistory: "Hypertension, controlled with medication",
        allergies: "Penicillin",
        emergencyContact: {
            name: "Mike Smith",
            phone: "+1234567893",
            relationship: "Husband"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "mike.wilson@example.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "patient123"
        role: "PATIENT",
        status: "ACTIVE",
        fullName: "Mike Wilson",
        phone: "+1234567894",
        dateOfBirth: new Date("1992-03-10"),
        gender: "MALE",
        address: "789 Pine St, Chicago, IL 60601",
        medicalHistory: "Asthma, seasonal allergies",
        allergies: "Dust, pollen",
        emergencyContact: {
            name: "Lisa Wilson",
            phone: "+1234567895",
            relationship: "Sister"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert sample patients if they don't exist
samplePatients.forEach(function(patient) {
    var existingPatient = db.users.findOne({ "email": patient.email });
    if (!existingPatient) {
        db.users.insertOne(patient);
        print('Created sample patient: ' + patient.fullName);
    } else {
        print('Sample patient already exists: ' + patient.fullName);
    }
});

print('Sample patients setup completed!');

// =============================================================================
// VERIFICATION AND SUMMARY
// =============================================================================

print('Verifying database setup...');

// Count collections
var collectionCount = db.getCollectionNames().length;
print('Total collections created: ' + collectionCount);

// Count documents in key collections
var userCount = db.users.countDocuments();
var doctorCount = db.doctors.countDocuments();
var appointmentCount = db.appointments.countDocuments();

print('Total users: ' + userCount);
print('Total doctors: ' + doctorCount);
print('Total appointments: ' + appointmentCount);

print('MediConnect database initialization completed successfully!');
print('Version: 1.1');
print('Timestamp: ' + new Date()); 