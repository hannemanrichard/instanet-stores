import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { RoleGuard } from "./RoleGuard";
import { useAuth } from "@/shared/hooks/use-auth";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

jest.mock("@/shared/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe("RoleGuard", () => {
  beforeEach(() => {
    mockedRedirect.mockClear();
  });

  it("renders children for an allowed admin", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "admin_1" },
      isLoaded: true,
      role: "admin",
    } as ReturnType<typeof useAuth>);

    render(
      <RoleGuard allowedRoles={["admin"]}>
        <p>Managers page</p>
      </RoleGuard>
    );

    expect(screen.getByText("Managers page")).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("redirects a stores manager away from admin-only pages", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "mgr_1" },
      isLoaded: true,
      role: "stores_manager",
    } as ReturnType<typeof useAuth>);

    expect(() =>
      render(
        <RoleGuard allowedRoles={["admin"]}>
          <p>Managers page</p>
        </RoleGuard>
      )
    ).toThrow("NEXT_REDIRECT:/dashboard");

    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
    expect(screen.queryByText("Managers page")).not.toBeInTheDocument();
  });

  it("allows a stores manager on catalog pages", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "mgr_1" },
      isLoaded: true,
      role: "stores_manager",
    } as ReturnType<typeof useAuth>);

    render(
      <RoleGuard allowedRoles={["admin", "stores_manager"]}>
        <p>Products page</p>
      </RoleGuard>
    );

    expect(screen.getByText("Products page")).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("allows a stores manager on operational pages", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "mgr_1" },
      isLoaded: true,
      role: "stores_manager",
    } as ReturnType<typeof useAuth>);

    render(
      <RoleGuard allowedRoles={["admin", "store", "stores_manager"]}>
        <p>Inventory page</p>
      </RoleGuard>
    );

    expect(screen.getByText("Inventory page")).toBeInTheDocument();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});
