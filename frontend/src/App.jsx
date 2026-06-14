import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Operations from "./pages/Operations";
import AIAnalytics from "./pages/AIAnalytics";
import Resources from "./pages/Resources";
import Communications from "./pages/Communications";
import SettingsPage from "./pages/SettingsPage";

const PAGES = {
  ops:       { title: "Global Operasyon Komuta Merkezi", Comp: Operations },
  ai:        { title: "Yapay Zeka Analizleri",            Comp: AIAnalytics },
  resources: { title: "Kaynak Yönetimi",                  Comp: Resources },
  comms:     { title: "İletişim Merkezi",                 Comp: Communications },
  settings:  { title: "Ayarlar",                          Comp: SettingsPage },
};

export default function App() {
  const [page, setPage] = useState("ops");
  const { title, Comp } = PAGES[page];

  return (
    <div className="bg-command h-screen w-screen flex text-white relative overflow-hidden">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <TopBar title={title} />
        <Comp />
        <footer className="text-center text-xs text-white/40 py-3 shrink-0">
          © {new Date().getFullYear()} Turkish Airlines · ORBIS. Tüm hakları saklıdır.
        </footer>
      </main>
    </div>
  );
}
