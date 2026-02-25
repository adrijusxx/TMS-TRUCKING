import { redirect } from 'next/navigation';

export default function InspectionsRedirect() {
  redirect('/dashboard/fleet/inspections');
}
