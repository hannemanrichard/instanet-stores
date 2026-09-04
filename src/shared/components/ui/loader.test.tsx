import { render, screen } from "@testing-library/react";
import { Loader } from "./loader";

describe("Loader", () => {
  it("renders an accessible bouncing-dots status indicator", () => {
    render(<Loader />);

    const loader = screen.getByRole("status", { name: "Loading" });
    expect(loader).toHaveClass("loader");
  });

  it("accepts a custom label", () => {
    render(<Loader label="Finishing Google sign-in" />);

    expect(
      screen.getByRole("status", { name: "Finishing Google sign-in" })
    ).toBeInTheDocument();
  });
});
