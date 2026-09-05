import logger from "@/shared/utils/logger";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { UnauthorizedError } from "@/shared/server/requireCurrentStore";
import { rateLimitByActor } from "@/shared/server/rateLimit";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();
const UPLOAD_WINDOW_MS = 60 * 1000;

const requireUploadActor = async (maxUploads: number, allowedRoles?: string[]) => {
  const actor = await requireDashboardActor();

  if (allowedRoles && !allowedRoles.includes(actor.role)) {
    throw new UnauthorizedError("Insufficient upload permissions");
  }

  const limit = rateLimitByActor(
    actor.user.id,
    "uploadthing",
    maxUploads,
    UPLOAD_WINDOW_MS
  );

  if (!limit.allowed) {
    throw new UnauthorizedError("Upload rate limit exceeded");
  }

  return {
    actorRole: actor.role,
    rateLimitRemaining: limit.remaining,
  };
};

export const ourFileRouter = {
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => requireUploadActor(20))
    .onUploadComplete(async ({ file }) => {
    logger.info("Upload complete for file:", file);
    return { url: file.url };
  }),
  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => requireUploadActor(10))
    .onUploadComplete(async ({ file }) => {
    return { success: true, url: file.url };
  }),
  productLibrary: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
  })
    .middleware(async () => requireUploadActor(20, ["admin", "stores_manager"]))
    .onUploadComplete(async ({ file }) => {
    logger.info("Upload complete for file:", file);
    return { url: file.url };
  }),
  productVideo: f({
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async () => requireUploadActor(10, ["admin", "stores_manager"]))
    .onUploadComplete(async ({ file }) => {
    logger.info("Upload complete for video file:", file);
    return { url: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
