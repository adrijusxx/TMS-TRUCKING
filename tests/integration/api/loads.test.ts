import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/loads/route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    load: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/loads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route');
    (auth as any).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/loads');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return loads when authenticated', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route');
    const { prisma } = await import('@/lib/prisma');

    (auth as any).mockResolvedValue({
      user: {
        id: 'user-1',
        companyId: 'company-1',
        role: 'ADMIN',
        mcAccess: [],
      },
    });

    (prisma.load.findMany as any).mockResolvedValue([
      {
        id: 'load-1',
        loadNumber: 'LOAD-001',
        status: 'DISPATCHED',
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/loads');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});



