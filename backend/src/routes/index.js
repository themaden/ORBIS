import { Router } from "express";
import { flights, fleet, resources } from "../data/mock.js";
import { getCrisisForecast } from "../services/aiClient.js";

export const router = Router();

router.get("/flights", (_req, res) => res.json(flights));
router.get("/fleet", (_req, res) => res.json(fleet));
router.get("/resources", (_req, res) => res.json(resources));

// Kriz tahmini — AI servisine vekillik eder (servis kapalıysa yerel tahmine düşer)
router.get("/crisis", async (_req, res) => {
  try {
    const forecast = await getCrisisForecast({ flights });
    res.json(forecast);
  } catch (err) {
    res.status(502).json({ error: "AI servisine ulaşılamadı", detail: String(err) });
  }
});
