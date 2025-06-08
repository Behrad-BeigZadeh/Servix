"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getSingleService = exports.getProviderServices = exports.getFeaturedServices = exports.getAllServices = void 0;
const prisma_1 = require("../lib/prisma");
const serviceSchema_1 = require("../schemas/serviceSchema");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const getAllServices = async (req, res) => {
    try {
        const services = await prisma_1.prisma.service.findMany({
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
        return res.status(200).json({ data: services });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllServices = getAllServices;
const getFeaturedServices = async (req, res) => {
    try {
        const featuredServices = await prisma_1.prisma.service.findMany({
            take: 4,
            orderBy: {
                createdAt: "desc",
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
        return res.status(200).json({ data: featuredServices });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getFeaturedServices = getFeaturedServices;
const getProviderServices = async (req, res) => {
    try {
        const { providerId } = req.params;
        const services = await prisma_1.prisma.service.findMany({
            where: {
                providerId,
            },
            include: {
                category: true,
                provider: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        if (services.length === 0) {
            return res.status(404).json({ error: "Service not found" });
        }
        return res.status(200).json({ data: services });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProviderServices = getProviderServices;
const getSingleService = async (req, res) => {
    try {
        const service = await prisma_1.prisma.service.findUnique({
            where: { id: req.params.id },
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
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }
        return res.status(200).json({ data: service });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getSingleService = getSingleService;
const createService = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== "PROVIDER") {
            return res
                .status(403)
                .json({ error: "Only providers can create services" });
        }
        //  Step 1: Validate the body first
        const parsed = serviceSchema_1.serviceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: parsed.error.errors.map((err) => ({
                    path: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        const { title, description, price, categoryId } = parsed.data;
        //  Step 2: Validate file presence and type
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "Image is required" });
        }
        if (!file.mimetype.startsWith("image/")) {
            return res.status(400).json({ error: "Invalid image file" });
        }
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.mimetype)) {
            return res
                .status(400)
                .json({ error: "Invalid file type. Only JPG and PNG are allowed." });
        }
        if (file.size > 2 * 1024 * 1024) {
            return res
                .status(400)
                .json({ error: "File size too large. Maximum size is 2MB." });
        }
        //  Step 3: Upload image
        let imageUrl;
        try {
            imageUrl = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({ folder: "servix/services" }, (error, result) => {
                    if (error || !result)
                        return reject(error);
                    resolve(result.secure_url);
                });
                stream.end(file.buffer);
            });
        }
        catch (uploadError) {
            return res.status(400).json({ error: "Invalid image file" });
        }
        //  Step 4: Create the service in DB
        const service = await prisma_1.prisma.service.create({
            data: {
                title,
                description,
                price,
                categoryId,
                providerId: user.id,
                images: [imageUrl],
            },
        });
        return res.status(200).json({ data: service });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user)
            return res.status(401).json({ error: "User not found" });
        if (user.role !== "PROVIDER") {
            return res
                .status(403)
                .json({ error: "Only providers can update services" });
        }
        const service = await prisma_1.prisma.service.findUnique({ where: { id } });
        if (!service)
            return res.status(404).json({ error: "Service not found" });
        if (service.providerId !== user.id) {
            return res
                .status(403)
                .json({ error: "You can only modify your own services" });
        }
        const parsed = serviceSchema_1.updateServiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }
        const { title, description, price, categoryId } = parsed.data;
        let imageUrls = service.images; // default to existing images
        // If a new image was uploaded, validate and upload it
        const file = req.file;
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png"];
            if (!allowedTypes.includes(file.mimetype)) {
                return res
                    .status(400)
                    .json({ error: "Invalid file type. Only JPG and PNG are allowed." });
            }
            if (file.size > 2 * 1024 * 1024) {
                return res
                    .status(400)
                    .json({ error: "File size too large. Maximum size is 2MB." });
            }
            const imageUrl = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({
                    folder: "servix/services",
                }, (error, result) => {
                    if (error || !result)
                        return reject(error);
                    resolve(result.secure_url);
                });
                stream.end(file.buffer);
            });
            imageUrls = [imageUrl]; // Replace existing images with the new one
        }
        const updated = await prisma_1.prisma.service.update({
            where: { id },
            data: {
                title,
                description,
                price,
                categoryId,
                images: imageUrls,
            },
        });
        return res.status(200).json({ data: updated });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateService = updateService;
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: "User not found" });
        if (user.role !== "PROVIDER")
            return res
                .status(403)
                .json({ error: "Only providers can delete services" });
        const service = await prisma_1.prisma.service.findUnique({ where: { id } });
        if (!service)
            return res.status(404).json({ error: "Service not found" });
        if (service.providerId !== user.id) {
            return res
                .status(403)
                .json({ error: "You can only delete your own services" });
        }
        const hasBookings = await prisma_1.prisma.booking.findFirst({
            where: { serviceId: id },
        });
        if (hasBookings) {
            return res.status(400).json({
                error: "Cannot delete a service that has been booked by users.",
            });
        }
        await prisma_1.prisma.service.delete({ where: { id } });
        return res.status(200).json({ data: service });
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteService = deleteService;
