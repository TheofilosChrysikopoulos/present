import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM_EMAIL = process.env.SMTP_USER ?? 'theofiloschry@gmail.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'theofiloschry@gmail.com'

interface SendMailOptions {
  to?: string
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  try {
    await transporter.sendMail({
      from: `"Present Store" <${FROM_EMAIL}>`,
      to: to ?? ADMIN_EMAIL,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

/**
 * Notify admin about a new customer registration
 */
export async function sendRegistrationNotification(customer: {
  first_name: string
  last_name: string
  email: string
  location: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c1917;">New Customer Registration</h2>
      <p>A new customer has registered and is waiting for approval:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Name</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${customer.first_name} ${customer.last_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Email</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${customer.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Location</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${customer.location}</td>
        </tr>
      </table>
      <p>Please review and approve/reject this registration in the admin panel.</p>
      <p style="color: #78716c; font-size: 12px;">This is an automated message from Present Store.</p>
    </div>
  `

  return sendMail({
    subject: `New Registration: ${customer.first_name} ${customer.last_name}`,
    html,
  })
}

/**
 * Send confirmation email to customer after registration
 */
export async function sendRegistrationConfirmation(customer: {
  first_name: string
  email: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c1917;">Registration Received</h2>
      <p>Dear ${customer.first_name},</p>
      <p>Thank you for registering with Present Store. Your registration has been received and is pending approval.</p>
      <p>You will receive another email once your account has been approved. After approval, you will be able to log in, view prices, and add products to your cart.</p>
      <p>If you have any questions, please reply to this email.</p>
      <br/>
      <p>Best regards,<br/>Present Store Team</p>
      <p style="color: #78716c; font-size: 12px;">This is an automated message from Present Store.</p>
    </div>
  `

  return sendMail({
    to: customer.email,
    subject: 'Registration Received - Present Store',
    html,
  })
}

/**
 * Send magic link login email to an approved customer
 */
export async function sendMagicLinkEmail(customer: {
  first_name: string
  email: string
  magicLink: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c1917;">Sign In to Present Store</h2>
      <p>Dear ${customer.first_name},</p>
      <p>Click the button below to sign in to your account:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${customer.magicLink}"
           style="display: inline-block; padding: 12px 32px; background-color: #1c1917; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Sign In
        </a>
      </div>
      <p style="color: #78716c; font-size: 13px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #78716c; font-size: 12px; word-break: break-all;">${customer.magicLink}</p>
      <p style="color: #78716c; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      <br/>
      <p>Best regards,<br/>Present Store Team</p>
    </div>
  `

  return sendMail({
    to: customer.email,
    subject: 'Sign In to Present Store',
    html,
  })
}

/**
 * Send approval notification to a customer
 */
export async function sendApprovalEmail(customer: {
  first_name: string
  email: string
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c1917;">Account Approved!</h2>
      <p>Dear ${customer.first_name},</p>
      <p>Great news! Your Present Store account has been approved. You can now log in to view prices and place orders.</p>
      <p>Visit our website and click "Sign In" to get started.</p>
      <br/>
      <p>Best regards,<br/>Present Store Team</p>
      <p style="color: #78716c; font-size: 12px;">This is an automated message from Present Store.</p>
    </div>
  `

  return sendMail({
    to: customer.email,
    subject: 'Account Approved - Present Store',
    html,
  })
}

/**
 * Send order notification email to admin
 */
export async function sendOrderNotification(order: {
  customerName: string
  customerEmail: string
  customerLocation: string
  message?: string | null
  items: Array<{
    sku: string
    name_en: string
    qty: number
    price: number
    variant_color_en?: string
    size_label_en?: string
  }>
  totalAmount: number
}) {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${item.sku}</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${item.name_en}${item.variant_color_en ? ` – ${item.variant_color_en}` : ''}${item.size_label_en ? ` (${item.size_label_en})` : ''}</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: center;">${item.qty}</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: right;">€${item.price.toFixed(2)}</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: right;">€${(item.price * item.qty).toFixed(2)}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #1c1917;">New Order Received</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Customer</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${order.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Email</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${order.customerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Location</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${order.customerLocation}</td>
        </tr>
        ${order.message ? `<tr>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; background: #fafaf9;">Message</td>
          <td style="padding: 8px 12px; border: 1px solid #e7e5e4;">${order.message}</td>
        </tr>` : ''}
      </table>

      <h3 style="color: #1c1917; margin-top: 24px;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #fafaf9;">
            <th style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: left;">SKU</th>
            <th style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: left;">Product</th>
            <th style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: center;">Qty</th>
            <th style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: right;">Unit Price</th>
            <th style="padding: 8px 12px; border: 1px solid #e7e5e4; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr style="background: #fafaf9;">
            <td colspan="4" style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; text-align: right;">Total</td>
            <td style="padding: 8px 12px; border: 1px solid #e7e5e4; font-weight: bold; text-align: right;">€${order.totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="color: #78716c; font-size: 12px;">This is an automated message from Present Store.</p>
    </div>
  `

  return sendMail({
    subject: `New Order from ${order.customerName}`,
    html,
  })
}
