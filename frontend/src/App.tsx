import { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import RequireAuth from "./components/RequireAuth";
import { NAV } from "./nav";

// Sayfalar tembel yüklenir (her sayfa ayrı bundle parçası)
const Operations = lazy(() => import("./pages/Operations"));
const Irrops = lazy(() => import("./pages/Irrops"));
const AIAnalytics = lazy(() => import("./pages/AIAnalytics"));
const Resources = lazy(() => import("./pages/Resources"));
const Communications = lazy(() => import("./pages/Communications"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const Login = lazy(() => import("./pages/Login"));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/15 border-t-thy rounded-full animate-spin" />
    </div>
  );
}

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
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 flex flex-col min-h-0"
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.div>
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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/giris" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Operations />} />
        <Route path="/irrops" element={<Irrops />} />
        <Route path="/analiz" element={<AIAnalytics />} />
        <Route path="/kaynaklar" element={<Resources />} />
        <Route path="/iletisim" element={<Communications />} />
        <Route path="/ayarlar" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
