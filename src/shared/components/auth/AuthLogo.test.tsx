import { render, screen } from "@testing-library/react";
import { AuthLogo } from "./AuthLogo";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/shared/lib/brand";

describe("AuthLogo", () => {
  it("renders the Instanet brand name and logo.svg mark", () => {
    render(<AuthLogo />);

    const link = screen.getByRole("link", { name: `${BRAND_NAME} home` });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText(BRAND_NAME)).toBeInTheDocument();

    const mark = link.querySelector("img");
    expect(mark).toHaveAttribute("src", BRAND_LOGO_SRC);
  });
});
