import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can upload company logos' } },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } },
                { status: 400 }
            );
        }

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: { code: 'BAD_REQUEST', message: 'File size must be less than 5MB' } },
                { status: 400 }
            );
        }

        // Validate type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: { code: 'BAD_REQUEST', message: 'File must be an image' } },
                { status: 400 }
            );
        }

        // Prepare upload directory
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'company-logos');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop() || 'png';
        // Sanitize extension
        const safeExtension = fileExtension.replace(/[^a-zA-Z0-9]/g, '');
        const filename = `${session.user.companyId}-${randomBytes(8).toString('hex')}.${safeExtension}`;
        const filePath = join(uploadDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Return URL
        const url = `/uploads/company-logos/${filename}`;

        return NextResponse.json({
            success: true,
            data: {
                url,
            },
        });

    } catch (error) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upload logo' } },
            { status: 500 }
        );
    }
}
