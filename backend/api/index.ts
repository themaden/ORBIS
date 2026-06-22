import dotenv from "dotenv";
dotenv.config();

import { createApp } from "../src/app.js";

const app = createApp({ origin: process.env.FRONTEND_ORIGIN || "*" });

export default app;
