import { render, screen } from "@testing-library/react";
import { StoreLandingPage } from "./StoreLandingPage";
import { useUser } from "@clerk/nextjs";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe("StoreLandingPage", () => {
  it("sends signed-out visitors to sign-up and sign-in", () => {
    mockedUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    } as ReturnType<typeof useUser>);

    render(<StoreLandingPage />);

    expect(screen.getByRole("heading", { name: "hero.headline" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /hero.ctaPrimary|cta.button/ })[0]).toHaveAttribute(
      "href",
      "/sign-up"
    );
    expect(screen.getByRole("link", { name: "hero.ctaSecondary" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
  });

  it("sends signed-in partners to the dashboard", () => {
    mockedUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    } as ReturnType<typeof useUser>);

    render(<StoreLandingPage />);

    expect(screen.queryByRole("link", { name: "hero.ctaSecondary" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "hero.ctaDashboard" })[0]).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });
});
