import * as z from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^[+]?\d{10,15}$/)
    .optional()
    .or(z.literal("")),
  photoURL: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().url().optional(),
  ),
});