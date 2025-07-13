# MediConnect - Healthcare Platform

A comprehensive healthcare platform connecting doctors and patients through secure appointments, real-time communication, and medical record management.

## 🚀 Current Status

### ✅ Completed Features
- **Authentication & User Management**: JWT-based auth with refresh tokens, role-based access (Doctor/Patient)
- **Doctor Management**: Registration, profiles, availability, consultation fees, public search API
- **Appointment System**: Calendar integration, slot management, booking flow, public booking for unauthenticated users
- **Patient Appointment Details**: Comprehensive form with validation and API integration
- **Real-time Chat System**: Doctor-patient communication with WebSocket backend and message persistence
- **UI/UX**: Modern responsive design with loading states, error handling, and consistent styling
- **JWT Enhancement**: Short-lived tokens with refresh, silent refresh, structured 401 responses
- **Form Standardization**: Consistent form-input styling and plain-btn button system
- **FindDoctor Page**: Enhanced doctor search with location-based filtering, improved UI alignment, and mobile responsiveness
- **Home Page Navigation**: Updated "Start Booking" buttons to navigate directly to find doctor page

### 🔄 In Progress
- **Audio Call Feature**: WebRTC-based audio calls between doctors and patients

## 🏥 Key Features

### For Patients
- **Appointment Booking**: Easy calendar-based booking with real-time slot availability
- **Appointment Details**: Comprehensive information form with validation
- **Doctor Information**: Detailed doctor profiles with specializations and ratings
- **Chat System**: Real-time communication with doctors with message status indicators
- **Appointment History**: Track past and upcoming appointments
- **Public Access**: Search doctors and book appointments without login (login required for confirmation)
- **Doctor Search**: Advanced search with location, specialty, and rating filters

### For Doctors
- **Appointment Management**: View and manage patient appointments
- **Patient Information**: Access to patient details and medical history
- **Chat System**: Real-time communication with patients with read receipts
- **Profile Management**: Update availability, fees, and specializations
- **Document Management**: Upload and manage licenses and certificates
- **Schedule Management**: Calendar-based availability management with recurring schedules

## 🛠 Technical Stack

### Backend
- **Java Spring Boot**: RESTful APIs and business logic
- **Spring Security**: Authentication and authorization with JWT
- **MongoDB**: Document database for flexible data storage
- **WebSocket**: Real-time communication with message persistence
- **AWS S3**: Document storage for doctor certificates and profile photos

### Frontend
- **React.js**: Modern UI components and state management
- **CSS3**: Custom styling with responsive design and consistent theming
- **JavaScript ES6+**: Modern JavaScript features
- **WebSocket**: Real-time chat integration with connection management

## 📱 Recent Updates

### FindDoctor Page Enhancements ✅ (Latest)
- **UI Alignment Fixes**: Fixed doctor information (name, specialty, experience, consultation fee) alignment issues
- **Mobile Responsiveness**: Improved mobile layout and text alignment
- **Search Functionality**: Enhanced location-based doctor search with pincode and city options
- **Calendar Integration**: Fixed slot display issues and API endpoint corrections
- **Timezone Handling**: Fixed date formatting to prevent timezone-related issues
- **API Integration**: Corrected payload field names to match backend DTOs

### Home Page Navigation Update ✅ (Latest)
- **Start Booking Button**: Updated "Start Booking" button in steps section to navigate to find doctor page
- **User Experience**: Improved flow by allowing users to start booking immediately without forced signup
- **Consistent Navigation**: Both hero and steps section buttons now lead to doctor search

### JWT Authentication Enhancement ✅ (Week 3-4)
- **Short-lived Tokens**: Access tokens with automatic refresh mechanism
- **Silent Refresh**: Background token refresh with inactivity tracking
- **Structured Responses**: Proper 401 JSON responses with error details
- **Public Endpoints**: Doctor search and booking available without authentication
- **Login Modal**: Seamless login/signup integration for booking flow
- **Error Handling**: Comprehensive error handling with user-friendly messages

### UI/UX Standardization ✅ (Week 3-4)
- **Form Input Consistency**: All inputs use standardized `form-input` class
- **Button System**: Unified `plain-btn` system with variants
- **Common Header**: Consistent header component across all pages
- **Login Modal**: Modern login/signup modal with two-step signup process
- **Toast Notifications**: Consistent color scheme and simplified design
- **Loading States**: Improved loading indicators with neon green spinner

