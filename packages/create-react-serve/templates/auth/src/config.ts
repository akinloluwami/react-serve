import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
export const prisma = new PrismaClient();

// JWT secret (in production, use environment variable)
export const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
export const PORT = parseInt(process.env.PORT || "4000");
