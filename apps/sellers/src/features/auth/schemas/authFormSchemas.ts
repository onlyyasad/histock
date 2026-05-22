import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const registerFormSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(1, 'Your name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
