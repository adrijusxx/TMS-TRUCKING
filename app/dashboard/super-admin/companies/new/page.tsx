import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import NewCompanyClient from './NewCompanyClient';

export default async function NewCompanyPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        notFound();
    }

    return (
        <div className="p-6">
            <NewCompanyClient />
        </div>
    );
}
