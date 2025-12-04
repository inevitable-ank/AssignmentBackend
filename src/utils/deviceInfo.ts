import type { Request } from "express";

export interface DeviceInfo {
  device: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
}

export const extractDeviceInfo = (req: Request): DeviceInfo => {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || "Unknown";

  // Extract browser (check Edge and Opera before Chrome since they contain "Chrome" in user agent)
  let browser = "Unknown Browser";
  if (userAgent.includes("Edg/") || userAgent.includes("Edge/")) browser = "Edge";
  else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) browser = "Opera";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";

  // Extract OS
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "MacOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  // Create device string
  let device = `${browser} on ${os}`;
  if (userAgent.includes("Mobile")) {
    device = `${browser} on ${os} (Mobile)`;
  }

  return {
    device,
    browser,
    os,
    ipAddress,
  };
};

