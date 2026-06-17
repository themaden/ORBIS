// IRROPS backend uç noktaları
import { api } from "./http";

export interface KpiSummary {
  riskIndex: number;
  riskLevel: string;
  riskFactors: { name: string; contribution: number }[];
  riskSuggestions: string[];
  riskSource: string;
  totalFlights: number;
  cancelled: number;
  delayed: number;
  openDisruptions: number;
  affectedPassengers: number;
  avgLoadFactor: number;
}

export interface DisruptionDTO {
  id: string;
  type: string;
  reason: string;
  startedAt: string;
  resolved: boolean;
  flight: {
    flightNo: string;
    depAirport: { iata: string; city: string };
    arrAirport: { iata: string; city: string };
  };
}

export interface ProposalOption {
  toFlightId: string;
  toFlightNo: string;
  rank: number;
  addedDelayMin: number;
  fitScore: number;
  rationale: string;
}

export interface RecommendedPassenger {
  passengerId: string;
  fullName: string;
  ticketClass: string;
  loyalty: string;
  specialNeed: string;
  hasConnection: boolean;
  score: number;
  options: ProposalOption[];
  care: { type: string; amount: number; note: string } | null;
}

export interface RevenueImpact {
  distanceKm: number;
  eligibleForEu261: boolean;
  compPerPax: number;
  totalEu261: number;
  totalCare: number;
  estimatedRevenueLoss: number;
  grandTotal: number;
  currency: string;
  breakdown: { hotel: number; meal: number; compensation: number; revenueLoss: number };
}

export interface RecommendResult {
  disruptionId: string;
  flightNo: string;
  affectedCount: number;
  alternativeCount: number;
  method: string;
  revenueImpact: RevenueImpact;
  passengers: RecommendedPassenger[];
  briefing?: string;
  briefingSource?: string;
}

export interface NotificationItem {
  passengerId: string;
  fullName: string;
  email: string;
  ticketClass: string;
  loyalty: string;
  hasRebooking: boolean;
  careType: string | null;
  status: "ready" | "pending";
  sms: string;
  emailSubject: string;
  emailBody: string;
}

export interface NotificationsResult {
  disruptionId: string;
  flightNo: string;
  route: string;
  totalPassengers: number;
  readyCount: number;
  pendingCount: number;
  notifications: NotificationItem[];
}

export interface ScenarioItem {
  id: string;
  label: string;
  icon: string;
  delayMin: number;
  paxImpact: number;
  care: { meal: number; hotel: number; transfer: number };
  eu261: number;
  rebookingLoad: number;
  revenueLoss: number;
  totalCost: number;
  operationalScore: number;
  recommendation: string;
}

export interface ScenariosResult {
  disruptionId: string;
  flightNo: string;
  route: string;
  distanceKm: number;
  paxCount: number;
  businessCount: number;
  economyCount: number;
  isWeatherExempt: boolean;
  eu261PerPax: number;
  currency: string;
  scenarios: ScenarioItem[];
}

export interface ModelInfo {
  delayModel: string;
  dataSource: string;
  note: string;
  maeMin: number;
  rmseMin: number;
  auc: number;
  precision: number;
  recall: number;
  f1: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  featureImportances: Record<string, number>;
  nTrain: number;
  nTest: number;
}

export const getModelInfo = () => api<ModelInfo>("/api/model/info");

export interface RiskFlightItem {
  id: string;
  flightNo: string;
  route: string;
  scheduledDep: string;
  delayProbability: number | null;
  expectedDelayMin: number | null;
  band: string | null;
}
export const getFlightRisk = () =>
  api<{ aiAvailable: boolean; items: RiskFlightItem[] }>("/api/risk/flights");

export interface FlightDTO {
  id: string;
  flightNo: string;
  status: string;
  scheduledDep: string;
  delayMin: number;
  depAirport: { iata: string };
  arrAirport: { iata: string; city: string };
}
export const getFlights = () => api<FlightDTO[]>("/api/flights");

export interface ResourceFleetItem {
  code: string;
  model: string;
  status: string;
  route: string;
  progress: number;
}
export interface ResourceStat {
  label: string;
  value: string;
  hint: string;
  accent: string;
}
export interface ResourceUsage {
  label: string;
  v: number;
  icon: string;
}
export const getResourceFleet = () => api<ResourceFleetItem[]>("/api/resources/fleet");
export const getResourceStats = () => api<ResourceStat[]>("/api/resources/stats");
export const getResourceUsage = () => api<ResourceUsage[]>("/api/resources/usage");

export const getKpi = () => api<KpiSummary>("/api/kpi/summary");
export const getDisruptions = () => api<DisruptionDTO[]>("/api/disruptions");

export interface AnalyticsData {
  stats: { label: string; value: string; hint: string; accent: string }[];
  hourlyRisk: { saat: string; risk: number; gecikme: number; ucus: number }[];
  delayTypes: { tip: string; sayi: number }[];
  models: { name: string; v: string; icon: string }[];
}
export const getAnalytics = () => api<AnalyticsData>("/api/analytics");
export const recommend = (id: string) =>
  api<RecommendResult>(`/api/disruptions/${id}/recommend`, { method: "POST", auth: true });
export const applyProposal = (id: string, passengerId: string, toFlightId: string) =>
  api<{ ok: boolean }>(`/api/disruptions/${id}/apply`, {
    method: "POST",
    auth: true,
    body: { passengerId, toFlightId },
  });
export const getNotifications = (id: string) =>
  api<NotificationsResult>(`/api/disruptions/${id}/notifications`, { auth: true });
export const getScenarios = (id: string) =>
  api<ScenariosResult>(`/api/disruptions/${id}/scenarios`, { auth: true });

// ---- Settings ----
export interface CostParam { id: string; key: string; value: number; note: string | null }
export const getCostParams = () => api<CostParam[]>("/api/settings/params", { auth: true });
export const updateCostParams = (updates: { key: string; value: number }[]) =>
  api<{ ok: boolean; updated: number }>("/api/settings/params", {
    method: "PUT", auth: true, body: { updates },
  });

export interface ModelVersion {
  version: string; trainedAt: string; source: string;
  mae: number; rmse: number; auc: number; f1: number;
  nTrain: number; nTest: number; active: boolean;
}
export const getModelVersions = () =>
  api<ModelVersion[]>("/api/settings/model/versions", { auth: true });

export interface AccuracyStats {
  ai: { totalPredictions: number; correctWithin30Min: number; accuracy30: number; avgAbsError: number } | null;
  db: { totalPredictions: number; verifiedCount: number; correctWithin30: number; accuracy30: number | null; avgAbsError: number };
}
export const getAccuracyStats = () =>
  api<AccuracyStats>("/api/settings/model/accuracy", { auth: true });
export const triggerRetrain = (maxRows?: number) =>
  api<{ ok: boolean; message: string }>("/api/settings/model/retrain", {
    method: "POST", auth: true, body: { maxRows: maxRows ?? 500_000 },
  });
export const getRetrainStatus = () =>
  api<{ running: boolean; result: unknown; error: string | null }>("/api/settings/model/retrain/status", { auth: true });

export interface GdprSummary {
  totalPassengers: number; withEmail: number; withPhone: number;
  anonymized: number; personalDataCount: number; gdprNote: string;
}
export const getGdprSummary = () =>
  api<GdprSummary>("/api/settings/gdpr/summary", { auth: true });
export const anonymizePassenger = (id: string) =>
  api<{ ok: boolean; anonId?: string; alreadyAnonymized?: boolean }>(
    `/api/settings/gdpr/anonymize/${id}`, { method: "POST", auth: true }
  );
