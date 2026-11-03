import * as z from "zod";

export const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Aliases for compatibility
export const formSchema = checkoutSchema;
export type FormSchema = CheckoutFormValues;
