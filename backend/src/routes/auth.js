import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { signToken } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/login  { username, password }
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli" });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: "Hatalı kullanıcı adı veya şifre" });

  res.json({
    token: signToken(user),
    user: { name: user.name, sicil: user.sicil, role: user.role },
  });
});
