import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, sicil: user.sicil },
    SECRET,
    { expiresIn: "8h" }
  );
}

// Korumalı route'lar için: Authorization: Bearer <token>
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Yetkisiz" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Geçersiz oturum" });
  }
}

// Rol bazlı erişim: requireRole("IOCC", "ADMIN")
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Yetkisiz" });
    if (!allowed.includes(req.user.role) && req.user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Bu işlem için yetkiniz yok",
        required: allowed,
        yourRole: req.user.role,
      });
    }
    next();
  };
}
