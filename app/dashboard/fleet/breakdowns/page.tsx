import { redirect } from 'next/navigation';

export default function FleetBreakdownsPage() {
  // Redirect to main fleet dashboard with breakdowns tab active
  redirect('/dashboard/fleet?tab=breakdowns');
}
