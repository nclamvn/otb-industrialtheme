import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import { logger } from '@/lib/logger';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const defaultFrom = process.env.EMAIL_FROM || 'DAFC OTB <otb@dafc.com>';

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email options interface
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: React.ReactElement;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

// Send email function
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, template, from = defaultFrom, cc, bcc, attachments } = options;

  // Check if email is enabled
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    logger.info('Email notifications disabled, skipping email', { to, subject });
    return true;
  }

  try {
    // Render React email to HTML
    const html = await render(template);

    // Send email
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      subject,
      html,
      attachments,
    });

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to,
      subject,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to,
      subject,
    });
    return false;
  }
}

// Batch send emails
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
