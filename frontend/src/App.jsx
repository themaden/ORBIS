import { useState } from "react";
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
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="bg-command h-screen w-screen flex text-white relative overflow-hidden">
      {/* Mobil arka plan örtüsü */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0">
        <TopBar title={current.title} onMenu={() => setNavOpen(true)} />
        <Outlet />
        <footer className="text-center text-xs text-white/40 py-3 shrink-0 px-2">
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
