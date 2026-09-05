import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { storeApplicationService } from "@/features/stores/application/services/storeApplicationService";
import type { StoreEntity } from "@/features/stores/domain";
import { StoreError } from "@/features/stores/domain";
import { resolveUserEmail } from "@/shared/utils/userEmail";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Resolves the current authenticated Clerk user once.
 */
export const requireAuthenticatedUser = async (): Promise<User> => {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError();
  }

  const user = await currentUser();
  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
};

const resolveStoreInputFromUser = (user: User) => {
  const email = resolveUserEmail(user);
  if (!email) {
    throw new StoreError(
      "Authenticated user has no email",
      "STORE_EMAIL_REQUIRED"
    );
  }

  return {
    email,
    fullname: [user.firstName, user.lastName].filter(Boolean).join(" "),
    username: email.split("@")[0],
    avatar: user.imageUrl,
  };
};

/**
 * Resolves the authenticated Clerk user to a stores row.
 * Never trusts a client-supplied store id.
 */
export const requireCurrentStoreForUser = async (
  user: User
): Promise<StoreEntity> => {
  return storeApplicationService.getOrCreateStore({
    ...resolveStoreInputFromUser(user),
  });
};

export const requireCurrentStore = async (): Promise<StoreEntity> => {
  const user = await requireAuthenticatedUser();
  return requireCurrentStoreForUser(user);
};
