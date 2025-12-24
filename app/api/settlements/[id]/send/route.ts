import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const settlementId = resolvedParams.id;

    // Fetch settlement with driver information
    const settlement = await prisma.settlement.findFirst({
      where: {
        id: settlementId,
        driver: {
          companyId: session.user.companyId,
        },
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Settlement not found' },
        },
        { status: 404 }
      );
    }

    // Get driver email
    const driverEmail = settlement.driver.user.email;
    if (!driverEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_EMAIL',
            message: 'Driver email address not found',
          },
        },
        { status: 400 }
      );
    }

    // Fetch company information
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    // Generate settlement PDF URL
    const settlementPdfUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlements/${settlement.id}/pdf`;

    // Email content
    const emailSubject = `Settlement Statement ${settlement.settlementNumber} from ${company?.name || 'Your TMS'}`;
    const emailBody = generateSettlementEmail(settlement, company, settlementPdfUrl);

    // In production, use a service like SendGrid, AWS SES, or Resend
    // For now, this is a placeholder that logs the email
    console.log('=== SETTLEMENT EMAIL ===');
    console.log('To:', driverEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);
    console.log('PDF URL:', settlementPdfUrl);
    console.log('===================');

    // Placeholder: In production, send actual email with PDF attachment
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //   to: driverEmail,
    //   from: process.env.FROM_EMAIL,
    //   subject: emailSubject,
    //   html: emailBody,
    //   attachments: [
    //     {
    //       content: pdfBuffer.toString('base64'),
    //       filename: `settlement-${settlement.settlementNumber}.pdf`,
    //       type: 'application/pdf',
    //       disposition: 'attachment',
    //     },
    //   ],
    // };
    // 
    // await sgMail.send(msg);

    // Log email send event
    const { createActivityLog } = await import('@/lib/activity-log');
    const requestHeaders = request.headers;
    await createActivityLog({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: 'SEND',
      entityType: 'Settlement',
      entityId: settlement.id,
      description: `Settlement ${settlement.settlementNumber} sent to ${driverEmail}`,
      ipAddress: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || undefined,
      userAgent: requestHeaders.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Settlement email sent successfully',
      data: {
        settlementId: settlement.id,
        recipientEmail: driverEmail,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Settlement email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

function generateSettlementEmail(settlement: any, company: any, pdfUrl: string): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const driverName = `${settlement.driver.user.firstName} ${settlement.driver.user.lastName}`;
  const periodStart = formatDate(settlement.periodStart);
  const periodEnd = formatDate(settlement.periodEnd);
  const netPay = formatCurrency(settlement.netPay);
  const grossPay = formatCurrency(settlement.grossPay);
  const deductions = formatCurrency(settlement.deductions);
  const advances = formatCurrency(settlement.advances);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settlement Statement ${settlement.settlementNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: #1f2937; margin: 0 0 10px 0;">Settlement Statement</h1>
    <p style="margin: 0; color: #6b7280;">Settlement Number: <strong>${settlement.settlementNumber}</strong></p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 5px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello ${driverName},</h2>
    <p>Your settlement statement for the period <strong>${periodStart}</strong> to <strong>${periodEnd}</strong> is ready for review.</p>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Settlement Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Gross Pay:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${grossPay}</td>
        </tr>
        ${settlement.deductions > 0 ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Deductions:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">-${deductions}</td>
        </tr>
        ` : ''}
        ${settlement.advances > 0 ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Advances:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">-${advances}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #1f2937;">Net Pay:</td>
          <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; border-top: 2px solid #1f2937; color: ${settlement.netPay >= 0 ? '#16a34a' : '#dc2626'};">${netPay}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 20px 0;">Your detailed settlement statement is attached as a PDF. The statement includes:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Complete breakdown of all loads included in this settlement</li>
      <li>Miles driven for each load</li>
      <li>Revenue and driver pay for each load</li>
      <li>Detailed list of all deductions</li>
      <li>Pay rate information</li>
      <li>Financial summary</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${pdfUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Settlement PDF</a>
    </div>

    ${settlement.notes ? `
    <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 5px; margin: 20px 0;">
      <strong>Notes:</strong>
      <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${settlement.notes}</p>
    </div>
    ` : ''}

    <p style="margin-top: 30px;">If you have any questions about this settlement, please contact your dispatcher or accounting department.</p>

    <p style="margin-top: 20px;">Thank you for your hard work!</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">${company?.name || 'Trucking Company'}</p>
    ${company?.address ? `<p style="margin: 5px 0;">${company.address}</p>` : ''}
    ${company?.city && company?.state ? `<p style="margin: 5px 0;">${company.city}, ${company.state} ${company.zipCode || ''}</p>` : ''}
    ${company?.phone ? `<p style="margin: 5px 0;">Phone: ${company.phone}</p>` : ''}
    ${company?.email ? `<p style="margin: 5px 0;">Email: ${company.email}</p>` : ''}
  </div>

  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px;">
    This is an automated email. Please do not reply to this message.
  </p>
</body>
</html>
  `.trim();
}
























