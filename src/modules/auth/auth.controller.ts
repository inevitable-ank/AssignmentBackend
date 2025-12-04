import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, getProfile, updateProfile, changePassword } from "./auth.service";
import { extractDeviceInfo } from "../../utils/deviceInfo";

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceInfo = extractDeviceInfo(req);
    const result = await registerUser(req.body, deviceInfo);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceInfo = extractDeviceInfo(req);
    const result = await loginUser(req.body, deviceInfo);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await getProfile(req.user.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await updateProfile(req.user.userId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const changePasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await changePassword(req.user.userId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


