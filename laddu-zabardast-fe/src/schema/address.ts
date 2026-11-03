import * as z from "zod";

export const addressSchema = z.object({
  street: z.string().min(5, "Street address is too short."),
  city: z.string().min(2, "City name is too short."),
  state: z.string().min(2, "State name is too short."),
  postalCode: z
    .string()
    .min(5, "Invalid postal code.")
    .max(10, "Invalid postal code."),
  country: z.string().min(2, "Country name is too short."),
  isDefault: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;