import { Resend } from 'resend'
import config from '../../config'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!config.resend.apiKey) {
      throw new Error('RESEND_API_KEY not set — email sending unavailable')
    }
    _resend = new Resend(config.resend.apiKey)
  }
  return _resend
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!config.resend.apiKey) {
    // Dev fallback: log the reset URL instead of sending
    console.warn(`[DEV] Password reset link for ${email}: ${resetUrl}`)
    return
  }
  await getResend().emails.send({
    from: config.resend.fromAddress,
    to: email,
    subject: 'Reset your password',
    html: `
      <p>You requested a password reset. Click the link below within 1 hour:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, ignore this email — your password won't change.</p>
    `,
  })
}
