import express from "express";
import { verifyToken } from "../middleware/midddleware";
import {
  authUser,
  updateProfile,
  getUserServices,
} from "../controllers/users.controller";

const router = express.Router();

router.get("/auth-user", verifyToken, authUser);
router.put("/auth-user", verifyToken, updateProfile);
router.get("/:id/services", getUserServices);

export default router;
