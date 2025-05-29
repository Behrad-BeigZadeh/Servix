import express from "express";
import {
  Login,
  Signup,
  Logout,
  RefreshToken,
} from "../controllers/auth.controller";
import { verifyToken } from "../middleware/midddleware";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/logout", Logout);
router.post("/refresh-token", RefreshToken);

export default router;
