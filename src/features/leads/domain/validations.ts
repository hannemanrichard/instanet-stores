import { z } from "zod";

export const leadListSearchParamsSchema = z.object({
  status: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const publicLeadItemSchema = z.object({
  item_id: z.number().int().positive(),
  qty: z.number().int().positive().max(100),
});

export const publicCreateLeadSchema = z.object({
  lead: z.object({
    first_name: z.string().trim().min(1).max(120),
    last_name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(1).max(40),
    address: z.string().trim().min(1).max(255).optional(),
    commune: z.string().trim().min(1).max(120).optional(),
    wilaya: z.string().trim().min(1).max(120).optional(),
    channel: z.string().trim().min(1).max(120).optional(),
    comment: z.string().trim().min(1).max(1000).optional(),
    color: z.string().trim().min(1).max(80).optional(),
    size: z.string().trim().min(1).max(80).optional(),
    product: z.string().trim().min(1).max(255).optional(),
    objective: z.string().trim().min(1).max(255).optional(),
    offer: z.string().trim().min(1).max(255).optional(),
  }),
  items: z.array(publicLeadItemSchema).max(20).optional(),
});

export const publicLeadHopSchema = z.object({
  lead_id: z.number().int().positive(),
  agent_id: z.number().int().positive(),
});
