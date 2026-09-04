const DICEBEAR_BASE = "https://api.dicebear.com/9.x/initials/svg";

export const getDicebearAvatarUrl = (seed: string): string => {
  const params = new URLSearchParams({
    seed: seed.trim() || "customer",
    backgroundColor: "00B14F",
    textColor: "ffffff",
  });
  return `${DICEBEAR_BASE}?${params.toString()}`;
};
