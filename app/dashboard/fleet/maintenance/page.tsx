import { redirect } from 'next/navigation';

export default function PreventiveMaintenanceRedirect() {
  redirect('/dashboard/fleet?tab=maintenance');
}
