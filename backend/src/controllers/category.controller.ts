import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Failed to fetch categories", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getServicesByCategory = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const rawCategory = req.query.category;

    if (!rawCategory || Array.isArray(rawCategory)) {
      return res.status(400).json({ message: "Valid category is required." });
    }

    const category = decodeURIComponent(rawCategory as string);

    const services = await prisma.service.findMany({
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
  } catch (error) {
    console.error("Error fetching services by category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
