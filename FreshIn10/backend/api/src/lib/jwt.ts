import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "freshin10-jwt-secret-min-32-chars-change-in-prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "freshin10-refresh-secret-min-32-chars-change";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
