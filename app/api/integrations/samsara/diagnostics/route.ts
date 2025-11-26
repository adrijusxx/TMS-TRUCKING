import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getSamsaraConfig } from '@/lib/integrations/samsara';

/**
 * GET /api/integrations/samsara/diagnostics
 * Test various Samsara API endpoints to determine what permissions/capabilities are available
 * Returns a simple report of what data you can retrieve
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const results: Record<string, { 
      available: boolean; 
      status: number; 
      message: string; 
      description?: string;
      count?: number;
      sample?: any;
    }> = {};

    // Test endpoints in order of importance
    const endpoints = [
      {
        name: 'Vehicles List',
        endpoint: '/fleet/vehicles',
        description: 'Get list of all vehicles in your fleet',
        category: 'Essential',
      },
      {
        name: 'Vehicle Locations',
        endpoint: '/fleet/vehicles/locations',
        description: 'Get real-time location of all vehicles',
        category: 'Essential',
      },
      {
        name: 'Assets (Trailers)',
        endpoint: '/fleet/assets',
        description: 'Get list of trailers/assets in your fleet',
        category: 'Trailers',
      },
      {
        name: 'Vehicle Stats',
        endpoint: '/fleet/vehicles/stats?types=ecuSpeedMph,fuelPercents',
        description: 'Get vehicle speed, fuel level, odometer, engine hours',
        category: 'Telemetry',
      },
      {
        name: 'Vehicle Diagnostics',
        endpoint: '/fleet/vehicles/stats?types=faultCodes',
        description: 'Get fault codes and check engine light status',
        category: 'Telemetry',
      },
      {
        name: 'Drivers List',
        endpoint: '/fleet/drivers',
        description: 'Get list of all drivers',
        category: 'Drivers',
      },
      {
        name: 'HOS Statuses',
        endpoint: '/fleet/hos_statuses',
        description: 'Get Hours of Service status for drivers',
        category: 'Compliance',
      },
      {
        name: 'Trips',
        endpoint: '/fleet/trips?limit=1',
        description: 'Get recent trip history (requires vehicleIds filter)',
        category: 'Trips',
      },
      {
        name: 'Camera Media',
        endpoint: '/fleet/cameras/media?limit=1',
        description: 'Get camera images/videos (requires Safety license)',
        category: 'Safety',
      },
      {
        name: 'Routes',
        endpoint: '/fleet/routes?limit=1',
        description: 'Get route information',
        category: 'Routes',
      },
      {
        name: 'Addresses',
        endpoint: '/fleet/addresses?limit=1',
        description: 'Get saved addresses',
        category: 'Addresses',
      },
    ];

    // Get Samsara config (from database or env)
    const config = await getSamsaraConfig(companyId);
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIG_MISSING',
            message: 'Samsara API key not configured. Check database Integration table or SAMSARA_API_KEY in .env.local',
          },
        },
        { status: 400 }
      );
    }

    // Test each endpoint
    for (const test of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${config.baseUrl}${test.endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        const duration = Date.now() - startTime;
        const status = response.status;

        let message = '';
        let simpleStatus = '';
        let sampleData: any = null;
        let dataCount = 0;

        if (response.ok) {
          try {
            const data = await response.json();
            const rawData = Array.isArray(data) ? data : (data?.data || []);
            dataCount = Array.isArray(rawData) ? rawData.length : (rawData ? 1 : 0);
            
            // Get sample data (first item) for successful endpoints
            if (dataCount > 0) {
              if (Array.isArray(rawData)) {
                sampleData = rawData[0];
              } else if (data?.data && Array.isArray(data.data)) {
                sampleData = data.data[0];
              } else {
                sampleData = rawData;
              }
            }
            
            simpleStatus = '✅ Works';
            message = dataCount > 0 ? `${dataCount} items found` : 'Accessible';
          } catch (e) {
            simpleStatus = '✅ Works';
            message = 'Accessible (could not parse response)';
          }
        } else if (status === 401) {
          simpleStatus = '❌ No Access';
          message = 'API key invalid';
        } else if (status === 403) {
          simpleStatus = '❌ No Permission';
          message = 'Missing permission';
        } else if (status === 404) {
          simpleStatus = '❌ Not Available';
          message = 'Feature not enabled';
        } else if (status === 400) {
          simpleStatus = '⚠️ Needs Params';
          message = 'Requires parameters';
        } else {
          simpleStatus = '❌ Error';
          message = `Status ${status}`;
        }

        results[test.name] = {
          available: response.ok,
          status,
          message: simpleStatus,
          description: message,
          count: dataCount,
          sample: sampleData ? sanitizeSampleData(test.name, sampleData) : null,
        };
      } catch (error: any) {
        results[test.name] = {
          available: false,
          status: 0,
          message: '❌ Error',
          description: error.message || 'Request failed',
          count: 0,
          sample: null,
        };
      }
    }

    // Summary
    const available = Object.values(results).filter((r) => r.available).length;
    const total = Object.keys(results).length;

    // Detailed format with sample data
    const detailedResults = endpoints.map((test) => ({
      name: test.name,
      status: results[test.name].message,
      info: results[test.name].description,
      category: test.category,
      count: results[test.name].count || 0,
      sample: results[test.name].sample,
    }));

    return NextResponse.json({
      success: true,
      summary: `${available} of ${total} endpoints available`,
      results: detailedResults,
      recommendations: generateRecommendations(results),
    });
  } catch (error: any) {
    console.error('Samsara diagnostics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to run diagnostics',
        },
      },
      { status: 500 }
    );
  }
}

function sanitizeSampleData(endpointName: string, data: any): any {
  // Return a clean, readable sample of the data
  if (!data) return null;
  
  // For vehicles, show key fields
  if (endpointName === 'Vehicles List' || endpointName === 'Vehicle Locations') {
    return {
      id: data.id,
      name: data.name,
      licensePlate: data.licensePlate,
      location: data.location ? {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        speed: data.location.speedMilesPerHour,
        heading: data.location.heading,
      } : undefined,
    };
  }
  
  // For stats, show what data is available
  if (endpointName === 'Vehicle Stats') {
    return {
      vehicleId: data.vehicleId,
      ecuSpeedMph: data.ecuSpeedMph,
      fuelPercents: Array.isArray(data.fuelPercents) ? data.fuelPercents.slice(0, 2) : data.fuelPercents,
      obdOdometerMeters: data.obdOdometerMeters,
      engineStates: data.engineStates,
    };
  }
  
  // For diagnostics, show fault info
  if (endpointName === 'Vehicle Diagnostics') {
    return {
      vehicleId: data.vehicleId,
      checkEngineLightOn: data.checkEngineLightOn,
      faultCodes: Array.isArray(data.faultCodes) ? data.faultCodes.slice(0, 3) : data.faultCodes,
    };
  }
  
  // For drivers
  if (endpointName === 'Drivers List') {
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      isActive: data.isActive,
    };
  }
  
  // Default: return first 5 keys of the object
  const keys = Object.keys(data).slice(0, 5);
  const sample: any = {};
  keys.forEach(key => {
    sample[key] = data[key];
  });
  return sample;
}

function generateRecommendations(
  results: Record<string, { available: boolean; status: number; message: string }>
): string[] {
  const recommendations: string[] = [];

  if (!results['Vehicles List']?.available) {
    recommendations.push('Add "Vehicles - Read" permission to your API token');
  }

  if (!results['Vehicle Locations']?.available) {
    recommendations.push('Add "Vehicles - Read" permission (required for Live Map)');
  }

  if (!results['Vehicle Stats']?.available && results['Vehicle Locations']?.available) {
    recommendations.push('Add "Vehicles Statistics - Read" to see fuel level and odometer');
  }

  if (!results['Assets (Trailers)']?.available) {
    recommendations.push('Add "Assets - Read" permission to see trailers');
  }

  if (!results['Camera Media']?.available && results['Vehicles List']?.available) {
    recommendations.push('Camera Media requires Safety license + "Safety - Read" permission');
  }

  if (results['Vehicles List']?.available && results['Vehicle Locations']?.available) {
    recommendations.push('✅ Live Map should work - you have vehicle location access');
  }

  return recommendations;
}

