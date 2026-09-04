import { render, screen } from "@testing-library/react";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("renders the label with the matching tone classes", () => {
    render(<StatusPill label="Paid" tone="success" />);

    const pill = screen.getByText("Paid");
    expect(pill).toHaveClass("rounded-full");
    expect(pill).toHaveClass("text-emerald-900");
    expect(pill).toHaveClass("font-bold");
  });

  it("uses the info tone for in-progress statuses", () => {
    render(<StatusPill label="Ready" tone="info" />);

    expect(screen.getByText("Ready")).toHaveClass("text-sky-900");
  });

  it("uses the warning tone for processing statuses", () => {
    render(<StatusPill label="Processing" tone="warning" />);

    expect(screen.getByText("Processing")).toHaveClass("text-amber-900");
  });

  it("renders without a status dot", () => {
    render(<StatusPill label="Initial" tone="info" />);

    const pill = screen.getByText("Initial");
    expect(pill.children).toHaveLength(0);
  });
});
