"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServicesByCategory = exports.getAllCategories = void 0;
const prisma_1 = require("../lib/prisma");
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({
            orderBy: { name: "asc" },
        });
        res.status(200).json(categories);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
};
exports.getAllCategories = getAllCategories;
const getServicesByCategory = async (req, res) => {
    try {
        const rawCategory = req.query.category;
        if (!rawCategory || Array.isArray(rawCategory)) {
            return res.status(400).json({ message: "Valid category is required." });
        }
        const category = decodeURIComponent(rawCategory);
        const services = await prisma_1.prisma.service.findMany({
            where: {
                category: {
                    name: category,
                },
            },
            include: {
                provider: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                category: true,
            },
        });
        return res.json(services);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getServicesByCategory = getServicesByCategory;
