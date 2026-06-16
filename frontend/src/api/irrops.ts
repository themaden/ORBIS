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
  note: string;
  maeMin: number;
  rmseMin: number;
  auc: number;
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
