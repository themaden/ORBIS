// Yarım daire gösterge geometrisi (saf fonksiyonlar — test edilebilir).

// t: 0 = sol (180°), 1 = sağ (0°); yay üstten geçer.
export function polar(
  cx: number,
  cy: number,
  r: number,
  t: number
): [number, number] {
  const a = Math.PI - t * Math.PI;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

// Yarım dairede yay her zaman <= 180° olduğu için large-arc-flag daima 0,
// sweep-flag = 1 yayı üstten çizer.
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  t0: number,
  t1: number
): string {
  const [x1, y1] = polar(cx, cy, r, t0);
  const [x2, y2] = polar(cx, cy, r, t1);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

// Yüzdeyi [0,1] orana çevirir (0-100 sınırlanır).
export function valueToRatio(value: number): number {
  return Math.max(0, Math.min(100, value)) / 100;
}
