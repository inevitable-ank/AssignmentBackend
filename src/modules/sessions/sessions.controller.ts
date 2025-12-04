import type { Request, Response, NextFunction } from "express";
import { getUserSessions, revokeSession, revokeAllOtherSessions } from "./sessions.service";

export const getSessionsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await getUserSessions(req.user.userId);
    
    // Get current token to mark current session
    const currentToken = req.headers.authorization?.split(" ")[1];
    
    // Find which session matches the current token
    const sessionsWithCurrent = await Promise.all(sessions.map(async (session) => {
      // Check if this session's token matches the current request token
      const sessionFromDb = await (await import("../../config/prisma")).prisma.session.findUnique({
        where: { id: session.id },
        select: { token: true },
      });
      
      return {
        ...session,
        current: sessionFromDb?.token === currentToken,
      };
    }));

    res.status(200).json({ sessions: sessionsWithCurrent });
  } catch (err) {
    next(err);
  }
};

export const revokeSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;
    const result = await revokeSession(sessionId, req.user.userId);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const revokeAllOtherSessionsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const result = await revokeAllOtherSessions(req.user.userId, token);
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

