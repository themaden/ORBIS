import { Router } from "express";
import { authRouter } from "./auth.js";
import { flightsRouter } from "./flights.js";
import { disruptionsRouter } from "./disruptions.js";
import { kpiRouter } from "./kpi.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/flights", flightsRouter);
router.use("/disruptions", disruptionsRouter);
router.use("/kpi", kpiRouter);
