import { createContext } from "react";
import type {
  FlightDTO,
  RiskFlightItem,
  KpiSummary,
  DisruptionDTO,
  AnalyticsData,
} from "../api/irrops";

export interface AiAlert {
  disruptionId: string;
  flightNo: string;
  route: string;
  delayProbability: number;
  expectedDelayMin: number;
  band: string;
  reason: string;
  affectedCount: number;
  careActions: { hotel: number; meal: number; refund: number };
}

export interface LiveDataState {
  flights: FlightDTO[];
  riskItems: RiskFlightItem[];
  kpi: KpiSummary | null;
  disruptions: DisruptionDTO[];
  analytics: AnalyticsData | null;
  lastAlert: AiAlert | null;
  lastRefreshedAt: Date;
  isLoading: boolean;
  riskMap: Record<string, number>;
  refreshFlights: () => void;
  refreshRisk: () => void;
  refreshDisruptions: () => void;
  refreshAnalytics: () => void;
  refreshAll: () => void;
}

export const LiveDataContext = createContext<LiveDataState | null>(null);
