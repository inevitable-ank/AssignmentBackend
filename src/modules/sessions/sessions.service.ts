import { prisma } from "../../config/prisma";
import crypto from "crypto";

export interface SessionData {
  device: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
}

export const createSession = async (userId: string, token: string, sessionData: SessionData) => {
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      device: sessionData.device,
      browser: sessionData.browser,
      os: sessionData.os,
      ipAddress: sessionData.ipAddress,
      location: sessionData.location,
    },
  });

  return session;
};

export const getUserSessions = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: "desc" },
    select: {
      id: true,
      device: true,
      browser: true,
      os: true,
      ipAddress: true,
      location: true,
      lastActive: true,
      createdAt: true,
    },
  });

  return sessions;
};

export const updateSessionActivity = async (token: string) => {
  await prisma.session.updateMany({
    where: { token },
    data: { lastActive: new Date() },
  });
};

export const revokeSession = async (sessionId: string, userId: string) => {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    const error = new Error("Session not found");
    (error as any).statusCode = 404;
    throw error;
  }

  await prisma.session.delete({
    where: { id: sessionId },
  });

  return { message: "Session revoked successfully" };
};

export const revokeAllOtherSessions = async (userId: string, currentToken: string) => {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      token: { not: currentToken },
    },
  });

  return {
    message: `${result.count} session(s) revoked successfully`,
    count: result.count,
  };
};

export const deleteExpiredSessions = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await prisma.session.deleteMany({
    where: {
      lastActive: {
        lt: sevenDaysAgo,
      },
    },
  });
};

