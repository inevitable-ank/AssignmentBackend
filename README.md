# 🎯 TaskFlow Backend API

> A robust RESTful API built with Node.js, Express, and Prisma for managing tasks and user authentication with advanced session management.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0+-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192.svg)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security Features](#-security-features)
- [Development](#-development)

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based authentication** with secure token management
- **Password hashing** using bcrypt with salt rounds
- **Session management** with real-time revocation
- **Device tracking** - Monitor all active sessions across devices
- **Instant session revocation** - Security-first approach

### 📝 Task Management
- **CRUD operations** for tasks with rich metadata
- **Task status tracking** (pending, in-progress, completed)
- **Priority levels** (low, medium, high)
- **Due dates** with optional recurrence
- **Recurrence patterns** (none, daily, weekly, monthly)

### 👤 User Management
- **Profile management** with email and username updates
- **Password change** with current password verification
- **User data isolation** - Each user's data is completely separate

### 🛡️ Session Security
- **Multi-device session tracking**
- **Real-time session validation** on every request
- **Automatic session cleanup** for expired sessions
- **Last active timestamp** tracking
- **Device and browser detection**

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime environment | 18+ |
| **TypeScript** | Type-safe JavaScript | 5.0+ |
| **Express** | Web framework | 4.18+ |
| **Prisma** | ORM & Database toolkit | 5.22+ |
| **PostgreSQL** | Primary database | 15+ |
| **JWT** | Authentication tokens | jsonwebtoken |
| **bcrypt** | Password hashing | bcryptjs |
| **Zod** | Schema validation | 3.22+ |
| **cors** | Cross-origin resource sharing | 2.8+ |
| **helmet** | Security headers | 7.0+ |
| **morgan** | HTTP request logger | 1.10+ |

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── migrations/                # Database migration history
├── src/
│   ├── config/
│   │   ├── env.ts                 # Environment configuration
│   │   └── prisma.ts              # Prisma client instance
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication middleware
│   │   └── errorHandler.ts       # Global error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts # Authentication endpoints
│   │   │   ├── auth.routes.ts     # Auth route definitions
│   │   │   ├── auth.schemas.ts    # Zod validation schemas
│   │   │   └── auth.service.ts    # Auth business logic
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.routes.ts
│   │   │   ├── tasks.schemas.ts
│   │   │   └── tasks.service.ts
│   │   └── sessions/
│   │       ├── sessions.controller.ts
│   │       ├── sessions.routes.ts
│   │       └── sessions.service.ts
│   ├── utils/
│   │   └── deviceInfo.ts          # Device detection utilities
│   ├── app.ts                     # Express app configuration
│   └── server.ts                  # Server entry point
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ running ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#-environment-variables))

4. **Set up the database**
   ```bash
   # Run migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be running at `http://localhost:4000` 🎉

---

## 🔑 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/database_name?schema=public"

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Configuration Details

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | - |
| `PORT` | Server port number | ❌ No | 4000 |
| `NODE_ENV` | Environment (development/production) | ❌ No | development |
| `JWT_SECRET` | Secret key for JWT signing | ✅ Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | ❌ No | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | ❌ No | * |

---

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### 🔓 Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### 🔐 Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

#### 👤 Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2024-12-05T00:00:00.000Z",
    "updatedAt": "2024-12-05T00:00:00.000Z"
  }
}
```

#### ✏️ Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### 🔒 Change Password
```http
POST /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

---

### Task Endpoints

#### 📋 Get All Tasks
```http
GET /api/tasks
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete project",
      "description": "Finish the TaskFlow application",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2024-12-31T00:00:00.000Z",
      "recurrence": "none",
      "createdAt": "2024-12-05T00:00:00.000Z",
      "updatedAt": "2024-12-05T00:00:00.000Z"
    }
  ]
}
```

#### ➕ Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "dueDate": "2024-12-31",
  "recurrence": "none"
}
```

#### ✏️ Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "priority": "high"
}
```

#### 🗑️ Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

---

### Session Management Endpoints

#### 🖥️ Get All Sessions
```http
GET /api/sessions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "device": "Chrome on Windows",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "192.168.1.100",
      "location": null,
      "lastActive": "2024-12-05T10:30:00.000Z",
      "createdAt": "2024-12-05T08:00:00.000Z",
      "current": true
    }
  ]
}
```

#### ❌ Revoke Session
```http
DELETE /api/sessions/:sessionId
Authorization: Bearer <token>
```

#### 🚫 Revoke All Other Sessions
```http
POST /api/sessions/revoke-all
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "2 session(s) revoked successfully",
  "count": 2
}
```

---

## 🗃️ Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tasks     Task[]
  sessions  Session[]
}
```

### Task Model
```prisma
model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?
  recurrence  Recurrence @default(NONE)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Session Model
