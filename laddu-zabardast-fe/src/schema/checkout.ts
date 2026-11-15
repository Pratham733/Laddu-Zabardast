import * as z from "zod";

export const ORDER_INSTRUCTIONS_LIMIT = 500;

export const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(1, "City is required"),
  state: z.string().trim().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  instructions: z.string().trim().refine(
    (value) => Array.from(value).length <= ORDER_INSTRUCTIONS_LIMIT,
    `Use at most ${ORDER_INSTRUCTIONS_LIMIT} characters`,
  ).optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Aliases for compatibility
export const formSchema = checkoutSchema;
export type FormSchema = CheckoutFormValues;
