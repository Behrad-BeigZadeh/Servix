"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserServices = exports.updateProfile = exports.authUser = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema_1 = require("../schemas/userSchema");
const authUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        return res.status(200).json({
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                services: user.services,
                bookings: user.bookings,
                createdAt: user.createdAt,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.log("Error in authUser controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.authUser = authUser;
const updateProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        const parsed = userSchema_1.updateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }
        const { avatar, password, username, email } = parsed.data;
        let updateData = {};
        if (avatar)
            updateData.avatar = avatar;
        if (username)
            updateData.username = username;
        if (email)
            updateData.email = email;
        if (password) {
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            updateData.password = hashedPassword;
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: updateData,
            include: {
                services: true,
                bookings: true,
            },
        });
        return res.status(200).json({
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                services: updatedUser.services,
                bookings: updatedUser.bookings,
                avatar: updatedUser.avatar,
                createdAt: updatedUser.createdAt,
            },
        });
    }
    catch (error) {
        console.log("Error in updateProfile controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateProfile = updateProfile;
const getUserServices = async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findFirst({
            where: { id: req.params.id, role: "PROVIDER" },
            include: {
                services: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const services = await prisma_1.prisma.service.findMany({
            where: { providerId: req.params.id },
        });
        return res.status(200).json({ data: { services } });
    }
    catch (error) {
        console.log("Error in getUserServices controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getUserServices = getUserServices;
