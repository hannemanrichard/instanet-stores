import { auth, currentUser } from "@clerk/nextjs/server";
import { storeApplicationService } from "@/features/stores/application/services/storeApplicationService";
import type { StoreEntity } from "@/features/stores/domain";
import { StoreError } from "@/features/stores/domain";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Resolves the authenticated Clerk user to a stores row.
 * Never trusts a client-supplied store id.
 */
export const requireCurrentStore = async (): Promise<StoreEntity> => {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError();
  }

  const user = await currentUser();
  if (!user) {
    throw new UnauthorizedError();
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new StoreError(
      "Authenticated user has no email",
      "STORE_EMAIL_REQUIRED"
    );
  }

  return storeApplicationService.getOrCreateStore({
    email,
    fullname: [user.firstName, user.lastName].filter(Boolean).join(" "),
    username: email.split("@")[0],
    avatar: user.imageUrl,
  });
};
