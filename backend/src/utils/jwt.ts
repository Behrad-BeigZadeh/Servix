import jwt, { JwtPayload } from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch (err) {
    throw new Error("Access token invalid or expired");
  }
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
};

export const getUserFromToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as { id: string; username: string; role: string };
  } catch {
    return null;
  }
};
