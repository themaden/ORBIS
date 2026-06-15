import { Plane, BrainCircuit, Users, MessageSquare, Settings, AlertTriangle } from "lucide-react";
import type { NavItem } from "./types";

// Sidebar ve Layout (başlık) tarafından paylaşılan tek navigasyon kaynağı
export const NAV: NavItem[] = [
  {
    path: "/",
    title: "Global Operasyon Komuta Merkezi",
    label: "Gerçek Zamanlı\nOperasyonlar",
    icon: Plane,
  },
  {
    path: "/irrops",
    title: "IRROPS — Aksaklık Yönetimi",
    label: "IRROPS / Aksaklık",
    icon: AlertTriangle,
  },
  {
    path: "/analiz",
    title: "Yapay Zeka Analizleri",
    label: "Yapay Zeka Analizleri",
    icon: BrainCircuit,
  },
  {
    path: "/kaynaklar",
    title: "Kaynak Yönetimi",
    label: "Kaynak Yönetimi",
    icon: Users,
  },
  {
    path: "/iletisim",
    title: "İletişim Merkezi",
    label: "İletişim Merkezi",
    icon: MessageSquare,
  },
  {
    path: "/ayarlar",
    title: "Ayarlar",
    label: "Ayarlar",
    icon: Settings,
  },
];
