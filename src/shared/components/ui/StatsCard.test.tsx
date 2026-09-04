import { render, screen } from "@testing-library/react";
import { Package } from "lucide-react";
import StatsCard from "./StatsCard";

describe("StatsCard", () => {
  it("renders title, formatted number, and icon", () => {
    render(
      <StatsCard title="Total orders" value={1280} icon={Package} tone="primary" />
    );

    expect(screen.getByText("Total orders")).toBeInTheDocument();
    expect(screen.getByText("1,280")).toBeInTheDocument();
  });

  it("prefers displayValue over numeric formatting", () => {
    render(
      <StatsCard
        title="Paid"
        value={100}
        valueType="currency"
        displayValue="9,999 DA"
        icon={Package}
        tone="primary"
      />
    );

    expect(screen.getByText("9,999 DA")).toBeInTheDocument();
    expect(screen.queryByText("100 DA")).not.toBeInTheDocument();
  });

  it("shows positive trend", () => {
    render(
      <StatsCard
        title="Growth"
        value={12}
        valueType="percentage"
        icon={Package}
        trend={{ value: "+4%", positive: true }}
      />
    );

    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("+4%")).toBeInTheDocument();
  });
});
