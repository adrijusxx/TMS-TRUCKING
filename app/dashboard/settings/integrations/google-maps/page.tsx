import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Map, AlertCircle } from 'lucide-react';

export default async function GoogleMapsIntegrationPage() {
    const session = await auth();

    if (!session?.user?.companyId) {
        redirect('/login');
    }

    // Check if Google Maps API is configured
    const isConfigured = !!process.env.GOOGLE_MAPS_API_KEY;

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Google Maps Integration</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Distance calculation, route planning, and geocoding services.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Map className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Connection Status</CardTitle>
                                <CardDescription>Google Maps Platform API</CardDescription>
                            </div>
                        </div>
                        {isConfigured ? (
                            <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Not Configured
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="font-medium">Distance Matrix API</div>
                            <div className="text-muted-foreground text-xs">Mileage calculations between stops</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="font-medium">Directions API</div>
                            <div className="text-muted-foreground text-xs">Route planning and ETAs</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="font-medium">Geocoding API</div>
                            <div className="text-muted-foreground text-xs">Address to coordinates</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                            <div className="font-medium">Places API</div>
                            <div className="text-muted-foreground text-xs">Address autocomplete</div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="font-medium text-sm mb-2">Configuration</h4>
                        <p className="text-sm text-muted-foreground">
                            {isConfigured ? (
                                <>Google Maps API is configured via environment variables. The API key is managed by the TMS provider.</>
                            ) : (
                                <>Contact your TMS administrator to configure the Google Maps API key.</>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
