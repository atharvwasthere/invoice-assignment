import { z } from "zod";

/** Body shape for creating a customer (used by the seed script and any future admin form). */
export const createCustomerSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
