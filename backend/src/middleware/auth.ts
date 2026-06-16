import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, AuthUser } from "../types.js";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(user: any): string {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, sicil: user.sicil },
    SECRET,
    { expiresIn: "8h" }
  );
}

// Korumalı route'lar için: Authorization: Bearer <token>
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Yetkisiz" });
    return;
  }
  try {
    req.user = jwt.verify(token, SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "Geçersiz oturum" });
  }
}

// Rol bazlı erişim: requireRole("IOCC", "ADMIN")
export function requireRole(...allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Yetkisiz" });
      return;
    }
    if (!allowed.includes(req.user.role) && req.user.role !== "ADMIN") {
      res.status(403).json({
        error: "Bu işlem için yetkiniz yok",
        required: allowed,
        yourRole: req.user.role,
      });
      return;
    }
    next();
  };
}
