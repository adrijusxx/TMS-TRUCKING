import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import MessageThread from '@/components/mobile/MessageThread';

export default async function DriverMessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const driver = await prisma.driver.findFirst({
    where: {
      userId: session.user.id,
      deletedAt: null,
      isActive: true,
    },
  });

  if (!driver) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-white dark:bg-zinc-900 dark:border-b shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with dispatch</p>
      </div>
      <MessageThread />
    </div>
  );
}
