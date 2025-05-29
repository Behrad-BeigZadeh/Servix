import express from "express";
import { verifyToken } from "../middleware/midddleware";
import {
  getAllServices,
  getSingleService,
  updateService,
  deleteService,
  createService,
  getProviderServices,
  getFeaturedServices,
} from "../controllers/services.controller";
import { upload } from "../middleware/multer";

const router = express.Router();
router.get("/", getAllServices);
router.get("/featured", getFeaturedServices);
router.post("/", verifyToken, upload.single("image"), createService);
router.get("/provider/:providerId", verifyToken, getProviderServices);
router.get("/:id", getSingleService);
router.put("/:id", verifyToken, upload.single("image"), updateService);
router.delete("/:id", verifyToken, deleteService);

export default router;
