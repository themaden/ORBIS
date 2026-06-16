// Tüm veriler backend API'sinden — mock veri tamamen kaldırıldı.
import { api as httpApi } from "./http";
import type { Analytics } from "../types";

export const api = {
  // Gerçek backend: /api/analytics (DB'den canlı veri)
  getAnalytics: (): Promise<Analytics> => httpApi<Analytics>("/api/analytics"),
};
