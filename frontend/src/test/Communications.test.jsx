import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Communications from "../pages/Communications";

describe("İletişim Merkezi", () => {
  it("mesaj yazip gonderince kanalda gorunur ve input temizlenir", async () => {
    const user = userEvent.setup();
    render(<Communications />);

    const input = screen.getByPlaceholderText(/kanalına mesaj gönder/i);
    await user.type(input, "Test mesaji 123");
    await user.click(screen.getByLabelText("Mesaj gönder"));

    expect(screen.getByText("Test mesaji 123")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
