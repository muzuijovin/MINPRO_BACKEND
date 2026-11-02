import * as z from 'zod';

// REGISTER
export const registerUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters'),
    email: z.email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least 1 special character',
      ),
    referralCode: z.string().optional(),
  }),
});

// LOGIN
export const loginUserSchema = z.object({
  body: z.object({
    email: z.email().trim().min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// FEATURE 2 - NOMOR 2: Forgot Password Customer dan EO
export const forgotPasswordUserSchema = z.object({
  body: z.object({
    email: z.email('Please enter a valid email address'),
  }),
});

// FEATURE 2 - NOMOR 2: Reset Password Customer dan EO
export const resetPasswordUserSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Reset token is required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(
          /[^A-Za-z0-9]/,
          'Password must contain at least 1 special character',
        ),
      confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

// FEATURE 2 - NOMOR 2: Change Password Customer dan EO
export const changePasswordUserSchema = z.object({
  body: z
    .object({
      oldPassword: z.string().min(1, 'Old password is required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(
          /[^A-Za-z0-9]/,
          'Password must contain at least 1 special character',
        ),
      confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type ForgotPasswordUserInput = z.infer<typeof forgotPasswordUserSchema>;
export type ResetPasswordUserInput = z.infer<typeof resetPasswordUserSchema>;
export type ChangePasswordUserInput = z.infer<typeof changePasswordUserSchema>;
