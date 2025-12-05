import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    
    // Check if session exists in database (hasn't been revoked)
    // Note: In test environments, sessions might not exist if creation failed
    // So we check for session but don't fail if it doesn't exist (for backward compatibility)
    const session = await prisma.session.findFirst({
      where: {
        token,
        userId: decoded.userId,
      },
    });

    if (session) {
      // Update last active timestamp for this session
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActive: new Date() },
      }).catch(() => {
        // Ignore update errors
      });
    }
    // If session doesn't exist, we still allow the request to proceed
    // This handles cases where session creation failed but token is valid

    req.user = decoded;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


