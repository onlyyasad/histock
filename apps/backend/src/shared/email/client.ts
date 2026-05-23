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

async function sendEmail(to: string, subject: string, html: string) {
  if (!config.resend.apiKey) {
    console.warn(`[email:dev] to=${to} subject="${subject}"`)
    return
  }
  await getResend().emails.send({ from: config.resend.fromAddress, to, subject, html })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail(
    email,
    'Reset your password',
    `<p>You requested a password reset. Click the link below within 1 hour:</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you didn't request this, ignore this email — your password won't change.</p>`,
  )
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  processing: 'is being processed',
  packed: 'has been packed and is ready for pickup',
  handover_to_courier: 'has been handed to the courier',
  delivered: 'has been delivered',
  delivery_failed: 'could not be delivered — we will re-attempt',
  cancelled: 'has been cancelled',
  refunded: 'has been refunded',
}

export async function sendOrderStatusEmail(
  email: string,
  name: string,
  orderNumber: number,
  newStatus: string,
) {
  const label = ORDER_STATUS_LABELS[newStatus] ?? `status changed to ${newStatus}`
  const orderRef = `ORD-${String(orderNumber).padStart(6, '0')}`
  await sendEmail(
    email,
    `Order ${orderRef} update`,
    `<p>Hi ${name},</p>
     <p>Your order <strong>${orderRef}</strong> ${label}.</p>
     <p>Questions? Reply to this email and we'll get back to you.</p>`,
  )
}

export async function sendTrialExpiryEmail(email: string, name: string, daysLeft: number) {
  await sendEmail(
    email,
    `Your free trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    `<p>Hi ${name},</p>
     <p>Your HiStock free trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
     <p>Upgrade to a paid plan to keep your data and keep managing orders.</p>`,
  )
}
