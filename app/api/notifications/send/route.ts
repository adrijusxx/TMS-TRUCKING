import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { sendNotificationEmail, emailTemplates } from '@/lib/notifications/email';
import { z } from 'zod';

const sendNotificationSchema = z.object({
  userId: z.string(),
  notificationType: z.enum([
    'LOAD_ASSIGNED',
    'LOAD_UPDATED',
    'MAINTENANCE_DUE',
    'HOS_VIOLATION',
    'DOCUMENT_EXPIRING',
    'INVOICE_PAID',
    'SYSTEM_ALERT',
  ]),
  data: z.record(z.string(), z.any()),
});

/**
 * Send a notification email
 * This endpoint can be called internally or by automation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = sendNotificationSchema.parse(body);

    let emailContent;

    // Generate email content based on notification type
    switch (validated.notificationType) {
      case 'LOAD_ASSIGNED':
        emailContent = emailTemplates.loadAssigned(
          validated.data.loadNumber,
          validated.data.customerName,
          validated.data.pickupCity,
          validated.data.deliveryCity
        );
        break;
      case 'LOAD_UPDATED':
        emailContent = emailTemplates.loadUpdated(
          validated.data.loadNumber,
          validated.data.status
        );
        break;
      case 'HOS_VIOLATION':
        emailContent = emailTemplates.hosViolation(
          validated.data.driverName,
          validated.data.violationType
        );
        break;
      case 'MAINTENANCE_DUE':
        emailContent = emailTemplates.maintenanceDue(
          validated.data.truckNumber,
          validated.data.maintenanceType,
          validated.data.dueDate
        );
        break;
      case 'INVOICE_PAID':
        emailContent = emailTemplates.invoicePaid(
          validated.data.invoiceNumber,
          validated.data.amount
        );
        break;
      case 'DOCUMENT_EXPIRING':
        emailContent = emailTemplates.documentExpiring(
          validated.data.documentType,
          validated.data.entityName,
          validated.data.expiryDate
        );
        break;
      case 'SYSTEM_ALERT':
        emailContent = emailTemplates.systemAlert(
          validated.data.title,
          validated.data.message
        );
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_TYPE', message: 'Unknown notification type' },
          },
          { status: 400 }
        );
    }

    const sent = await sendNotificationEmail(validated.userId, validated.notificationType, emailContent);

    return NextResponse.json({
      success: sent,
      data: { sent },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Send notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

