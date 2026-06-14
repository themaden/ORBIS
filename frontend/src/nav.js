import { Plane, BrainCircuit, Users, MessageSquare, Settings } from "lucide-react";

// Sidebar ve Layout (başlık) tarafından paylaşılan tek navigasyon kaynağı
export const NAV = [
  {
    path: "/",
    title: "Global Operasyon Komuta Merkezi",
    label: "Gerçek Zamanlı\nOperasyonlar",
    icon: Plane,
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
