import type { ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {title && <h3 className="font-semibold text-[15px] mb-4">{title}</h3>}
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent = "text-white",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs text-white/60 uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${accent}`}>{value}</div>
      {hint && <div className="text-xs text-white/50 mt-1">{hint}</div>}
    </div>
  );
}
