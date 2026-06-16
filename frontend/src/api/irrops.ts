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

export interface RecommendResult {
  disruptionId: string;
  flightNo: string;
  affectedCount: number;
  alternativeCount: number;
  method: string;
  passengers: RecommendedPassenger[];
  briefing?: string;
  briefingSource?: string;
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
export const recommend = (id: string) =>
  api<RecommendResult>(`/api/disruptions/${id}/recommend`, { method: "POST", auth: true });
export const applyProposal = (id: string, passengerId: string, toFlightId: string) =>
  api<{ ok: boolean }>(`/api/disruptions/${id}/apply`, {
    method: "POST",
    auth: true,
    body: { passengerId, toFlightId },
  });
