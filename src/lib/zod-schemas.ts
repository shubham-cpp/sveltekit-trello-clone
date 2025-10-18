import { z } from 'zod/v4';

export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	rememberMe: z.boolean().optional()
});
export type LoginFormSchema = typeof loginSchema;

export const signupSchema = z.object({
	firstName: z.string().min(2, 'First name must be at least 2 characters'),
	lastName: z.string().min(2, 'Last name must be at least 2 characters'),
	email: z.email(),
	password: z.string().min(8, 'Password must be at least 8 characters')
});
export type SignUpFormSchema = typeof signupSchema;

export const profileUpdateSchema = z.object({
	firstName: z.string().min(2, 'First name must be at least 2 characters'),
	lastName: z.string().min(2, 'Last name must be at least 2 characters')
});
export type ProfileUpdateFormSchema = typeof profileUpdateSchema;

export const passwordChangeSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your password')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	});
export type PasswordChangeFormSchema = typeof passwordChangeSchema;
