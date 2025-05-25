# MediConnect

A modern healthcare platform connecting patients with doctors, built with Spring Boot and React.

## Features

### Completed ✅
- **Authentication & User Management**
  - Secure user registration and login
  - Role-based access (Doctor, Patient, Admin)
  - JWT-based authentication
  - Profile management

- **Doctor Onboarding**
  - Complete registration flow
  - Document upload system
  - Profile verification
  - Specialization management

- **Modern UI/UX**
  - Responsive design
  - Consistent color scheme
  - Form validations
  - Error handling
  - Loading states
  - Success messages

### In Progress 🚧
- Appointment scheduling system
- Patient management
- Communication system
- Payment integration

## Tech Stack

### Backend
- Spring Boot
- MongoDB
- Spring Security
- JWT Authentication
- WebSocket (for real-time features)

### Frontend
- React
- React Router
- Modern CSS
- Responsive Design

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- MongoDB

### Backend Setup
1. Clone the repository
2. Navigate to the project directory
3. Run `./mvnw spring-boot:run`

### Frontend Setup
1. Navigate to the `mediconnect-ui` directory
2. Run `npm install`
3. Run `npm start`

## Project Structure

```
mediconnect/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── mediconnect/
│   │   │           ├── config/
│   │   │           ├── controller/
│   │   │           ├── model/
│   │   │           ├── repository/
│   │   │           ├── service/
│   │   │           └── security/
│   │   └── resources/
│   └── test/
└── mediconnect-ui/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── styles/
    │   └── App.js
    └── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 