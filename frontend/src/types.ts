import type { LucideIcon } from "lucide-react";

export type DelayLevel = "Düşük" | "Orta" | "Yüksek";

export interface Delay {
  region: string;
  level: DelayLevel;
  extraHours: number;
}

export interface Crisis {
  riskIndex: number;
  delays: Delay[];
  suggestions: string[];
  updatedAt?: number;
}

export interface FleetItem {
  code: string;
  model: string;
  status: "Uçuşta" | "Bakımda" | "Kapıda";
  route: string;
  progress: number;
}

export interface StatItem {
  label: string;
  value: string;
  hint: string;
  accent: string;
}

export interface ResourceUsageItem {
  label: string;
  v: number;
  icon: string;
}

export interface AnalyticsModel {
  name: string;
  v: string;
  icon: string;
}

export interface Analytics {
  stats: StatItem[];
  bars: number[];
  months: string[];
  models: AnalyticsModel[];
  suggestions: string[];
}

export interface NavItem {
  path: string;
  title: string;
  label: string;
  icon: LucideIcon;
}
