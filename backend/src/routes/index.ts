import { Router } from "express";
import { authRouter } from "./auth.js";
import { flightsRouter } from "./flights.js";
import { disruptionsRouter } from "./disruptions.js";
import { kpiRouter } from "./kpi.js";
import { modelRouter } from "./model.js";
import { riskRouter } from "./risk.js";
import { resourcesRouter } from "./resources.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/flights", flightsRouter);
router.use("/disruptions", disruptionsRouter);
router.use("/kpi", kpiRouter);
router.use("/model", modelRouter);
router.use("/risk", riskRouter);
router.use("/resources", resourcesRouter);
