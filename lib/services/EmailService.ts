
import { Resend } from "resend";

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

interface EmailAttachment {
    filename: string;
    content: Buffer | Uint8Array;
    contentType: string;
}

interface EmailWithAttachmentOptions extends EmailOptions {
    attachments: EmailAttachment[];
}

interface EmailSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export class EmailService {
    private static client: Resend | null = null;

    private static getClient(): Resend {
        if (!this.client) {
            this.client = new Resend(process.env.RESEND_API_KEY);
        }
        return this.client;
    }

    private static getFromEmail(from?: string): string {
        return from || process.env.RESEND_FROM_EMAIL || process.env.AWS_SES_FROM_EMAIL!;
    }

    static async sendEmail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
        try {
            const { error } = await this.getClient().emails.send({
                from: this.getFromEmail(from),
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
            });

            if (error) {
                console.error("Failed to send email:", error);
                return false;
            }

            console.log("Email sent successfully via Resend");
            return true;
        } catch (error) {
            console.error("Failed to send email:", error);
            return false;
        }
    }

    static async sendEmailWithAttachment({
        to, subject, html, from, attachments,
    }: EmailWithAttachmentOptions): Promise<EmailSendResult> {
        try {
            const { data, error } = await this.getClient().emails.send({
                from: this.getFromEmail(from),
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                attachments: attachments.map((att) => ({
                    filename: att.filename,
                    content: Buffer.from(att.content),
                })),
            });

            if (error) {
                console.error("Failed to send email with attachment:", error);
                return { success: false, error: error.message };
            }

            console.log("Email with attachment sent via Resend:", data?.id);
            return { success: true, messageId: data?.id };
        } catch (error) {
            console.error("Failed to send email with attachment:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    static async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        const subject = "Welcome to TMS Trucking Platform";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to TMS, ${name}!</h2>
        <p>Thank you for registering with our platform.</p>
        <p>Your account has been successfully created. You can now log in to access your dashboard.</p>
        <div style="margin: 30px 0;">
          <a href="${appUrl}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Dashboard</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} TMS Trucking. All rights reserved.</p>
      </div>
    `;

        return this.sendEmail({ to, subject, html });
    }
}
