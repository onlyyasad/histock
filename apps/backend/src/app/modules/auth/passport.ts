import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcryptjs'
import { prismaAdmin } from '../../../prisma/client'

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await prismaAdmin.user.findFirst({
          where: { email: email.toLowerCase(), deletedAt: null },
          include: {
            business: { select: { id: true, name: true, isDemo: true } },
          },
        })

        if (!user) return done(null, false, { message: 'Invalid credentials' })

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return done(null, false, { message: 'Invalid credentials' })

        return done(null, user)
      } catch (err) {
        return done(err)
      }
    },
  ),
)

passport.serializeUser((user: Express.User, done) => {
  const u = user as Record<string, unknown>
  done(null, {
    id: u.id,
    businessId: u.businessId ?? null,
    issuedAt: Math.floor(Date.now() / 1000),
  })
})

passport.deserializeUser(
  async (serialized: { id: string; businessId: string | null }, done) => {
    try {
      const user = await prismaAdmin.user.findUnique({
        where: { id: serialized.id },
        include: { business: { select: { id: true, name: true, isDemo: true } } },
      })
      done(null, user ?? false)
    } catch (err) {
      done(err)
    }
  },
)

export { passport }
