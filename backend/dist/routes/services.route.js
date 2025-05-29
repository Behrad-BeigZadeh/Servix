"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const midddleware_1 = require("../middleware/midddleware");
const services_controller_1 = require("../controllers/services.controller");
const multer_1 = require("../middleware/multer");
const router = express_1.default.Router();
router.get("/", services_controller_1.getAllServices);
router.get("/featured", services_controller_1.getFeaturedServices);
router.post("/", midddleware_1.verifyToken, multer_1.upload.single("image"), services_controller_1.createService);
router.get("/provider/:providerId", midddleware_1.verifyToken, services_controller_1.getProviderServices);
router.get("/:id", services_controller_1.getSingleService);
router.put("/:id", midddleware_1.verifyToken, multer_1.upload.single("image"), services_controller_1.updateService);
router.delete("/:id", midddleware_1.verifyToken, services_controller_1.deleteService);
exports.default = router;
