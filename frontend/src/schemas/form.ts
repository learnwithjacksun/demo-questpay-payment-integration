import { z } from "zod";

export const authSchema = z
  .object({
    email: z.string().email("Invalid email address").min(1, "Email is required"),
  })
  .strict();

export const paymentSchema = z
  .object({
    amount: z.number().min(99, "Amount must be at least 99"),
  })
  .strict();

export type AuthSchema = z.infer<typeof authSchema>;
export type PaymentSchema = z.infer<typeof paymentSchema>;


