import DriverApplicationForm from '@/components/crm/public/DriverApplicationForm';

interface ApplyPageProps {
    params: Promise<{ slug: string }>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
    const { slug } = await params;
    return <DriverApplicationForm slug={slug} />;
}
