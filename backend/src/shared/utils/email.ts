import nodemailer, { Transporter } from "nodemailer";
import { env } from "@/config/env";

export interface SmtpTransportConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  transport?: SmtpTransportConfig | null;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          }
        : undefined,
    });
    return transporter;
  }

  return null;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string; mocked?: boolean }> {
  let mailTransporter: Transporter | null = null;

  if (options.transport?.host) {
    mailTransporter = nodemailer.createTransport({
      host: options.transport.host,
      port: options.transport.port,
      secure: options.transport.port === 465,
      auth: options.transport.user
        ? { user: options.transport.user, pass: options.transport.pass }
        : undefined,
    });
  } else {
    mailTransporter = getTransporter();
  }

  const fromAddress = options.from || env.SMTP_FROM || "noreply@leadgenerator.local";

  if (!mailTransporter) {
    // Development fallback / mock when SMTP is not configured
    console.log(`[Email Mock] Sent to: ${options.to} | Subject: ${options.subject}`);
    return { success: true, mocked: true, messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}` };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ""),
    });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Email Error] Failed to send to ${options.to}:`, err);
    return { success: false, error: err.message || "Email send failure" };
  }
}
