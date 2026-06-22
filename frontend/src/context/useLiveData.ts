import { useContext } from "react";
import { LiveDataContext, type LiveDataState } from "./liveDataDefs";

export function useLiveData(): LiveDataState {
  const ctx = useContext(LiveDataContext);
  if (!ctx) throw new Error("useLiveData must be used within <LiveDataProvider>");
  return ctx;
}
