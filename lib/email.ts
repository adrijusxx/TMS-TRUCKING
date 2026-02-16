import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL!,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html },
        Text: { Data: text || html.replace(/<[^>]*>/g, "") },
      },
    },
  });

  return await ses.send(command);
}

export const emailTemplates = {
  accountCreation: (name: string, email: string) => ({
    subject: "Welcome to TMS",
    html: `<h1>Welcome ${name}!</h1><p>Your account has been created with email: ${email}</p>`,
  }),
  
  passwordReset: (resetLink: string) => ({
    subject: "Reset Your Password",
    html: `<p>Click here to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  }),
  
  notification: (title: string, message: string) => ({
    subject: title,
    html: `<h2>${title}</h2><p>${message}</p>`,
  }),
};
