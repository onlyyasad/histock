import session from 'express-session'
import ConnectPgSimple from 'connect-pg-simple'
import config from '../../config'

const PgSession = ConnectPgSimple(session)

export const sessionMiddleware = session({
  store: new PgSession({
    conString: config.database_url,
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
})
