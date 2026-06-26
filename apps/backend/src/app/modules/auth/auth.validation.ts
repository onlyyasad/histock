import { z } from 'zod'

const register = z.object({
  body: z.object({
    businessName: z.string().min(2).max(200),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    name: z.string().min(1).max(200),
  }),
})

// Preserve no-leak behavior: require a non-empty string, not a strict email format.
const forgotPassword = z.object({
  body: z.object({
    email: z.string().min(1),
  }),
})

const resetPassword = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(100),
  }),
})

const impersonate = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
})

export const AuthValidation = {
  register,
  forgotPassword,
  resetPassword,
  impersonate,
}