```prisma
model Session {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  device     String
  browser    String?
  os         String?
  ipAddress  String?
  location   String?
  lastActive DateTime @default(now())
  createdAt  DateTime @default(now())
}
```

### Enums
```prisma
enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Recurrence {
  NONE
  DAILY
  WEEKLY
  MONTHLY
}
```

---

## 🛡️ Security Features

### 1. Password Security
- **bcrypt hashing** with 10 salt rounds
- **Password validation** (minimum 8 characters)
- **Current password verification** for password changes

### 2. JWT Authentication
- **Secure token generation** with expiration
- **Token validation** on protected routes
- **User payload** embedded in token

### 3. Session Security (⭐ Advanced Feature)
- **Real-time session validation** - Every API request checks if the session exists in the database
- **Instant revocation** - When a session is revoked, the user is immediately signed out
- **Multi-device tracking** - Users can see all active sessions
- **Device fingerprinting** - Tracks browser, OS, and IP address
- **Last active monitoring** - Auto-updates on each request

### 4. Database Security
- **Cascade deletion** - User deletion removes all associated data
- **Unique constraints** on email and username
- **SQL injection protection** via Prisma

### 5. API Security
- **CORS** enabled with configurable origins
- **Helmet.js** for security headers
- **Input validation** using Zod schemas
- **Error handling** without exposing sensitive info

---

## 👨‍💻 Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (Database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ Deletes all data)
npx prisma migrate reset

# Format code
npm run format
```

### Database Management

```bash
# View database in browser
npx prisma studio

# Create migration from schema changes
npx prisma migrate dev

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate
```

### Debugging

1. **Enable verbose logging**
   ```typescript
   // In app.ts
   app.use(morgan('dev'))
   ```

2. **Check Prisma queries**
   ```bash
   # Set in .env
   DEBUG=prisma:query
   ```

3. **View session data**
   ```bash
   npx prisma studio
   # Navigate to Session table
   ```

---

## 📝 Testing

The backend uses **Jest** and **Supertest** for comprehensive API testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
src/__tests__/
├── modules/
│   ├── auth.test.ts              # Authentication endpoint tests
│   ├── tasks.test.ts             # Task CRUD operation tests
│   └── sessions.test.ts          # Session management tests
├── middleware/
│   ├── auth.test.ts              # Authentication middleware tests
│   ├── errorHandler.test.ts      # Error handling middleware tests
│   └── validate.test.ts          # Request validation middleware tests
├── utils/
│   └── deviceInfo.test.ts        # Device detection utility tests
├── helpers.ts                    # Test helper functions
└── setup.ts                      # Test setup configuration
```

### Test Coverage

#### 🔐 **Authentication Module** (`modules/auth.test.ts`)

**POST /api/auth/register**:
- ✅ Registers a new user successfully
- ✅ Rejects registration with duplicate email (409)
- ✅ Rejects registration with duplicate username (409)
- ✅ Rejects registration with invalid email format (400)
- ✅ Rejects registration with short password (< 8 chars) (400)
- ✅ Rejects registration with short username (< 3 chars) (400)
- ✅ Handles registration with maximum length username
- ✅ Handles registration with special characters in username

**POST /api/auth/login**:
- ✅ Logs in with valid credentials
- ✅ Rejects login with invalid email (401)
- ✅ Rejects login with invalid password (401)
- ✅ Rejects login with invalid email format (400)
- ✅ Handles login with case-insensitive email

**GET /api/auth/profile**:
- ✅ Gets user profile with valid token
- ✅ Rejects request without token (401)
- ✅ Rejects request with invalid token (401)

**PUT /api/auth/profile**:
- ✅ Updates username successfully
- ✅ Updates email successfully
- ✅ Rejects update with duplicate email (409)
- ✅ Rejects update without token (401)
- ✅ Handles profile update with empty body (400)

**PUT /api/auth/password**:
- ✅ Changes password successfully
- ✅ Verifies new password works after change
- ✅ Rejects password change with incorrect current password (401)
- ✅ Rejects password change with short new password (400)
- ✅ Rejects password change without token (401)
- ✅ Allows password change with same password (design decision)

**Controller Guards**:
- ✅ getProfileHandler returns 401 when user is missing
- ✅ updateProfileHandler returns 401 when user is missing
- ✅ changePasswordHandler returns 401 when user is missing

#### 📋 **Tasks Module** (`modules/tasks.test.ts`)

**GET /api/tasks**:
- ✅ Gets empty tasks list for new user
- ✅ Gets all tasks for authenticated user (user isolation)
- ✅ Rejects request without token (401)
- ✅ Verifies users can only see their own tasks

