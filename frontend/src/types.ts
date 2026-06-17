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
  hourlyRisk: { saat: string; risk: number; gecikme: number; ucus: number }[];
  delayTypes: { tip: string; sayi: number }[];
  models: AnalyticsModel[];
}

export interface NavItem {
  path: string;
  title: string;
  label: string;
  icon: LucideIcon;
}

export type ChatRole = "Komuta" | "Pilot" | "Kabin" | "Yer";
export type MemberStatus = "online" | "idle" | "offline";

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  unread?: boolean;
  badge?: number;
  count?: number;
}

export interface ChannelCategory {
  name: string;
  channels: Channel[];
}

export interface ChatMessage {
  user: string;
  role: ChatRole;
  time: string;
  text: string;
}

export interface Member {
  name: string;
  role: ChatRole;
  status: MemberStatus;
}

export interface CommsSeed {
  categories: ChannelCategory[];
  members: Member[];
  messagesByChannel: Record<string, ChatMessage[]>;
}
