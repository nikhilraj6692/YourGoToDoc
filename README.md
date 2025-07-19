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
- **Doctor Schedule Management**: Advanced calendar-based schedule management with slot operations
- **Booking Modal Enhancements**: Status-based slot management, cancelled appointments, completed appointments, expired appointments
- **Deep Linking**: Appointment details navigation with return URL support
- **Doctor Appointment Details**: Standalone appointment details page with navigation support

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
- **Appointment Details**: Comprehensive appointment details view with patient information

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

### Doctor Schedule & Appointment Management ✅ (Latest)
- **Advanced Schedule Management**: Calendar-based schedule with slot operations (add, delete, reschedule)
- **Booking Modal Enhancements**: Status-based slot management with cancelled, completed, and expired appointments
- **Deep Linking**: Appointment details navigation with return URL support for seamless navigation
- **Eye Icon Navigation**: Direct navigation from schedule to appointment details using appointment ID
- **Status Management**: Comprehensive appointment status handling with proper UI feedback
- **Slot Operations**: Bulk and individual slot management with confirmation modals

### Modular Component Architecture ✅ (Latest)
- **DatePicker Component**: Created reusable DatePicker component with dedicated CSS file
- **TimePicker Component**: Modular TimePicker component with isolated styling
- **CSS Organization**: Moved component-specific styles from Common.css to dedicated component CSS files
- **Code Maintainability**: Improved modularity and reduced global CSS pollution
- **Consistent Pattern**: Established pattern for component-specific styling and imports

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

### Next Week Tasks (High Priority)
1. **Reschedule Appointment Functionality**: Check and fix reschedule appointment functionality
2. **Appointments Screen Fixes**: Fix appointments screen and appointment details screen issues
3. **Booking Modal Time Restrictions**: Implement 5-hour cancellation and rescheduling restrictions for confirmed appointments
4. **Feedback and Rating System**: Add comprehensive feedback and rating system for appointments
5. **Dynamic Feedback Display**: Show feedback and ratings dynamically on home screen
6. **Patient Appointment Screen**: Create patient appointment screen similar to doctor appointment screen
7. **Audio Call Feature**: Complete WebRTC-based audio calls between doctors and patients

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

## 🚀 Deployment

### 🐳 Docker Deployment (Recommended - 15 minutes)

MediConnect includes comprehensive Docker support for easy deployment to AWS, Azure, or any cloud platform.

#### Quick Docker Setup
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

#### AWS Deployment
1. **Set up MongoDB Atlas** (5 minutes)
2. **Configure AWS S3** (5 minutes)
3. **Launch EC2 instance** (5 minutes)
4. **Deploy with Docker** (5 minutes)

**Total time: ~20 minutes**

For detailed deployment instructions, see:
- [Quick Start Guide](deployment/QUICK_START.md) - Step-by-step deployment
- [Docker Deployment Guide](deployment/DOCKER_DEPLOYMENT.md) - Comprehensive Docker guide
- [AWS Setup Guide](deployment/aws-setup.md) - Manual AWS deployment

### 🔧 Manual Deployment (Legacy - 45 minutes)

Traditional deployment method for custom server configurations.

See [deployment/README.md](deployment/README.md) for complete deployment documentation.

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
│   │   │   ├── DatePicker.js    # Date picker component
│   │   │   ├── DatePicker.css   # Date picker styles
│   │   │   ├── TimePicker.js    # Time picker component
│   │   │   ├── TimePicker.css   # Time picker styles
│   │   │   └── ...              # Other components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # Global styles
│   │   │   └── Common.css # Global utilities and shared styles
│   │   └── utils/         # Utility functions
│   └── public/
├── deployment/             # Deployment files and scripts
│   ├── QUICK_START.md     # Quick deployment guide
│   ├── DOCKER_DEPLOYMENT.md # Docker deployment guide
│   ├── aws-setup.md       # AWS setup guide
│   ├── docker-deploy.sh   # Docker deployment script
│   └── ...                # Other deployment files
├── Dockerfile             # Backend Docker configuration
├── docker-compose.yml     # Development Docker setup
├── docker-compose.prod.yml # Production Docker setup
└── docs/                  # Documentation
```

## 🔧 Development Guidelines

### Code Quality
- Follow consistent naming conventions
- Implement proper error handling
- Add comprehensive logging
- Write unit tests for critical functions

### Component Architecture
- **Modular Components**: Create reusable components with their own CSS files
- **CSS Organization**: Keep component-specific styles in dedicated CSS files (e.g., `DatePicker.css`, `TimePicker.css`)
- **Global Styles**: Use `Common.css` only for truly global styles and utilities
- **Component Imports**: Import component CSS within the component file, not in consuming components
- **Consistent Pattern**: Follow established patterns for component structure and styling

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
- [x] Doctor schedule management
- [x] Booking modal enhancements
- [x] Deep linking and navigation
- [ ] Feedback and rating system
- [ ] Audio call feature
- [ ] Patient appointment screen 