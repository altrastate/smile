import { z } from "zod";

export const countries = ["Uganda", "Kenya", "Tanzania", "Rwanda"] as const;

export const foundationCheckSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use 80 characters or fewer."),
  country: z.enum(countries, { error: "Select a country." }),
  interest: z.enum(["buyer", "business"], { error: "Choose one." }),
  acknowledged: z.boolean().refine((value) => value, {
    message: "Confirm that this check does not create an account.",
  }),
});

export type FoundationCheck = z.infer<typeof foundationCheckSchema>;
