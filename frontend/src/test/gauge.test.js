import { describe, it, expect } from "vitest";
import { polar, arcPath, valueToRatio } from "../lib/gauge";

describe("gauge geometry", () => {
  it("polar: t=0 sol uçtadır", () => {
    const [x, y] = polar(100, 100, 50, 0);
    expect(x).toBeCloseTo(50);
    expect(y).toBeCloseTo(100);
  });

  it("polar: t=1 sağ uçtadır", () => {
    const [x, y] = polar(100, 100, 50, 1);
    expect(x).toBeCloseTo(150);
    expect(y).toBeCloseTo(100);
  });

  it("polar: t=0.5 en üst noktadadır", () => {
    const [x, y] = polar(100, 100, 50, 0.5);
    expect(x).toBeCloseTo(100);
    expect(y).toBeCloseTo(50);
  });

  it("arcPath large-arc-flag her zaman 0, sweep 1", () => {
    const d = arcPath(100, 100, 50, 0, 0.75);
    expect(d).toMatch(/A 50 50 0 0 1/);
  });

  it("valueToRatio 0-100 arasini sinirlar", () => {
    expect(valueToRatio(75)).toBe(0.75);
    expect(valueToRatio(-10)).toBe(0);
    expect(valueToRatio(150)).toBe(1);
  });
});
