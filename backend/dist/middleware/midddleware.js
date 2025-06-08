"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../lib/prisma");
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                services: true,
                bookings: true,
            },
        });
        if (!user) {
            res.status(401).json({ error: "User not found" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.verifyToken = verifyToken;
