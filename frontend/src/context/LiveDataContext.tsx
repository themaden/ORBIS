/**
 * LiveDataContext — Merkezi Canlı Veri Katmanı
 *
 * Haber bandı mantığı: Tüm API çağrıları ve WebSocket abonelikleri
 * tek bu context'te yönetilir. Bileşenler sadece useLiveData() ile
 * veriyi okur — tekrar çekme, senkronizasyon sorunu yok.
 *
 * Güncelleme akışı:
 *   WS "kpi"        → kpi + riskItems yenilenir
 *   WS "disruption" → disruptions + flights + riskItems yenilenir
 *   WS "apply"      → disruptions + flights yenilenir
 *   WS "ai_alert"   → lastAlert + disruptions + riskItems güncellenir
 *   WS "risk_update"→ riskItems yenilenir
 *   Poll (30s)      → riskItems yenilenir
 *   Poll (60s)      → flights yenilenir
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  getFlights,
  getFlightRisk,
  getKpi,
  getDisruptions,
  getAnalytics,
  type FlightDTO,
  type RiskFlightItem,
  type KpiSummary,
  type DisruptionDTO,
  type AnalyticsData,
} from "../api/irrops";
import { getSocket } from "../api/socket";
import { LiveDataContext, type AiAlert, type LiveDataState } from "./liveDataDefs";

// ────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<FlightDTO[]>([]);
  const [riskItems, setRiskItems] = useState<RiskFlightItem[]>([]);
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [disruptions, setDisruptions] = useState<DisruptionDTO[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [lastAlert, setLastAlert] = useState<AiAlert | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Ref'ler: closure'ların eski state yakalamasını önler
  const fetchFlightsRef = useRef<() => void>(() => {});
  const fetchRiskRef = useRef<() => void>(() => {});
  const fetchDisruptionsRef = useRef<() => void>(() => {});
  const fetchAnalyticsRef = useRef<() => void>(() => {});

  // ── Veri çekme fonksiyonları ──────────────────────────────

  const fetchFlights = useCallback(async () => {
    try {
      const data = await getFlights();
      setFlights(data);
      setLastRefreshedAt(new Date());
    } catch {
      /* Backend kapalı — eski veri kalır */
    }
  }, []);

  const fetchRisk = useCallback(async () => {
    try {
      const data = await getFlightRisk();
      setRiskItems(data.items);
      setLastRefreshedAt(new Date());
    } catch {
      /* AI servisi kapalı — eski risk skorları kalır */
    }
  }, []);

  const fetchDisruptions = useCallback(async () => {
    try {
      const data = await getDisruptions();
      setDisruptions(data);
    } catch {
      /* Backend kapalı */
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch {
      /* Backend kapalı */
    }
  }, []);

  const fetchKpi = useCallback(async () => {
    try {
      const data = await getKpi();
      setKpi(data);
    } catch {
      /* kapalı */
    }
  }, []);

  // Ref'leri güncel tut
  useEffect(() => {
    fetchFlightsRef.current = fetchFlights;
    fetchRiskRef.current = fetchRisk;
    fetchDisruptionsRef.current = fetchDisruptions;
    fetchAnalyticsRef.current = fetchAnalytics;
  });

  // ── İlk yükleme ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      Promise.all([
        fetchFlights(),
        fetchRisk(),
        fetchKpi(),
        fetchDisruptions(),
        fetchAnalytics(),
      ]).finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    requestAnimationFrame(load);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── WebSocket abonelikleri ──────────────────────────────────

  useEffect(() => {
    const socket = getSocket();

    // KPI eventi (her 5s backend'den gelir) → kpi state + risk yenile
    const onKpi = (data: KpiSummary) => {
      setKpi(data);
      setLastRefreshedAt(new Date());
    };

    // Yeni disruption oluşturuldu → her şeyi yenile
    const onDisruption = () => {
      fetchFlightsRef.current();
      fetchRiskRef.current();
      fetchDisruptionsRef.current();
      fetchAnalyticsRef.current();
    };

    // Öneri uygulandı → uçuşlar + disruptions güncelle
    const onApply = () => {
      fetchFlightsRef.current();
      fetchDisruptionsRef.current();
      fetchAnalyticsRef.current();
    };

    // Proaktif AI uyarısı → lastAlert + disruptions + risk
    const onAiAlert = (payload: AiAlert) => {
      setLastAlert(payload);
      fetchDisruptionsRef.current();
      fetchRiskRef.current();
      fetchAnalyticsRef.current();
    };

    // 30s risk_update eventi → sadece risk yenile
    const onRiskUpdate = () => {
      fetchRiskRef.current();
    };

    socket.on("kpi", onKpi);
    socket.on("disruption", onDisruption);
    socket.on("apply", onApply);
    socket.on("ai_alert", onAiAlert);
    socket.on("risk_update", onRiskUpdate);

    return () => {
      socket.off("kpi", onKpi);
      socket.off("disruption", onDisruption);
      socket.off("apply", onApply);
      socket.off("ai_alert", onAiAlert);
      socket.off("risk_update", onRiskUpdate);
    };
  }, []);

  // ── Periyodik polling (fallback) ────────────────────────────

  useEffect(() => {
    // Uçuş riskleri 30s'de bir yenilenir (risk_update WS yoksa backup)
    const riskTimer = setInterval(() => fetchRiskRef.current(), 30_000);
    // Uçuşlar 60s'de bir yenilenir
    const flightTimer = setInterval(() => fetchFlightsRef.current(), 60_000);
    // Analytics 2 dakikada bir
    const analyticsTimer = setInterval(() => fetchAnalyticsRef.current(), 120_000);

    return () => {
      clearInterval(riskTimer);
      clearInterval(flightTimer);
      clearInterval(analyticsTimer);
    };
  }, []);

  // ── Risk haritası (hesaplanan) ───────────────────────────────

  const riskMap: Record<string, number> = {};
  riskItems.forEach((r) => {
    if (r.delayProbability != null) riskMap[r.id] = r.delayProbability;
  });

  // ── refreshAll helper ────────────────────────────────────────

  const refreshAll = useCallback(() => {
    fetchFlightsRef.current();
    fetchRiskRef.current();
    fetchDisruptionsRef.current();
    fetchAnalyticsRef.current();
  }, []);

  // ── Context değeri ───────────────────────────────────────────

  const value: LiveDataState = {
    flights,
    riskItems,
    kpi,
    disruptions,
    analytics,
    lastAlert,
    lastRefreshedAt,
    isLoading,
    riskMap,
    refreshFlights: fetchFlights,
    refreshRisk: fetchRisk,
    refreshDisruptions: fetchDisruptions,
    refreshAnalytics: fetchAnalytics,
    refreshAll,
  };

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  );
}
