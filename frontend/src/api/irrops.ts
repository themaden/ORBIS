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
  passengers: RecommendedPassenger[];
}

export const getKpi = () => api<KpiSummary>("/api/kpi/summary");
export const getDisruptions = () => api<DisruptionDTO[]>("/api/disruptions");
export const recommend = (id: string) =>
  api<RecommendResult>(`/api/disruptions/${id}/recommend`, { method: "POST", auth: true });
