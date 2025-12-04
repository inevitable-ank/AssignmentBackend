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
    const session = await prisma.session.findFirst({
      where: {
        token,
        userId: decoded.userId,
      },
    });

    if (!session) {
      return res.status(401).json({ 
        message: "Session has been revoked. Please sign in again." 
      });
    }

    // Update last active timestamp for this session
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    });

    req.user = decoded;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


