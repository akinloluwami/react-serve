# My ReactServe Auth App

A backend API with authentication built with [ReactServe](https://github.com/akinloluwami/react-serve) - a React-style framework for building APIs with JSX.

## Features

- 🔐 JWT-based authentication
- 👤 User registration and login
- 🔒 Protected routes with middleware
- 💾 Prisma ORM for database operations
- ✅ Request validation with Zod
- 🛡️ Password hashing with bcrypt

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to the database
npm run db:push

# (Optional) Seed the database
npm run db:seed
```

### 3. Start the development server

```bash
npm run dev
```

Your API will be running at http://localhost:4000

## Available Endpoints

### Public Routes

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID

### Protected Routes (Require Authentication)

- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update profile

## Authentication

To access protected routes, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Example: Sign Up

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securepassword123"
  }'
```

### Example: Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Example: Get Current User

```bash
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Project Structure

```
src/
  index.tsx           # Main application file
  config.ts           # Configuration and Prisma client
  auth.ts             # Authentication utilities
  middleware.tsx      # Auth middleware
  routes/
    auth.tsx          # Auth routes (signup, login, me, profile)
    users.tsx         # User routes (list, get by id)
prisma/
  schema.prisma       # Database schema
  seed.ts             # Database seeding script
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=4000
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed the database with sample data

## Learn More

- [ReactServe Documentation](https://github.com/akinloluwami/react-serve)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