**POST /api/tasks**:
- ✅ Creates a new task successfully
- ✅ Creates task with default values (status: pending, priority: medium, recurrence: none)
- ✅ Rejects task creation without title (400)
- ✅ Rejects task creation with empty title (400)
- ✅ Rejects task creation with invalid status (400)
- ✅ Rejects task creation without token (401)

**PUT /api/tasks/:id**:
- ✅ Updates task successfully
- ✅ Updates only provided fields (partial update)
- ✅ Rejects update of non-existent task (404)
- ✅ Rejects update of other user's task (404 - user isolation)
- ✅ Rejects update without token (401)

**DELETE /api/tasks/:id**:
- ✅ Deletes task successfully
- ✅ Verifies deletion removes task from list
- ✅ Rejects deletion of non-existent task (404)
- ✅ Rejects deletion of other user's task (404 - user isolation)
- ✅ Rejects deletion without token (401)

**Edge Cases**:
- ✅ Handles task with very long title (100+ chars)
- ✅ Handles task with very long description (500+ chars)
- ✅ Handles task update with all fields
- ✅ Handles task with special characters in title
- ✅ Handles multiple rapid task creations (concurrency)

#### 🔒 **Sessions Module** (`modules/sessions.test.ts`)

**GET /api/sessions**:
- ✅ Gets all user sessions
- ✅ Marks current session correctly
- ✅ Rejects request without token (401)
- ✅ Rejects request with invalid token (401)
- ✅ Verifies session structure (id, device, lastActive, createdAt)

**DELETE /api/sessions/:sessionId**:
- ✅ Revokes a session successfully
- ✅ Rejects revocation of non-existent session (404)
- ✅ Rejects revocation without token (401)

**POST /api/sessions/revoke-all**:
- ✅ Revokes all other sessions successfully
- ✅ Keeps current session active after revoke-all
- ✅ Returns correct count of revoked sessions
- ✅ Rejects request without token (401)

**Controller Guards**:
- ✅ getSessionsHandler returns 401 when user is missing
- ✅ revokeSessionHandler returns 401 when user is missing
- ✅ revokeAllOtherSessionsHandler returns 401 when token header missing

#### 🛡️ **Authentication Middleware** (`middleware/auth.test.ts`)

**requireAuth middleware**:
- ✅ Allows access with valid token
- ✅ Rejects request without Authorization header (401)
- ✅ Rejects request with malformed Authorization header (401)
- ✅ Rejects request with invalid token (401)
- ✅ Rejects request with expired token (401)
- ✅ Rejects request with token signed with wrong secret (401)
- ✅ Protects all task routes (GET, POST, PUT, DELETE)

#### ⚠️ **Error Handler Middleware** (`middleware/errorHandler.test.ts`)

**Error Handling**:
- ✅ Handles Zod validation errors (400)
- ✅ Handles 404 errors (not found)
- ✅ Handles 401 errors (unauthorized)
- ✅ Handles 409 conflict errors (duplicate resources)
- ✅ Handles 500 internal server errors gracefully

#### ✅ **Validation Middleware** (`middleware/validate.test.ts`)

**validateBody middleware**:
- ✅ Validates request body against schema
- ✅ Rejects invalid email format
- ✅ Rejects short password
- ✅ Rejects short username
- ✅ Validates task creation schema
- ✅ Rejects task creation without title
- ✅ Rejects invalid task status

#### 🔧 **Device Info Utility** (`utils/deviceInfo.test.ts`)

**extractDeviceInfo function**:
- ✅ Detects Edge on Windows with forwarded IP
- ✅ Detects Safari on iOS Mobile
- ✅ Falls back to Unknown when user-agent missing
- ✅ Extracts IP address from x-forwarded-for header
- ✅ Extracts IP address from request.ip

### Test Statistics

- **Total Test Files**: 7
- **Test Categories**:
  - Modules: 3 files (Auth, Tasks, Sessions)
  - Middleware: 3 files (Auth, ErrorHandler, Validate)
  - Utils: 1 file (DeviceInfo)

### Testing Best Practices

1. **Database Isolation**: Each test cleans the database before running (`cleanDatabase()`)
2. **Test Users**: Helper functions create test users with proper authentication
3. **Token Management**: Tests properly handle JWT tokens for authenticated requests
4. **User Isolation**: Tests verify users can only access their own data
5. **Error Scenarios**: Comprehensive coverage of error cases (400, 401, 404, 409, 500)
6. **Edge Cases**: Tests handle boundary conditions and special characters
7. **Concurrency**: Tests verify multiple rapid operations work correctly

### Coverage Reports

Coverage reports are generated in `backend/coverage/` directory after running:
```bash
npm run test:coverage
```

The coverage report includes:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

### Manual Testing with cURL

```bash
# Register a user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get tasks (use token from login response)
curl -X GET http://localhost:4000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  Made with ❤️ and ☕
  
</div>

