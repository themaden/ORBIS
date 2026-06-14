import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useApi } from "../hooks/useApi";

function Probe({ fn }) {
  const { data, loading, error } = useApi(fn);
  if (loading) return <div>yukleniyor</div>;
  if (error) return <div>hata</div>;
  return <div>deger: {data}</div>;
}

describe("useApi", () => {
  it("once loading sonra veri gosterir", async () => {
    render(<Probe fn={() => Promise.resolve(42)} />);
    expect(screen.getByText("yukleniyor")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("deger: 42")).toBeInTheDocument()
    );
  });

  it("reddedilen promise'te hata gosterir", async () => {
    render(<Probe fn={() => Promise.reject(new Error("x"))} />);
    await waitFor(() => expect(screen.getByText("hata")).toBeInTheDocument());
  });
});
