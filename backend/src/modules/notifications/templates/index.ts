import { NotificationType } from '../../../types/notification.types';

interface TemplateVars {
  name?:          string;
  amount?:        string;
  property?:      string;
  daysUntilDue?:  number;
  dueDate?:       string;
  reference?:     string;
  otp?:           string;
  reason?:        string;
}

interface Template {
  title:    string;
  sms:      string;
  whatsapp: string;
  emailSubject: string;
  emailHtml:    string;
}

export function getTemplate(type: NotificationType, vars: TemplateVars): Template {
  const v = vars;

  const templates: Record<NotificationType, Template> = {
    otp: {
      title:        'Verification Code',
      sms:          `Your PropMan verification code is: ${v.otp}. Valid for 10 minutes. Do not share.`,
      whatsapp:     `Hello ${v.name ?? 'there'}! Your PropMan verification code is *${v.otp}*. Valid for 10 minutes. Do not share with anyone.`,
      emailSubject: 'Your PropMan Verification Code',
      emailHtml:    `<p>Hello ${v.name ?? 'there'},</p><p>Your verification code is: <strong>${v.otp}</strong></p><p>Valid for 10 minutes.</p>`,
    },

    payment_due: {
      title:        `Rent Due in ${v.daysUntilDue} Day${v.daysUntilDue === 1 ? '' : 's'}`,
      sms:          `Reminder: ₦${v.amount} rent for ${v.property} is due on ${v.dueDate}. Pay now on PropMan.`,
      whatsapp:     `Hi ${v.name ?? 'there'} 👋\n\nYour rent of *₦${v.amount}* for *${v.property}* is due on *${v.dueDate}*.\n\nPay now on PropMan to avoid late fees.`,
      emailSubject: `Rent Reminder: ₦${v.amount} due on ${v.dueDate}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>Your rent of <strong>₦${v.amount}</strong> for <strong>${v.property}</strong> is due on <strong>${v.dueDate}</strong>.</p><p>Please pay via the PropMan app to avoid late fees.</p>`,
    },

    payment_received: {
      title:        'Rent Payment Received',
      sms:          `Payment of ₦${v.amount} received for ${v.property}. Ref: ${v.reference}.`,
      whatsapp:     `✅ *Payment Confirmed!*\n\nAmount: ₦${v.amount}\nProperty: ${v.property}\nRef: ${v.reference}\n\nYour receipt is available in the PropMan app.`,
      emailSubject: `Payment Receipt — ₦${v.amount} for ${v.property}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>We've received your rent payment of <strong>₦${v.amount}</strong> for <strong>${v.property}</strong>.</p><p>Reference: <code>${v.reference}</code></p><p>Your receipt is available in the PropMan app.</p>`,
    },

    payment_failed: {
      title:        'Payment Failed',
      sms:          `Your rent payment of ₦${v.amount} for ${v.property} failed. Please retry on PropMan.`,
      whatsapp:     `❌ *Payment Failed*\n\nYour rent payment of *₦${v.amount}* for *${v.property}* was not successful.\n\nPlease retry in the PropMan app.`,
      emailSubject: `Payment Failed — ₦${v.amount} for ${v.property}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>Your rent payment of <strong>₦${v.amount}</strong> for <strong>${v.property}</strong> was not successful.</p><p>Please retry via the PropMan app.</p>`,
    },

    lease_expiry: {
      title:        `Lease Expiring in ${v.daysUntilDue} Day${v.daysUntilDue === 1 ? '' : 's'}`,
      sms:          `Your lease for ${v.property} expires on ${v.dueDate}. Log in to PropMan to renew.`,
      whatsapp:     `⚠️ *Lease Expiry Notice*\n\nYour lease for *${v.property}* expires on *${v.dueDate}*.\n\nOpen PropMan to initiate renewal.`,
      emailSubject: `Lease Expiry Notice — ${v.property}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>Your lease for <strong>${v.property}</strong> expires on <strong>${v.dueDate}</strong>.</p><p>Please log into PropMan to renew your tenancy agreement.</p>`,
    },

    new_match: {
      title:        'New Roommate Match!',
      sms:          `You have a new roommate match on PropMan! Open the app to view their profile.`,
      whatsapp:     `🎉 *New Roommate Match!*\n\nSomeone is interested in being your roommate. Open PropMan to view their profile and connect.`,
      emailSubject: 'You have a new roommate match on PropMan',
      emailHtml:    `<p>Hi ${v.name},</p><p>You have a new roommate match on PropMan!</p><p>Open the app to view their profile and send a message.</p>`,
    },

    complaint_update: {
      title:        'Complaint Update',
      sms:          `Your complaint on PropMan has been updated. Open the app for details.`,
      whatsapp:     `📋 *Complaint Update*\n\nYour complaint has been updated. Open PropMan to see the latest response.`,
      emailSubject: 'Your complaint has been updated',
      emailHtml:    `<p>Hi ${v.name},</p><p>Your complaint on PropMan has received an update.</p><p>Log in to view the latest message and respond.</p>`,
    },

    agreement_ready: {
      title:        'Tenancy Agreement Ready',
      sms:          `Your tenancy agreement for ${v.property} is ready. Open PropMan to review and sign.`,
      whatsapp:     `📄 *Agreement Ready to Sign*\n\nYour tenancy agreement for *${v.property}* is ready.\n\nOpen PropMan to review and sign.`,
      emailSubject: `Tenancy Agreement Ready — ${v.property}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>Your tenancy agreement for <strong>${v.property}</strong> is ready for your signature.</p><p>Please log into PropMan to review and sign.</p>`,
    },

    kyc_approved: {
      title:        'Identity Verified ✓',
      sms:          `Your identity has been verified on PropMan. You can now access all features.`,
      whatsapp:     `✅ *Identity Verified!*\n\nYour identity has been verified on PropMan. You now have full access to all features.`,
      emailSubject: 'Your identity has been verified on PropMan',
      emailHtml:    `<p>Hi ${v.name},</p><p>Your identity verification was successful. You now have full access to PropMan.</p>`,
    },

    kyc_rejected: {
      title:        'Identity Verification Failed',
      sms:          `Your KYC verification on PropMan was unsuccessful. Reason: ${v.reason}. Please resubmit.`,
      whatsapp:     `❌ *Verification Failed*\n\nYour identity verification was unsuccessful.\n\nReason: ${v.reason}\n\nPlease resubmit via the PropMan app.`,
      emailSubject: 'Action Required: Identity Verification Failed',
      emailHtml:    `<p>Hi ${v.name},</p><p>Your identity verification was unsuccessful.</p><p><strong>Reason:</strong> ${v.reason}</p><p>Please resubmit your documents via the PropMan app.</p>`,
    },

    listing_approved: {
      title:        'Listing Approved ✓',
      sms:          `Your property listing "${v.property}" has been approved and is now live on PropMan.`,
      whatsapp:     `✅ *Listing Approved!*\n\nYour property *${v.property}* is now live on PropMan and visible to tenants.`,
      emailSubject: `Listing Approved — ${v.property}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>Your property listing <strong>${v.property}</strong> has been approved and is now visible to tenants on PropMan.</p>`,
    },

    listing_rejected: {
      title:        'Listing Rejected',
      sms:          `Your listing "${v.property}" was rejected. Reason: ${v.reason}. Edit and resubmit on PropMan.`,
      whatsapp:     `❌ *Listing Rejected*\n\nYour property *${v.property}* was not approved.\n\nReason: ${v.reason}\n\nPlease edit and resubmit via PropMan.`,
      emailSubject: `Action Required: Listing Rejected — ${v.property}`,
      emailHtml:    `<p>Hi ${v.name},</p><p>Your listing <strong>${v.property}</strong> was rejected.</p><p><strong>Reason:</strong> ${v.reason}</p><p>Please update and resubmit via the PropMan app.</p>`,
    },
  };

  return templates[type];
}
