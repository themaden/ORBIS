import { Request, Response, NextFunction } from "express";

export interface AuthUser {
  sub: string;
  name: string;
  role: "IOCC" | "HUB_CONTROL" | "ADMIN";
  sicil: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ApiOptions {
  origin?: string;
  silent?: boolean;
}

export type AuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => void;
export type ValidateMiddleware = (schema: any) => (req: Request, res: Response, next: NextFunction) => void;

export interface KPIResponse {
  riskIndex: number;
  activeSituations: number;
  totalFlights: number;
  cancelledFlights: number;
  avgDelay: number;
  timestamp: string;
}

export interface FlightData {
  id: string;
  flightNumber: string;
  status: string;
  scheduledDep: Date;
  actualDep?: Date;
  scheduledArr: Date;
  actualArr?: Date;
}

export interface DisruptionData {
  id: string;
  flightId: string;
  type: "WEATHER" | "TECHNICAL" | "CREW" | "AIRPORT";
  reason?: string;
  status: string;
  createdAt: Date;
}

export interface WeatherData {
  temp: number;
  windSpeed: number;
  precipitation: number;
  severity: number;
}

export interface RiskScore {
  flightId: string;
  score: number;
  factors: string[];
}
