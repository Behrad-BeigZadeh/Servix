import { Response, Request } from "express";
import { AuthenticatedRequest } from "../middleware/midddleware";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { updateUserSchema } from "../schemas/userSchema";

interface UserIdParamRequest extends Request {
  params: {
    id: string;
  };
}

export const authUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
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
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { avatar, password, username, email } = parsed.data;

    let updateData: any = {};
    if (avatar) updateData.avatar = avatar;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
