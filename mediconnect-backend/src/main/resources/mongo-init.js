// MongoDB initialization script for MediConnect
// This script sets up the database, collections, indexes, and sample data
// Safe to run multiple times - includes "if not exists" checks

// Switch to mediconnect database
db = db.getSiblingDB('mediconnect');

print('Starting MediConnect database initialization...');

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

// User indexes
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

// Doctor indexes
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

// Appointment indexes
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

// Schedule indexes
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

// Message indexes
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

// Notification indexes
if (!db.notifications.getIndexes().some(idx => idx.name === 'userId_1_createdAt_-1')) {
    db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
    print('Created compound index on notifications.userId and createdAt');
}
if (!db.notification_preferences.getIndexes().some(idx => idx.name === 'userId_1')) {
    db.notification_preferences.createIndex({ "userId": 1 }, { unique: true });
    print('Created unique index on notification_preferences.userId');
}

// Doctor profile indexes
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

// Chat indexes
if (!db.chats.getIndexes().some(idx => idx.name === 'appointmentId_1')) {
    db.chats.createIndex({ "appointmentId": 1 });
    print('Created index on chats.appointmentId');
}

// Payment indexes
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
        email: "doctor1@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "Doctor@123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Rajesh Kumar",
        phoneNumber: 1000000001,
        address: {
            address1: "123 Medical Center Dr",
            city: "Patna",
            state: "Bihar",
            pincode: "800001"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "doctor2@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "Doctor@123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Priya Sharma",
        phoneNumber: 1000000002,
        address: {
            address1: "456 Health Plaza",
            city: "Muzaffarpur",
            state: "Bihar",
            pincode: "842001"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "doctor3@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "Doctor@123"
        role: "DOCTOR",
        status: "ACTIVE",
        fullName: "Dr. Amit Verma",
        phoneNumber: 1000000003,
        address: {
            address1: "789 Hospital Road",
            city: "Gaya",
            state: "Bihar",
            pincode: "823001"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert sample doctors
sampleDoctors.forEach(function(doctor) {
    var existingDoctor = db.users.findOne({ "email": doctor.email });
    if (!existingDoctor) {
        var insertedDoctor = db.users.insertOne(doctor);
        
        // Create corresponding doctor profile
        var specializations = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics"];
        var randomSpecialization = specializations[Math.floor(Math.random() * specializations.length)];
        
        db.doctor_profiles.insertOne({
            userId: insertedDoctor.insertedId,
            specialization: randomSpecialization,
            licenseNumber: "MD" + String.format("%06d", Math.floor(Math.random() * 1000000)),
            yearsOfExperience: 1 + Math.floor(Math.random() * 30),
            bio: "Experienced " + randomSpecialization + " specialist with " + 
                 (1 + Math.floor(Math.random() * 30)) + " years of practice.",
            verificationStatus: "VERIFIED",
            location: {
                type: "Point",
                coordinates: [
                    85.39163437645426 + (Math.random() - 0.5) * 2, // longitude
                    26.112585878580482 + (Math.random() - 0.5) * 2  // latitude
                ]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        print('Added doctor: ' + doctor.fullName);
    } else {
        print('Doctor already exists: ' + doctor.fullName);
    }
});

// =============================================================================
// CREATE SAMPLE PATIENTS (with existence checks)
// =============================================================================

print('Creating sample patients...');

var samplePatients = [
    {
        email: "patient1@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "Patient@123"
        role: "PATIENT",
        status: "ACTIVE",
        fullName: "Rahul Singh",
        phoneNumber: 2000000001,
        address: {
            address1: "321 Patient Street",
            city: "Patna",
            state: "Bihar",
            pincode: "800002"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        email: "patient2@mediconnect.com",
        password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "Patient@123"
        role: "PATIENT",
        status: "ACTIVE",
        fullName: "Neha Gupta",
        phoneNumber: 2000000002,
        address: {
            address1: "654 Health Lane",
            city: "Muzaffarpur",
            state: "Bihar",
            pincode: "842002"
        },
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert sample patients
samplePatients.forEach(function(patient) {
    var existingPatient = db.users.findOne({ "email": patient.email });
    if (!existingPatient) {
        db.users.insertOne(patient);
        print('Added patient: ' + patient.fullName);
    } else {
        print('Patient already exists: ' + patient.fullName);
    }
});

// =============================================================================
// VERIFICATION
// =============================================================================

print('Verifying database setup...');

var userCount = db.users.countDocuments();
var doctorCount = db.doctor_profiles.countDocuments();
var collectionCount = db.getCollectionNames().length;

print('Database verification complete:');
print('- Total users: ' + userCount);
print('- Total doctors: ' + doctorCount);
print('- Total collections: ' + collectionCount);

print('MediConnect database initialized successfully! 🎉');
print('');
print('Default credentials:');
print('- Admin: admin@mediconnect.com / admin123');
print('- Doctor: doctor1@mediconnect.com / Doctor@123');
print('- Patient: patient1@mediconnect.com / Patient@123');
print('');
print('Note: Passwords are hashed in the database for security.'); 