# B2C Booking API

A secure and scalable API-only backend built with Next.js 15 and MongoDB, designed to power the "My Bookings" section of a B2C travel platform. This project provides comprehensive booking management, user authentication, traveller management, and AI-powered booking summaries.

## 🚀 Features

### Core Functionality

- **🔐 JWT Authentication** with access and refresh tokens
- **👤 User Profile Management** (GET and PUT operations)
- **📋 Booking Management** with upcoming and completed bookings
- **👥 Traveller Management** (add, edit, delete travellers)
- **🤖 AI-Powered Booking Summaries** using OpenAI GPT
- **🗄️ MongoDB Integration** with LRU cache for connection pooling
- **📊 Database Seeding** with sample data for testing

### Security & Performance

- **🛡️ Comprehensive Error Handling** with proper HTTP status codes
- **✅ Input Validation** using Zod schemas
- **🔒 Advanced Security Features** (rate limiting, CORS, security headers)
- **📝 Security Logging** for monitoring and audit trails
- **⚡ LRU Caching** for improved performance
- **🔄 Connection Pooling** for database efficiency

## 🛠 Tech Stack

- **Framework**: Next.js 15.3.4 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (cloud)
- **Authentication**: JWT with bcryptjs
- **AI Integration**: OpenAI API (GPT-4)
- **Validation**: Zod
- **Caching**: LRU Cache
- **Styling**: Tailwind CSS
- **Development**: ESLint, Turbopack

## 🔒 Security Features

### Rate Limiting

- **Auth endpoints**: 5 attempts per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Strict endpoints**: 10 requests per 15 minutes (AI operations)

### Input Validation & Sanitization

- Email validation with proper format checking
- Password strength validation (8+ chars, uppercase, lowercase, number, special char)
- Input sanitization to prevent XSS attacks
- Zod schema validation for all endpoints

### Security Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy`: Comprehensive CSP policy

### CORS Protection

- Origin validation
- Configurable allowed origins
- Proper CORS headers for API routes

### Security Logging

- Authentication events (successful and failed)
- Rate limit violations
- Validation errors
- Security incidents
- Profile access and updates

### Global Security Middleware

- Applied to all routes
- Security headers on every response
- Origin validation for API routes
- CORS handling

## 📋 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration (Rate limited, input validation, security logging)
- `POST /api/auth/login` - User login (Rate limited, input validation, security logging)
- `POST /api/auth/refresh` - Token refresh (Protected, validation)

### User Profile

- `GET /api/user/profile` - Get user profile (Protected, security logging)
- `PUT /api/user/profile` - Update user profile (Protected, input sanitization)

### Bookings

- `GET /api/bookings?status=upcoming` - Get upcoming bookings (Protected, rate limited, security logging)
- `GET /api/bookings?status=completed` - Get completed bookings (Protected, rate limited, security logging)
- `POST /api/bookings/:id/summary` - Generate AI booking summary (Protected, strict rate limiting)

### Travellers

- `POST /api/travellers` - Add new traveller (Protected, input sanitization)
- `PUT /api/travellers/:traveller_id` - Update traveller (Protected, input sanitization)
- `DELETE /api/travellers/:traveller_id` - Delete traveller (Protected, security logging)

### Database

- `POST /api/seed` - Populate database with sample data

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Assignment_1_B2C_Booking_API
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/b2c-booking-api?retryWrites=true&w=majority

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
NODE_ENV=development
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 5. Seed Database

Make a POST request to `/api/seed` to populate the database with sample data:

```bash
curl -X POST http://localhost:3000/api/seed
```

## 📊 Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  firstName: string,
  lastName: string,
  phone?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Bookings Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  bookingId: string,
  destination: string,
  departureCity: string,
  travelDates: {
    departure: Date,
    return: Date
  },
  lastTravelDate: Date,
  status: 'upcoming' | 'completed',
  bookingType: 'flight' | 'hotel' | 'package',
  totalAmount: number,
  currency: string,
  travellers: Traveller[],
  createdAt: Date,
  updatedAt: Date
}
```

### Travellers Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  firstName: string,
  lastName: string,
  dateOfBirth: string,
  passportNumber?: string,
  nationality: string,
  isPrimary: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Sample Authentication Flow

1. **Signup**:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Login**:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

3. **Use Token**:

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <your-access-token>"
```

## 📝 API Examples

### Get Upcoming Bookings

```bash
curl -X GET "http://localhost:3000/api/bookings?status=upcoming" \
  -H "Authorization: Bearer <your-access-token>"
```

### Add New Traveller

```bash
curl -X POST http://localhost:3000/api/travellers \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "dateOfBirth": "1990-01-01",
    "nationality": "US",
    "isPrimary": false
  }'
```

### Generate AI Booking Summary

```bash
curl -X POST http://localhost:3000/api/bookings/64f8a1b2c3d4e5f6a7b8c9d0/summary \
  -H "Authorization: Bearer <your-access-token>"
```

## 🛡️ Security Monitoring

The application logs security events including:

- Login attempts (successful and failed)
- Rate limit violations
- Authentication failures
- Input validation errors
- Profile access and updates
- Traveller management operations

Monitor these logs for security incidents and unusual patterns.

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **Rate Limiting**: Monitor rate limit violations for potential attacks
3. **Input Validation**: All user inputs are validated and sanitized
4. **Password Security**: Strong password requirements enforced
5. **Token Security**: Short-lived access tokens with refresh mechanism
6. **CORS**: Configure allowed origins properly for production
7. **Logging**: Monitor security logs regularly
8. **Updates**: Keep dependencies updated for security patches

## 🚀 Production Considerations

1. Use strong, unique secrets for JWT tokens
2. Configure proper CORS origins for production domains
3. Set up proper logging and monitoring
4. Use HTTPS in production
5. Consider implementing additional security measures like:
   - IP whitelisting
   - Two-factor authentication
   - Account lockout policies
   - Security audit logging

## 📚 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── bookings/          # Booking management
│   │   ├── travellers/        # Traveller management
│   │   ├── user/              # User profile
│   │   └── seed/              # Database seeding
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── lib/
│   ├── models/                # Data models and validation
│   ├── services/              # Business logic services
│   ├── auth.ts                # Authentication utilities
│   ├── db.ts                  # Database connection
│   ├── jwt.ts                 # JWT utilities
│   ├── security.ts            # Security middleware
│   └── seed.ts                # Database seeding logic
└── middleware.ts              # Global middleware
```

## 🧪 Testing

The project includes a Postman collection (`b2c-booking-api.postman_collection.json`) with pre-configured requests for all endpoints.

### Sample Users (after seeding)

- Email: `john.doe@example.com`, Password: `password123`
- Email: `jane.smith@example.com`, Password: `password123`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.
