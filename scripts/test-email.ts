
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
    console.log(`Using Resend from: ${process.env.RESEND_FROM_EMAIL || process.env.AWS_SES_FROM_EMAIL}`);

    if (!process.env.RESEND_API_KEY) {
        console.error("ERROR: RESEND_API_KEY is missing in .env.local");
        process.exit(1);
    }

    try {
        const success = await EmailService.sendEmail({
            to: toEmail,
            subject: "TMS Trucking - Email Test",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Resend Configuration Test</h1>
          <p>This is a test email from your TMS Trucking application.</p>
          <p>If you are receiving this, your Resend configuration is working correctly!</p>
          <hr/>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
        });

        if (success) {
            console.log("Email sent successfully!");
        } else {
            console.error("Failed to send email. Check console for error details.");
        }
    } catch (error) {
        console.error("Unexpected error:", error);
    }
}

testEmail();
