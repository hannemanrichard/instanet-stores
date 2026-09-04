import {
  LANDING_DASHBOARD_HREF,
  LANDING_SIGN_UP_HREF,
  resolveLandingPrimaryHref,
} from "./landingCta";

describe("resolveLandingPrimaryHref", () => {
  it("sends signed-in users to the dashboard", () => {
    expect(resolveLandingPrimaryHref(true)).toBe(LANDING_DASHBOARD_HREF);
  });

  it("sends signed-out users to sign-up", () => {
    expect(resolveLandingPrimaryHref(false)).toBe(LANDING_SIGN_UP_HREF);
  });
});
