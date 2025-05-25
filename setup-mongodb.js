// Switch to mediconnect database
db = db.getSiblingDB('mediconnect');

// Create collections
db.createCollection('users');
db.createCollection('appointments');
db.createCollection('notifications');
db.createCollection('notification_preferences');
db.createCollection('doctor_profiles');
db.createCollection('chats');
db.createCollection('messages');
db.createCollection('payments');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.appointments.createIndex({ "doctorId": 1, "startTime": 1 });
db.appointments.createIndex({ "patientId": 1, "startTime": 1 });
db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
db.notification_preferences.createIndex({ "userId": 1 }, { unique: true });
db.doctor_profiles.createIndex({ "userId": 1 }, { unique: true });
db.chats.createIndex({ "appointmentId": 1 });
db.messages.createIndex({ "chatId": 1, "createdAt": -1 });
db.payments.createIndex({ "appointmentId": 1 });

// Create admin user
db.users.insertOne({
    email: "admin@mediconnect.com",
    password: "$2a$10$rDkPvvAFV6GgJjXpX5Y5UOQZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z", // hashed "admin123"
    role: "ADMIN",
    status: "ACTIVE",
    fullName: "System Admin",
    createdAt: new Date(),
    updatedAt: new Date()
});

print("Database setup completed successfully!"); 