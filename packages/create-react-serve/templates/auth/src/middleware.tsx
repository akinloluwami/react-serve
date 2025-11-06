import {
  Response,
  useSetContext,
  type MiddlewareFunction,
} from "react-serve-js";
import { prisma } from "./config";
import { verifyToken } from "./auth";

// Auth middleware - verifies JWT token and attaches user to context
export const authMiddleware: MiddlewareFunction = async (req, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return <Response status={401} json={{ error: "No token provided" }} />;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return <Response status={401} json={{ error: "Invalid token" }} />;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return <Response status={401} json={{ error: "User not found" }} />;
    }

    // Attach user to context
    useSetContext("user", user);

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return <Response status={500} json={{ error: "Internal server error" }} />;
  }
};

// Logging middleware - logs requests
export const loggingMiddleware: MiddlewareFunction = (req, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  return next();
};
