// Zod şeması ile request body doğrulama middleware'i.
// Hatalı veride 400 + alan başına detay döner.
export const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) {
    return res.status(400).json({
      error: "Geçersiz istek gövdesi",
      details: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  req.body = r.data;
  next();
};
