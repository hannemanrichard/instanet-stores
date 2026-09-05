import { z } from "zod";

export const orderListSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().max(10_000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  storeId: z.coerce.number().int().positive().optional(),
});

const orderItemSchema = z.object({
  item_id: z.number().int().positive(),
  qty: z.number().int().positive().max(100).optional(),
});

const adminCreateOrderSchema = z.object({
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(1).max(40),
  phone2: z.string().trim().min(1).max(40).optional(),
  address: z.string().trim().min(1).max(255).optional(),
  commune: z.string().trim().min(1).max(120).optional(),
  wilaya: z.string().trim().min(1).max(120).optional(),
  channel: z.string().trim().min(1).max(120).optional(),
  comment: z.string().trim().min(1).max(1000).optional(),
  objective: z.string().trim().min(1).max(255).optional(),
  delivery_company: z.string().trim().min(1).max(120).optional(),
  delivery_notes: z.number().int().nonnegative().optional(),
  delivery_attempt: z.number().int().nonnegative().optional(),
  tracking_id: z.string().trim().min(1).max(120).optional(),
  tracker_id: z.number().int().positive().optional(),
  dc_recent_status: z.string().trim().min(1).max(120).optional(),
  yalidine_status: z.string().trim().min(1).max(120).optional(),
  agent_id: z.number().int().positive().optional(),
  partner_id: z.number().int().positive().optional(),
  product: z.string().trim().min(1).max(255).optional(),
  product_color: z.string().trim().min(1).max(80).optional(),
  product_size: z.string().trim().min(1).max(80).optional(),
  product_qty: z.number().int().positive().max(100),
  is_auto_delivered: z.boolean().optional().default(false),
  is_exchange_required: z.boolean().optional().default(false),
  is_exchange: z.boolean().optional(),
  has_exchange: z.boolean().optional(),
  has_defect: z.boolean().optional().default(false),
  is_free_shipping: z.boolean().optional(),
  is_stopdesk: z.boolean().optional(),
  is_wholesale: z.boolean().optional(),
  return_processed: z.boolean().optional().default(false),
  stopdesk: z.string().trim().min(1).max(120).optional(),
});

export const adminCreateOrderBodySchema = z.object({
  order: adminCreateOrderSchema,
  items: z.array(orderItemSchema).max(20).optional(),
  productId: z.number().int().positive(),
});

