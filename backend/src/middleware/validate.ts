import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// Zod şeması ile request body doğrulama middleware'i.
// Hatalı veride 400 + alan başına detay döner.
export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction): void => {
  const r = schema.safeParse(req.body);
  if (!r.success) {
    res.status(400).json({
      error: "Geçersiz istek gövdesi",
      details: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  (req as any).body = r.data;
  next();
};
