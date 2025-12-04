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
   cp .env.example .env
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

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` in production environment
- [ ] Configure production `DATABASE_URL`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Set appropriate `CORS_ORIGIN`
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up rate limiting (recommended)

### Deployment Platforms

- **Render** - Easy deployment with PostgreSQL addon
- **Railway** - Automatic deployments from Git
- **Heroku** - Classic PaaS with PostgreSQL support
- **DigitalOcean App Platform** - Managed deployment
- **AWS EC2/RDS** - Full control deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [JWT](https://jwt.io/) - JSON Web Token standard
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  Made with ❤️ and ☕
  
</div>

