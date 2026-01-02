'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { EmailService } from '@/lib/services/EmailService';
import { prisma } from '@/lib/prisma';

export async function sendPodReminder(loadId: string, dispatcherEmail: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return { success: false, error: 'Unauthorized' };
        }

        const load = await prisma.load.findUnique({
            where: { id: loadId },
            include: {
                customer: { select: { name: true } },
                driver: { include: { user: true } },
            },
        });

        if (!load) {
            return { success: false, error: 'Load not found' };
        }

        if (!dispatcherEmail) {
            return { success: false, error: 'Dispatcher has no email address' };
        }

        const subject = `ACTION REQUIRED: Missing POD for Load #${load.loadNumber}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Missing Proof of Delivery</h2>
        <p>Hello,</p>
        <p>This is a reminder that the Proof of Delivery (POD) for the following load is outstanding:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Load #:</strong> ${load.loadNumber}</p>
            <p><strong>Customer:</strong> ${load.customer?.name}</p>
            <p><strong>Driver:</strong> ${load.driver?.user?.firstName} ${load.driver?.user?.lastName}</p>
            <p><strong>Delivered Date:</strong> ${load.deliveredAt ? new Date(load.deliveredAt).toLocaleDateString() : 'N/A'}</p>
        </div>

        <p>Please obtain the POD from the driver and upload it to the system immediately so this load can be invoiced.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">TMS Automated Watchdog</p>
      </div>
    `;

        const sent = await EmailService.sendEmail({
            to: dispatcherEmail,
            subject,
            html,
        });

        if (!sent) {
            return { success: false, error: 'Failed to send email via SES' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending POD reminder:', error);
        return { success: false, error: error.message };
    }
}
