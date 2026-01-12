
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";



interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
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
