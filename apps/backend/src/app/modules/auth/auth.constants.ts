// Password reset token lifetime (1 hour).
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
// New businesses start on a 14-day Growth trial.
export const TRIAL_DAYS = 14
export const TRIAL_PLAN_ID = 'growth'
// bcrypt cost factor used everywhere passwords are hashed.
export const BCRYPT_ROUNDS = 12
// express-session default cookie name (cleared on logout).
export const SESSION_COOKIE_NAME = 'connect.sid'
