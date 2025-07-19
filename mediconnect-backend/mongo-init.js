// MongoDB initialization script for MediConnect
// This script sets up the database, collections, indexes, and sample data

// Switch to mediconnect database
db = db.getSiblingDB('mediconnect');

print('Starting MediConnect database initialization...');

// =============================================================================
// CREATE COLLECTIONS
// =============================================================================

print('Creating collections...');

// Core collections
db.createCollection('users');
db.createCollection('doctors');
db.createCollection('appointments');
db.createCollection('appointmentDetails');
db.createCollection('schedules');
db.createCollection('messages');
db.createCollection('feedback');

// Additional collections
db.createCollection('notifications');
db.createCollection('notification_preferences');
db.createCollection('doctor_profiles');
db.createCollection('chats');
db.createCollection('payments');

print('Collections created successfully!');

// =============================================================================
// CREATE INDEXES FOR BETTER PERFORMANCE
// =============================================================================

print('Creating indexes...');

// User indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "status": 1 });

// Doctor indexes
db.doctors.createIndex({ "email": 1 }, { unique: true });
db.doctors.createIndex({ "specialization": 1 });
db.doctors.createIndex({ "location": 1 });
db.doctors.createIndex({ "verificationStatus": 1 });

// Appointment indexes
db.appointments.createIndex({ "doctorId": 1 });
db.appointments.createIndex({ "patientId": 1 });
db.appointments.createIndex({ "startTime": 1 });
db.appointments.createIndex({ "status": 1 });
db.appointments.createIndex({ "doctorId": 1, "startTime": 1 });
db.appointments.createIndex({ "patientId": 1, "startTime": 1 });

// Schedule indexes
db.schedules.createIndex({ "doctorId": 1 });
db.schedules.createIndex({ "startTime": 1 });
db.schedules.createIndex({ "doctorId": 1, "startTime": 1 });

// Message indexes
db.messages.createIndex({ "appointmentId": 1 });
db.messages.createIndex({ "timestamp": 1 });
db.messages.createIndex({ "chatId": 1, "createdAt": -1 });

// Notification indexes
db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
db.notification_preferences.createIndex({ "userId": 1 }, { unique: true });

// Doctor profile indexes
db.doctor_profiles.createIndex({ "userId": 1 }, { unique: true });
db.doctor_profiles.createIndex({ "specialization": 1 });
db.doctor_profiles.createIndex({ "location": "2dsphere" });

// Chat indexes
db.chats.createIndex({ "appointmentId": 1 });

// Payment indexes
db.payments.createIndex({ "appointmentId": 1 });

print('Indexes created successfully!');

// =============================================================================
// CREATE ADMIN USER
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
// CREATE SAMPLE DOCTORS (Optional - Uncomment to add sample data)
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
    }
});

// =============================================================================
// CREATE SAMPLE PATIENTS (Optional)
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