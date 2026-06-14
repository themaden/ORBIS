import { useEffect, useState } from "react";

// Basit veri çekme kancası: { data, loading, error, reload }
// fn: Promise döndüren bir fonksiyon (örn. () => api.getCrisis())
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  // Yeniden çekmeyi tetikle (loading durumu burada, effect dışında ayarlanır)
  const reload = () => {
    setState({ data: null, loading: true, error: null });
    setTick((t) => t + 1);
  };

  return { ...state, reload };
}
