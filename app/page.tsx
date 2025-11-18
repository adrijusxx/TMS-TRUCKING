import { redirect } from 'next/navigation';

export default function Home() {
  // Next.js redirect() automatically prepends basePath from next.config.js
  redirect('/login');
}

