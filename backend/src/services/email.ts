import axios from 'axios';
import { User } from '../models/User';

export interface EmailOptions {
  toUserId: string;
  subject: string;
  htmlContent: string;
}

/**
 * Dispatches an email to the user using SendGrid or Resend if keys are present.
 * If credentials are not present, logs the email details in simulation mode.
 */
export async function sendEmailNotification(options: EmailOptions): Promise<boolean> {
  const { toUserId, subject, htmlContent } = options;

  try {
    const user = await User.findById(toUserId);
    if (!user || !user.email) {
      console.warn(`[Email Service] Cannot send email. User ${toUserId} does not have a configured email address.`);
      return false;
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    // 1. Try SendGrid
    if (sendgridApiKey) {
      try {
        console.log(`[SendGrid API] Sending email to ${user.email}: "${subject}"`);
        await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [{ to: [{ email: user.email }] }],
            from: { email: 'no-reply@travelsphere.ai', name: 'TravelSphere AI' },
            subject,
            content: [{ type: 'text/html', value: htmlContent }]
          },
          {
            headers: {
              Authorization: `Bearer ${sendgridApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return true;
      } catch (err: any) {
        console.error('[SendGrid Service] Failed to send mail:', err.response?.data || err.message);
      }
    }

    // 2. Try Resend
    if (resendApiKey) {
      try {
        console.log(`[Resend API] Sending email to ${user.email}: "${subject}"`);
        await axios.post(
          'https://api.resend.com/emails',
          {
            from: 'TravelSphere AI <onboarding@resend.dev>',
            to: user.email,
            subject,
            html: htmlContent
          },
          {
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return true;
      } catch (err: any) {
        console.error('[Resend Service] Failed to send mail:', err.response?.data || err.message);
      }
    }

    // 3. Fallback / Simulation Mode
    console.log(`[Email Simulator]
=========================================
TO: ${user.email} (User: ${user.name || 'Anonymous'})
SUBJECT: ${subject}
BODY: (HTML Content)
${htmlContent.replace(/<[^>]*>/g, '').substring(0, 200)}...
=========================================`);
    return true;
  } catch (error: any) {
    console.error('[Email Service] Unexpected error:', error.message);
    return false;
  }
}
