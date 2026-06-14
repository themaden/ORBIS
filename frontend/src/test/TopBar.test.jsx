import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TopBar from "../components/TopBar";

describe("TopBar arama", () => {
  it("yazinca eslesen oneriler listelenir", async () => {
    const user = userEvent.setup();
    render(<TopBar title="Test" />);

    const input = screen.getByLabelText("Uçuş, yolcu veya kaynak ara");
    await user.type(input, "TK1985");

    expect(await screen.findByText("TK1985")).toBeInTheDocument();
  });

  it("eslesme yoksa 'sonuc yok' gosterir", async () => {
    const user = userEvent.setup();
    render(<TopBar title="Test" />);

    const input = screen.getByLabelText("Uçuş, yolcu veya kaynak ara");
    await user.type(input, "zxqw");

    expect(await screen.findByText(/sonuç yok/i)).toBeInTheDocument();
  });
});
