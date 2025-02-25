# Mualimas - Teacher Freelancing Platform

This platform is built on top of the Next.js SaaS Starter template. It provides a comprehensive solution for connecting teachers (Mualimas) with parents who are looking for educational services.

## Key Features

### For Teachers (Mualimas)
1. **Profile Management**
   - Create and update professional profile with qualifications, bio, and experience
   - Set hourly rates and upload profile pictures
   - Showcase teaching areas and subject expertise

2. **Availability Scheduling**
   - Manage weekly availability with flexible time slots
   - Set recurring or one-time availability
   - Maintain control over teaching schedule

3. **Service Offering**
   - Define subjects and teaching areas
   - Set pricing for services
   - Control availability for new students

4. **Reviews and Ratings**
   - Receive feedback from parents
   - Build reputation through ratings
   - Showcase testimonials on profile

5. **Booking Management**
   - Accept, reject, or reschedule booking requests
   - Track upcoming and past sessions
   - Manage session details

6. **Messaging System**
   - Communicate directly with parents
   - Discuss session details and requirements
   - Build relationships with students and parents

### For Parents
1. **Search Functionality**
   - Find teachers based on subjects, ratings, and price
   - Filter search results based on preferences
   - View detailed teacher profiles

2. **Booking System**
   - Request sessions with teachers
   - Select subjects and time slots
   - Provide session details and requirements

3. **Messaging**
   - Contact teachers directly
   - Discuss learning needs and goals
   - Communicate about bookings and sessions

4. **Payment Processing**
   - Securely pay for sessions through Stripe
   - Track payment history
   - Receive receipts for transactions

5. **Reviews**
   - Provide feedback after completed sessions
   - Rate teachers based on experience
   - Help other parents make informed decisions

## Technical Implementation

### Database Schema
- Extended the existing schema to support:
  - Teacher profiles
  - Subjects and teaching areas
  - Availability scheduling
  - Bookings and appointments
  - Messaging system
  - Reviews and ratings

### API Routes
- Created RESTful API endpoints for:
  - Teacher profiles and details
  - Availability management
  - Booking creation and management
  - Messaging system
  - User authentication

### Server Actions
- Implemented server actions for:
  - Teacher profile management
  - Availability scheduling
  - Booking processing
  - Messaging
  - Review submission

### Components
- Built UI components for:
  - Teacher profiles and search
  - Booking interface
  - Messaging system
  - Reviews and ratings
  - Availability scheduling

### Integration
- Integrated with Stripe for payment processing
- Used database relations for complex data relationships
- Implemented authentication and authorization for secure access

## Getting Started

1. Setup the database and environment variables as described in the main README
2. Run the database migrations to create the extended schema
3. Start the development server
4. Create a user account and set up a teacher profile

## Technical Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with HTTP-only cookies
- **Payments**: Stripe integration

## Development Notes

This platform is built as an extension to the existing Next.js SaaS Starter template. It leverages the existing authentication, user management, and team functionality while adding specialized features for a teacher freelancing marketplace.

The implementation follows modern web development practices:
- Server components for data fetching
- Client components for interactive UI
- Server actions for form handling
- API routes for client-side data access

For production deployment, ensure you've set up:
- Database connection
- Stripe API keys and webhook
- Proper authentication secrets
- Storage for profile images
