"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = exports.Logout = exports.Login = exports.Signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utils/jwt");
const authSchema_1 = require("../schemas/authSchema");
const hash_1 = require("../utils/hash");
const Signup = async (req, res) => {
    try {
        const parsed = authSchema_1.registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }
        const { username, email, password, role } = parsed.data;
        const existingUserByUsername = await prisma_1.prisma.user.findUnique({
            where: { username },
        });
        if (existingUserByUsername) {
            return res.status(400).json({ error: "Username already taken" });
        }
        const existingUserByEmail = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUserByEmail) {
            return res.status(400).json({ error: "User already exists" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${username}`;
        const user = await prisma_1.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                avatar,
                role,
            },
        });
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        const hashedRefreshToken = await (0, hash_1.hashToken)(refreshToken);
        await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Error in signup controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.Signup = Signup;
const Login = async (req, res) => {
    try {
        const parsed = authSchema_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        const hashedRefreshToken = await (0, hash_1.hashToken)(refreshToken);
        await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Error in login controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.Login = Login;
const Logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(204).send();
        }
        const users = await prisma_1.prisma.user.findMany({
            where: {
                refreshToken: {
                    not: null,
                },
            },
        });
        let matchedUser;
        for (const user of users) {
            const isMatch = await bcrypt_1.default.compare(refreshToken, user.refreshToken);
            if (isMatch) {
                matchedUser = user;
                break;
            }
        }
        if (!matchedUser) {
            return res.status(204).send();
        }
        await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Error in logout controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.Logout = Logout;
const RefreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token not found" });
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch (err) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user || !user.refreshToken) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const isValid = await (0, hash_1.compareHashedToken)(refreshToken, user.refreshToken);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const accessToken = (0, jwt_1.generateAccessToken)(user.id);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(user.id);
        const newHashedToken = await (0, hash_1.hashToken)(newRefreshToken);
        await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Error in refresh token controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.RefreshToken = RefreshToken;
