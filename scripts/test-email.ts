
import { EmailService } from "../lib/services/EmailService";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testEmail() {
    const args = process.argv.slice(2);
    const toEmail = args[0];

    if (!toEmail) {
        console.error("Please provide a recipient email address.");
        console.error("Usage: npx tsx scripts/test-email.ts <email>");
        process.exit(1);
    }

    console.log(`Sending test email to ${toEmail}...`);
    console.log(`Using AWS Region: ${process.env.AWS_REGION}`);
    console.log(`Using Sender: ${process.env.AWS_SES_FROM_EMAIL}`);

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error("ERROR: AWS credentials are missing in .env.local");
        process.exit(1);
    }

    try {
        const success = await EmailService.sendEmail({
            to: toEmail,
            from: process.env.AWS_SES_FROM_EMAIL!,
            subject: "TMS Trucking - SES Test",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Amazon SES Configuration Test</h1>
          <p>This is a test email from your TMS Trucking application.</p>
          <p>If you are receiving this, your AWS SES configuration is working correctly!</p>
          <hr/>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
        });

        if (success) {
            console.log("✅ Email sent successfully!");
        } else {
            console.error("❌ Failed to send email. Check console for error details.");
        }
    } catch (error) {
        console.error("❌ Unexpected error:", error);
    }
}

testEmail();
