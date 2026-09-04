export const LANDING_DASHBOARD_HREF = "/dashboard";
export const LANDING_SIGN_UP_HREF = "/sign-up";
export const LANDING_SIGN_IN_HREF = "/sign-in";

export const resolveLandingPrimaryHref = (isSignedIn: boolean): string =>
  isSignedIn ? LANDING_DASHBOARD_HREF : LANDING_SIGN_UP_HREF;
