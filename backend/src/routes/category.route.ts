import { Router } from "express";
import {
  getAllCategories,
  getServicesByCategory,
} from "../controllers/category.controller";
const router = Router();

router.get("/", getAllCategories);
router.get("/services", getServicesByCategory);

export default router;
