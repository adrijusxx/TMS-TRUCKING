import { redirect } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    // Redirect to login with callback URL
    redirect('/login?callbackUrl=/mobile/driver');
  }

  // Check if user is a driver
  const driver = await prisma.driver.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!driver) {
    // Instead of redirecting, show a helpful message
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Driver Account Required</h1>
          <p className="text-muted-foreground mb-6">
            Your user account needs to be linked to a Driver record to access the mobile app.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To use the mobile app, you need to:
            </p>
            <ol className="text-left text-sm space-y-2 list-decimal list-inside">
              <li>Go to <a href="/dashboard/drivers" className="text-primary hover:underline">Drivers</a> in the dashboard</li>
              <li>Create a new driver and link it to your user account</li>
              <li>Or ask an admin to link your account to an existing driver</li>
            </ol>
            <div className="pt-4">
              <a
                href="/dashboard/drivers"
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Drivers
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

