import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  it("tum navigasyon baglantilarini render eder", () => {
    renderSidebar();
    expect(screen.getByText(/Operasyonlar/)).toBeInTheDocument();
    expect(screen.getByText("Kaynak Yönetimi")).toBeInTheDocument();
    expect(screen.getByText("Ayarlar")).toBeInTheDocument();
  });

  it("Destek butonu modal acar", async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByText("Destek"));
    expect(await screen.findByText("Destek Merkezi")).toBeInTheDocument();
  });

  it("Profilim butonu giris modali acar", async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByText("Profilim"));
    expect(await screen.findByText("Personel Girişi")).toBeInTheDocument();
  });
});
