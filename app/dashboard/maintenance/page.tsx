import { redirect } from 'next/navigation';

export default function MaintenanceRedirect() {
  redirect('/dashboard/fleet?tab=maintenance');
}