### Real-time Chat System ✅ (Week 3)
- **WebSocket Backend**: Complete real-time messaging with message persistence
- **Chat Interface**: Modern messaging UI with message bubbles and timestamps
- **Message Status**: Single blue tick (✓) for sent, double blue ticks (✓✓) for read
- **Connection Management**: Proper WebSocket connection handling with cleanup
- **Chat History**: Message history loading with automatic read marking
- **Integration**: Seamless integration with appointment workflow
- **Error Handling**: Backend failure detection and auto-retry mechanisms

### Patient Appointment Details System ✅
- **Modern UI**: Clean, responsive design with doctor information sidebar
- **Comprehensive Form**: Patient information with validation and real-time feedback
- **API Integration**: Seamless data persistence and retrieval
- **Chat Enablement**: Smart logic based on appointment status and data completion
- **Navigation**: Smooth flow from appointment booking to details

### Form Validation & UX ✅
- **Real-time Validation**: Immediate feedback on form completion
- **Smart Button States**: Submit and chat buttons enabled based on requirements
- **Loading States**: Proper loading indicators for all operations
- **Error Handling**: User-friendly error messages and recovery

## 🚧 Upcoming Features

### Audio Call Feature (Week 4 - High Priority)
- **WebRTC Backend**: Signaling server for audio calls
- **Call Interface**: Audio call controls (mute, speaker, end call)
- **Call Management**: Invitation, acceptance, and status tracking
- **Integration**: Seamless integration with chat system

### Legal and Compliance Pages (Low Priority - Next 1-2 Weeks)
- **Terms of Service**: Comprehensive terms with modern, readable layout
- **Privacy Policy**: Detailed privacy policy with GDPR compliance
- **Forgot Password**: Email-based password reset with security features

### Chat System Improvements (Low Priority - Next 1-2 Weeks)
- **Read/Sent Indicators**: Fix message status display issues
- **Connection Testing**: Verify WebSocket closure on logout/close/tab close
- **Backend Failure Handling**: Test message sending when backend is down
- **Multi-User Testing**: Test with multiple simultaneous users

### Phase 2 Features
- **Video Consultation**: WebRTC-based video calls
- **Prescription Management**: Digital prescription system
- **Medical Records**: Comprehensive patient history
- **Payment Integration**: Secure payment processing
- **Analytics Dashboard**: Insights and reporting

## 🏃‍♂️ Getting Started

### Prerequisites
- Java 17+
- Node.js 16+
- MongoDB 5+
- Maven 3.6+

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend Setup
```bash
cd mediconnect-ui
npm install
npm start
```

### Database Setup
- MongoDB should be running on localhost:27017
- Database will be created automatically on first run

## 📊 Project Structure

```
MediConnect/
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   ├── controller/     # REST API controllers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Data access layer
│   │   ├── model/          # Data models
│   │   └── dto/           # Data transfer objects
│   └── src/main/resources/
│       └── application.properties
├── mediconnect-ui/         # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/
└── docs/                  # Documentation
```

## 🔧 Development Guidelines

### Code Quality
- Follow consistent naming conventions
- Implement proper error handling
- Add comprehensive logging
- Write unit tests for critical functions

### UI/UX Standards
- Use consistent color scheme (#86bf23 primary)
- Implement responsive design
- Add loading states for all async operations
- Provide clear user feedback
- Use standardized form-input and plain-btn classes

### API Design
- RESTful principles
- Consistent error responses
- Proper HTTP status codes
- Comprehensive documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Roadmap

### Q1 2024
- [x] Core appointment system
- [x] Patient appointment details
- [x] Real-time chat system
- [x] JWT authentication enhancement
- [x] UI/UX standardization
- [x] FindDoctor page enhancements
- [x] Home page navigation improvements
- [ ] Audio call feature
- [ ] Video consultation

### Q2 2024
- [ ] Prescription management
- [ ] Medical records system
- [ ] Payment integration
- [ ] Mobile app development
- [ ] Terms of service and privacy policy
- [ ] Forgot password functionality

### Q3 2024
- [ ] Advanced analytics
- [ ] AI-powered features
- [ ] Multi-language support
- [ ] Enterprise features 