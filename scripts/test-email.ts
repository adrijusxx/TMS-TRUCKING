import { EmailService } from '@/lib/services/EmailService';

const TEST_EMAIL = process.argv[2] || process.env.TEST_EMAIL;

async function testEmail() {
    if (!TEST_EMAIL) {
        console.error('Please provide an email address as an argument or set TEST_EMAIL env var.');
        console.log('Usage: npx ts-node scripts/test-email.ts <your-email>');
        process.exit(1);
    }

    console.log(`Sending test email to: ${TEST_EMAIL}...`);

    try {
        const success = await EmailService.sendEmail({
            to: TEST_EMAIL,
            subject: 'TMS Trucking - AWS SES Test',
            html: `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: #0ea5e9;">AWS SES Configuration Verified</h1>
                <p>If you are reading this, your AWS credentials and SES setup are working correctly.</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
        `
        });

        if (success) {
            console.log('✅ Email sent successfully!');
        } else {
            console.error('❌ Failed to send email. Check console logs for details.');
        }
    } catch (error) {
        console.error('❌ Error executing test:', error);
    }
}

testEmail();
