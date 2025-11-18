import { redirect } from 'next/navigation';

export default function Home() {
  // Get basePath from environment (set at build time)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/tms';
  redirect(`${basePath}/login`);
}

