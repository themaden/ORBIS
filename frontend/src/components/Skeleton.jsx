export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

// Veri çekme hatası için ortak küçük kutu
export function ErrorState({ message = "Veri yüklenemedi", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="text-thy text-2xl">⚠</div>
      <div className="text-sm text-white/70">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs"
        >
          Tekrar dene
        </button>
      )}
    </div>
  );
}
