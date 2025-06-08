import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import { compareHashedToken, hashToken } from "../utils/hash";
import { AuthenticatedRequest } from "../middleware/midddleware";

export const Signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { username, email, password, role } = parsed.data;

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUserByUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`;

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        avatar,
        role,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const hashedRefreshToken = await hashToken(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return res
      .status(201)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        data: {
          accessToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
          },
        },
      });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const Login = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const hashedRefreshToken = await hashToken(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        data: {
          accessToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const Logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(204).send();
    }
    const users = await prisma.user.findMany({
      where: {
        refreshToken: {
          not: null,
        },
      },
    });

    let matchedUser;

    for (const user of users) {
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken!);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(204).send();
    }

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: { refreshToken: null },
    });

    return res
      .clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({ data: { message: "User logged out successfully" } });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const RefreshToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token not found" });
    }
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const isValid = await compareHashedToken(refreshToken, user.refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    const newHashedToken = await hashToken(newRefreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashedToken },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
