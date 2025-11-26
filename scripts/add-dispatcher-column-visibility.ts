/**
 * Script to add 'data.column_visibility' permission to DISPATCHER role
 * Run with: npx tsx scripts/add-dispatcher-column-visibility.ts
 */

import { prisma } from '../lib/prisma';
import { PermissionService } from '../lib/services/PermissionService';

async function main() {
  try {
    console.log('Adding data.column_visibility permission to DISPATCHER role...');
    
    // Check if permission already exists
    const existing = await prisma.rolePermission.findUnique({
      where: {
        role_permission: {
          role: 'DISPATCHER',
          permission: 'data.column_visibility',
        },
      },
    });

    if (existing) {
      if (existing.isEnabled) {
        console.log('✓ Permission already exists and is enabled');
        return;
      } else {
        // Enable it if it exists but is disabled
        await prisma.rolePermission.update({
          where: {
            role_permission: {
              role: 'DISPATCHER',
              permission: 'data.column_visibility',
            },
          },
          data: { isEnabled: true },
        });
        console.log('✓ Permission was disabled, now enabled');
        return;
      }
    }

    // Add the permission
    await prisma.rolePermission.create({
      data: {
        role: 'DISPATCHER',
        permission: 'data.column_visibility',
        isEnabled: true,
      },
    });

    console.log('✓ Successfully added data.column_visibility permission to DISPATCHER role');
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.code === 'P2002') {
      console.log('Permission already exists (unique constraint violation)');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

