import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { signToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const authRouter = Router();

const LoginBody = z.object({
  username: z.string().min(1, "Kullanıcı adı boş olamaz"),
  password: z.string().min(1, "Şifre boş olamaz"),
});

authRouter.post("/login", validate(LoginBody), async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: "Hatalı kullanıcı adı veya şifre" });

  res.json({
    token: signToken(user),
    user: { name: user.name, sicil: user.sicil, role: user.role },
  });
});
