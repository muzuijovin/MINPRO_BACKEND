
import * as z from "zod";

export const registerUserSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  email: z.email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
  role: z.enum(["CUSTOMER", "EO"]),
  referralCode: z.string().optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
