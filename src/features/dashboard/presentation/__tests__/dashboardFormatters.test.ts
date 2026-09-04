import {
  formatChartAxisDate,
  formatDashboardAmount,
} from "../dashboardFormatters";

describe("dashboardFormatters", () => {
  it("formats dashboard amounts without decimals", () => {
    expect(formatDashboardAmount(125000)).toBe("125,000");
  });

  it("formats chart axis dates", () => {
    expect(formatChartAxisDate("2026-08-18")).toMatch(/18/);
  });
});
