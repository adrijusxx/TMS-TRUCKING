'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SourceROIReport from './SourceROIReport';
import ConversionFunnelReport from './ConversionFunnelReport';
import TimeInStageReport from './TimeInStageReport';
import RecruiterPerformanceReport from './RecruiterPerformanceReport';

export default function RecruitingReports() {
    return (
        <Tabs defaultValue="source" className="space-y-4">
            <TabsList>
                <TabsTrigger value="source">Source ROI</TabsTrigger>
                <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
                <TabsTrigger value="time">Time in Stage</TabsTrigger>
                <TabsTrigger value="recruiter">Recruiter Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="source">
                <Card>
                    <CardHeader>
                        <CardTitle>Source ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SourceROIReport />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="funnel">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ConversionFunnelReport />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="time">
                <Card>
                    <CardHeader>
                        <CardTitle>Time in Stage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TimeInStageReport />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="recruiter">
                <Card>
                    <CardHeader>
                        <CardTitle>Recruiter Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecruiterPerformanceReport />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
