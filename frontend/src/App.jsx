import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Operations from "./pages/Operations";
import AIAnalytics from "./pages/AIAnalytics";
import Resources from "./pages/Resources";
import Communications from "./pages/Communications";
import SettingsPage from "./pages/SettingsPage";
import { NAV } from "./nav";

function Layout() {
  const { pathname } = useLocation();
  const current = NAV.find((n) => n.path === pathname) || NAV[0];

  return (
    <div className="bg-command h-screen w-screen flex text-white relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <TopBar title={current.title} />
        <Outlet />
        <footer className="text-center text-xs text-white/40 py-3 shrink-0">
          © {new Date().getFullYear()} Turkish Airlines · ORBIS. Tüm hakları
          saklıdır.
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Operations />} />
        <Route path="/analiz" element={<AIAnalytics />} />
        <Route path="/kaynaklar" element={<Resources />} />
        <Route path="/iletisim" element={<Communications />} />
        <Route path="/ayarlar" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
