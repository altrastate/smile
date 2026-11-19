import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[A-Za-z]/, "Include a letter.")
  .regex(/[0-9]/, "Include a number.");

export const emailSchema = z.string().trim().email("Enter a valid email address.").max(160);

export const fullNameSchema = z.string().trim().min(2, "Enter your full name.").max(120);

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.literal("on", { error: "Accept the account terms to continue." }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "The passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "The passwords do not match.",
  });

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://") || /%2f|%5c/i.test(value)) {
    return "/account";
  }
  return value;
}

export function authFailureMessage(message: string) {
  const text = message.toLowerCase();
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (text.includes("invalid login") || text.includes("invalid credentials")) {
    return "The email or password is not correct.";
  }
  if (text.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Wait a few minutes and try again.";
  }
  if (text.includes("password")) {
    return "The password was not accepted. Use at least 10 characters with a letter and a number.";
  }
  if (text.includes("terms must be accepted") || text.includes("full name is required")) {
    return "Enter your name and accept the account terms.";
  }
  return "That request could not be completed.";
}
