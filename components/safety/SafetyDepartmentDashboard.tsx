'use client';

import { useSearchParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import SafetyTasksTab from './tasks/SafetyTasksTab';
import ClaimsTab from './claims/ClaimsTab';
import InspectionsTab from './inspections/InspectionsTab';
import SafetyOverviewTab from './overview/SafetyOverviewTab';
import SafetyBoardTab from './board/SafetyBoardTab';
import SafetyCalendarTab from './calendar/SafetyCalendarTab';
import SafetyArchiveTab from './archive/SafetyArchiveTab';

export default function SafetyDepartmentDashboard() {
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'tasks';

  return (
    <div className="space-y-4">
      {tab === 'tasks' && <SafetyTasksTab />}
      {tab === 'board' && <SafetyBoardTab />}
      {tab === 'calendar' && <SafetyCalendarTab />}
      {tab === 'archive' && <SafetyArchiveTab />}
      {tab === 'inspections' && <InspectionsTab />}
      {tab === 'claims' && <ClaimsTab />}
      {tab === 'overview' && can('safety.overview.view') && <SafetyOverviewTab />}
    </div>
  );
}
