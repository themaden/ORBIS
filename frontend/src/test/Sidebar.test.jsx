import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { AuthProvider } from "../auth/AuthContext";

beforeEach(() => {
  localStorage.setItem(
    "orbis.auth",
    JSON.stringify({ name: "Ahmet Yılmaz", sicil: "THY-04821" })
  );
});

function renderSidebar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
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

  it("oturum acan kullanicinin adini gosterir", () => {
    renderSidebar();
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
    expect(screen.getByLabelText("Oturumu kapat")).toBeInTheDocument();
  });
});
