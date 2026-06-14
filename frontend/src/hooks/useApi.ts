import { useEffect, useState } from "react";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Basit veri çekme kancası: { data, loading, error, reload }
// fn: Promise döndüren bir fonksiyon (örn. () => api.getCrisis())
export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch(
        (error: Error) =>
          alive && setState({ data: null, loading: false, error })
      );
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
