import { z } from "zod";

export const createPaymentBodySchema = z.object({
  store_id: z.number().int().positive(),
  order_ids: z.array(z.number().int().positive()).min(1).max(200),
  note: z.string().trim().max(1000).optional(),
});
