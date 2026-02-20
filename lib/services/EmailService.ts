
import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";



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
    private static client: SESClient | null = null;

    private static getClient(): SESClient {
        if (!this.client) {
            this.client = new SESClient({
                region: process.env.AWS_REGION || "us-east-1",
                // Only provide credentials if they exist; otherwise SDK falls back to IAM Role
                ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
                    ? {
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        },
                    }
                    : {}),
            });
        }
        return this.client;
    }

    static async sendEmail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
        try {
            const command = new SendEmailCommand({
                Destination: {
                    ToAddresses: Array.isArray(to) ? to : [to],
                },
                Message: {
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data: html,
                        },
                    },
                    Subject: {
                        Charset: "UTF-8",
                        Data: subject,
                    },
                },
                Source: from || process.env.AWS_SES_FROM_EMAIL || "noreply@yourdomain.com",
            });

            const response = await this.getClient().send(command);
            console.log("Email sent successfully:", response.MessageId);
            return true;
        } catch (error) {
            console.error("Failed to send email:", error);
            // Don't throw, just return false so we don't break the registration flow
            return false;
        }
    }

    /**
     * Send email with PDF attachments via SES SendRawEmail.
     * Builds a MIME multipart message with inline HTML and file attachments.
     */
    static async sendEmailWithAttachment({
        to, subject, html, from, attachments,
    }: EmailWithAttachmentOptions): Promise<EmailSendResult> {
        try {
            const sender = from || process.env.AWS_SES_FROM_EMAIL || "noreply@yourdomain.com";
            const recipients = Array.isArray(to) ? to : [to];
            const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;

            let rawMessage = `From: ${sender}\r\n`;
            rawMessage += `To: ${recipients.join(", ")}\r\n`;
            rawMessage += `Subject: ${subject}\r\n`;
            rawMessage += `MIME-Version: 1.0\r\n`;
            rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

            // HTML body part
            rawMessage += `--${boundary}\r\n`;
            rawMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
            rawMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
            rawMessage += `${html}\r\n\r\n`;

            // Attachment parts
            for (const attachment of attachments) {
                const base64Content = Buffer.from(attachment.content).toString("base64");
                rawMessage += `--${boundary}\r\n`;
                rawMessage += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
                rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
                rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
                // Split base64 into 76-char lines per MIME spec
                rawMessage += base64Content.replace(/(.{76})/g, "$1\r\n") + "\r\n\r\n";
            }

            rawMessage += `--${boundary}--\r\n`;

            const command = new SendRawEmailCommand({
                RawMessage: { Data: Buffer.from(rawMessage) },
                Destinations: recipients,
                Source: sender,
            });

            const response = await this.getClient().send(command);
            console.log("Email with attachment sent:", response.MessageId);
            return { success: true, messageId: response.MessageId };
        } catch (error) {
            console.error("Failed to send email with attachment:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    static async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        // Basic Welcome Template
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
        <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TMS Trucking. All rights reserved.</p>
      </div>
    `;

        return this.sendEmail({ to, subject, html });
    }
}
