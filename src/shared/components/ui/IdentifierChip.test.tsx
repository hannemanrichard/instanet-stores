import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdentifierChip, copyText } from "./IdentifierChip";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { code?: string }) => {
    if (key === "copyCode") return `Copy ${values?.code ?? ""}`;
    if (key === "copied") return "Copied";
    return key;
  },
}));

describe("copyText", () => {
  it("writes through the clipboard API when available", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await expect(copyText("PMT-4K2M9A")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("PMT-4K2M9A");
  });

  it("returns false for an empty value", async () => {
    await expect(copyText("")).resolves.toBe(false);
  });
});

describe("IdentifierChip", () => {
  it("renders the identifier and copies it", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<IdentifierChip code="RET-4XEE9K" />);

    expect(screen.getByText("RET-4XEE9K")).toBeInTheDocument();
    const copyButton = screen.getByRole("button", { name: "Copy RET-4XEE9K" });
    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledWith("RET-4XEE9K");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });
  });

  it("renders nothing without a code", () => {
    const { container } = render(<IdentifierChip code="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
