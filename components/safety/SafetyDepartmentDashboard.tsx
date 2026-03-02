'use client';

import { useSearchParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import AccidentsTab from './accidents/AccidentsTab';
import ClaimsTab from './claims/ClaimsTab';
import InspectionsTab from './inspections/InspectionsTab';
import SafetyOverviewTab from './overview/SafetyOverviewTab';
import SafetyBoardTab from './board/SafetyBoardTab';
import SafetyCalendarTab from './calendar/SafetyCalendarTab';
import SafetyArchiveTab from './archive/SafetyArchiveTab';

export default function SafetyDepartmentDashboard() {
  const { can } = usePermissions();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'accidents';

  return (
    <div className="space-y-4">
      {tab === 'accidents' && <AccidentsTab />}
      {tab === 'claims' && <ClaimsTab />}
      {tab === 'inspections' && <InspectionsTab />}
      {tab === 'board' && <SafetyBoardTab />}
      {tab === 'calendar' && <SafetyCalendarTab />}
      {tab === 'archive' && <SafetyArchiveTab />}
      {tab === 'overview' && can('safety.overview.view') && <SafetyOverviewTab />}
    </div>
  );
}
