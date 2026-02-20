/**
 * Data Migration Script: Enum Roles → Database Roles
 *
 * This script migrates the hardcoded UserRole enum system to database-driven
 * Role records. It should be run AFTER the additive schema migration (Migration 1)
 * and BEFORE the breaking schema migration (Migration 2).
 *
 * What it does:
 * 1. For each company: Creates 9 system Role records matching old enum values
 * 2. Copies existing RolePermission customizations to RolePermissionEntry
 * 3. Seeds default permissions from systemRoleDefaults for uncustomized roles
 * 4. Sets roleId on every User and UserCompany record
 * 5. Verifies all users have roleId set
 *
 * Usage: npx tsx scripts/migrate-roles-to-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_ROLES = [
  { slug: 'super-admin', name: 'Super Administrator', enumValue: 'SUPER_ADMIN' },
  { slug: 'admin', name: 'Administrator', enumValue: 'ADMIN' },
  { slug: 'dispatcher', name: 'Dispatcher', enumValue: 'DISPATCHER' },
  { slug: 'accountant', name: 'Accountant', enumValue: 'ACCOUNTANT' },
  { slug: 'driver', name: 'Driver', enumValue: 'DRIVER' },
  { slug: 'customer', name: 'Customer', enumValue: 'CUSTOMER' },
  { slug: 'hr', name: 'Human Resources', enumValue: 'HR' },
  { slug: 'safety', name: 'Safety', enumValue: 'SAFETY' },
  { slug: 'fleet', name: 'Fleet Manager', enumValue: 'FLEET' },
] as const;

// Import defaults inline to avoid module resolution issues in standalone script
const systemRoleDefaults: Record<string, string[]> = {
  SUPER_ADMIN: [
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    'loads.bulk_edit', 'loads.bulk_delete',
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    'drivers.bulk_edit', 'drivers.bulk_delete',
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trucks.bulk_edit', 'trucks.bulk_delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'trailers.bulk_edit', 'trailers.bulk_delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'customers.bulk_edit', 'customers.bulk_delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'invoices.bulk_edit', 'invoices.bulk_delete',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'settlements.bulk_edit', 'settlements.bulk_delete',
    'expenses.view', 'expenses.approve',
    'factoring_companies.view', 'factoring_companies.create', 'factoring_companies.edit', 'factoring_companies.delete',
    'factoring_companies.bulk_edit', 'factoring_companies.bulk_delete',
    'rate_confirmations.view', 'rate_confirmations.create', 'rate_confirmations.edit', 'rate_confirmations.delete',
    'rate_confirmations.bulk_edit', 'rate_confirmations.bulk_delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance',
    'company.view', 'company.edit', 'company.branding',
    'analytics.view', 'reports.view', 'reports.export',
    'documents.view', 'documents.upload', 'documents.delete',
    'documents.bulk_edit', 'documents.bulk_delete',
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'batches.bulk_edit', 'batches.bulk_delete',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'maintenance.bulk_edit', 'maintenance.bulk_delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'breakdowns.bulk_edit', 'breakdowns.bulk_delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'inspections.bulk_edit', 'inspections.bulk_delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'vendors.bulk_edit', 'vendors.bulk_delete',
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    'import.view', 'import.execute',
    'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'locations.bulk_edit', 'locations.bulk_delete',
    'data.bulk_actions', 'data.bulk_edit', 'data.bulk_delete',
    'data.import', 'data.export', 'data.column_visibility',
    'data.backup', 'data.restore',
    'automation.view', 'automation.manage',
    'edi.view', 'edi.manage',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    'departments.accounting.view', 'departments.fleet.view', 'departments.safety.view',
    'departments.hr.view', 'departments.reports.view', 'departments.settings.view', 'departments.crm.view',
    'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.delete', 'crm.leads.assign',
    'crm.hire', 'crm.onboarding.view', 'crm.onboarding.manage', 'crm.templates.manage',
  ],
  ADMIN: [
    'loads.view', 'loads.create', 'loads.edit', 'loads.delete', 'loads.assign',
    'loads.bulk_edit', 'loads.bulk_delete',
    'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.delete', 'drivers.manage_compliance',
    'drivers.bulk_edit', 'drivers.bulk_delete',
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trucks.bulk_edit', 'trucks.bulk_delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'trailers.bulk_edit', 'trailers.bulk_delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'customers.bulk_edit', 'customers.bulk_delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'invoices.bulk_edit', 'invoices.bulk_delete',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'expenses.view', 'expenses.approve',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'settings.view', 'settings.edit', 'settings.security', 'settings.notifications', 'settings.appearance',
    'company.view', 'company.edit', 'company.branding',
    'analytics.view', 'reports.view', 'reports.export',
    'documents.view', 'documents.upload', 'documents.delete',
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage',
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    'import.view', 'import.execute',
    'export.view', 'export.execute',
    'mc_numbers.view', 'mc_numbers.create', 'mc_numbers.edit', 'mc_numbers.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'data.bulk_actions', 'data.bulk_edit', 'data.bulk_delete',
    'data.import', 'data.export', 'data.column_visibility',
    'data.backup', 'data.restore',
    'automation.view', 'automation.manage',
    'edi.view', 'edi.manage',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    'departments.accounting.view', 'departments.fleet.view', 'departments.safety.view',
    'departments.hr.view', 'departments.reports.view', 'departments.settings.view', 'departments.crm.view',
    'crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.delete', 'crm.leads.assign',
    'crm.hire', 'crm.onboarding.view', 'crm.onboarding.manage', 'crm.templates.manage',
  ],
  DISPATCHER: [
    'loads.view', 'loads.create', 'loads.edit', 'loads.assign',
    'drivers.view', 'trucks.view', 'trailers.view',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.generate',
    'settlements.view',
    'documents.view', 'documents.upload', 'documents.delete',
    'settings.view',
    'breakdowns.view',
    'calendar.view', 'calendar.edit',
    'loadboard.view', 'loadboard.post',
    'data.column_visibility',
    'departments.settings.view',
  ],
  ACCOUNTANT: [
    'loads.view',
    'customers.view', 'customers.edit',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.generate',
    'settlements.view', 'settlements.create', 'settlements.edit', 'settlements.delete', 'settlements.approve',
    'expenses.view', 'expenses.approve',
    'documents.view', 'documents.upload',
    'analytics.view', 'reports.view', 'reports.export',
    'settings.view',
    'batches.view', 'batches.create', 'batches.edit', 'batches.delete', 'batches.post',
    'deduction_rules.view', 'deduction_rules.create', 'deduction_rules.edit', 'deduction_rules.delete',
    'advances.view', 'advances.create', 'advances.approve', 'advances.delete',
    'departments.accounting.view', 'departments.reports.view', 'departments.settings.view',
  ],
  DRIVER: [
    'loads.view', 'documents.view', 'documents.upload', 'settings.view',
    'departments.settings.view',
  ],
  CUSTOMER: ['loads.view', 'documents.view'],
  HR: [
    'users.view', 'users.create', 'users.edit',
    'drivers.view', 'drivers.create', 'drivers.edit',
    'settings.view', 'settings.edit', 'company.view',
    'documents.view', 'documents.upload',
    'reports.view', 'reports.export', 'analytics.view',
    'departments.hr.view', 'departments.reports.view', 'departments.settings.view',
  ],
  SAFETY: [
    'drivers.view', 'drivers.edit', 'drivers.manage_compliance',
    'trucks.view', 'trucks.edit', 'trailers.view', 'trailers.edit',
    'loads.view', 'documents.view', 'documents.upload',
    'reports.view', 'reports.export', 'settings.view',
    'safety.view', 'safety.manage', 'compliance.view', 'compliance.manage', 'analytics.view',
    'safety.incidents.view', 'safety.incidents.create', 'safety.incidents.edit', 'safety.incidents.delete',
    'safety.drug_tests.view', 'safety.drug_tests.create', 'safety.drug_tests.edit',
    'safety.mvr.view', 'safety.mvr.create', 'safety.mvr.edit',
    'safety.medical_cards.view', 'safety.medical_cards.create', 'safety.medical_cards.edit',
    'safety.hos.view', 'safety.hos.manage',
    'safety.dvir.view', 'safety.dvir.create', 'safety.dvir.edit',
    'safety.training.view', 'safety.training.manage',
    'safety.compliance.view', 'safety.compliance.manage',
    'safety.alerts.view', 'safety.alerts.manage',
    'departments.safety.view', 'departments.reports.view', 'departments.settings.view',
  ],
  FLEET: [
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trailers.view', 'trailers.create', 'trailers.edit', 'trailers.delete',
    'drivers.view', 'drivers.edit', 'loads.view',
    'documents.view', 'documents.upload',
    'reports.view', 'reports.export', 'settings.view', 'analytics.view',
    'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.delete',
    'breakdowns.view', 'breakdowns.create', 'breakdowns.edit', 'breakdowns.delete',
    'inspections.view', 'inspections.create', 'inspections.edit', 'inspections.delete',
    'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.delete',
    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
    'fleet.reports', 'fleet.costs', 'fleet.communications', 'fleet.hotspots', 'fleet.on_call',
    'departments.fleet.view', 'departments.reports.view', 'departments.settings.view',
  ],
};

async function migrateRolesToDb() {
  console.log('Starting role migration...\n');

  // 1. Get all companies
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log(`Found ${companies.length} companies to process.\n`);

  // 2. Get existing RolePermission customizations (old system)
  const oldCustomizations = await (prisma as any).rolePermission.findMany();
  const customizationMap = new Map<string, boolean>();
  for (const c of oldCustomizations) {
    customizationMap.set(`${c.role}:${c.permission}`, c.isEnabled);
  }
  console.log(`Found ${oldCustomizations.length} existing permission customizations.\n`);

  let totalRolesCreated = 0;
  let totalPermissionsCreated = 0;
  let totalUsersUpdated = 0;
  let totalUserCompaniesUpdated = 0;

  for (const company of companies) {
    console.log(`Processing company: ${company.name} (${company.id})`);

    // 3. Create/upsert 9 system Role records per company
    for (const roleDef of SYSTEM_ROLES) {
      const existing = await prisma.role.findUnique({
        where: { slug_companyId: { slug: roleDef.slug, companyId: company.id } },
      });

      if (existing) {
        console.log(`  Role "${roleDef.name}" already exists, skipping creation.`);
        continue;
      }

      const role = await prisma.role.create({
        data: {
          name: roleDef.name,
          slug: roleDef.slug,
          description: `System role: ${roleDef.name}`,
          isSystem: true,
          companyId: company.id,
        },
      });
      totalRolesCreated++;

      // 4. Populate permissions for this role
      const defaultPerms = systemRoleDefaults[roleDef.enumValue] || [];

      // Check for customizations in old RolePermission table
      const permissionsToCreate: string[] = [];
      for (const perm of defaultPerms) {
        const customKey = `${roleDef.enumValue}:${perm}`;
        const isEnabled = customizationMap.get(customKey);
        // If customization exists and is disabled, skip. Otherwise include.
        if (isEnabled === false) continue;
        permissionsToCreate.push(perm);
      }

      // Also check for permissions that were ADDED via customization (not in defaults)
      for (const [key, enabled] of customizationMap.entries()) {
        if (!key.startsWith(`${roleDef.enumValue}:`)) continue;
        if (!enabled) continue;
        const perm = key.split(':')[1];
        if (!permissionsToCreate.includes(perm)) {
          permissionsToCreate.push(perm);
        }
      }

      if (permissionsToCreate.length > 0) {
        await prisma.rolePermissionEntry.createMany({
          data: permissionsToCreate.map(p => ({ roleId: role.id, permission: p })),
          skipDuplicates: true,
        });
        totalPermissionsCreated += permissionsToCreate.length;
      }

      console.log(`  Created role "${roleDef.name}" with ${permissionsToCreate.length} permissions.`);
    }

    // 5. Map roleId onto User records for this company
    const roles = await prisma.role.findMany({
      where: { companyId: company.id, isSystem: true },
      select: { id: true, slug: true },
    });
    const slugToRoleId = new Map(roles.map(r => [r.slug, r.id]));

    // Map enum values to slugs
    const enumToSlug: Record<string, string> = {};
    for (const rd of SYSTEM_ROLES) {
      enumToSlug[rd.enumValue] = rd.slug;
    }

    const users = await prisma.user.findMany({
      where: { companyId: company.id, roleId: null },
      select: { id: true, role: true },
    });

    for (const user of users) {
      const userRoleStr = String(user.role);
      const slug = enumToSlug[userRoleStr] || userRoleStr.toLowerCase().replace('_', '-');
      const roleId = slugToRoleId.get(slug);
      if (roleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId },
        });
        totalUsersUpdated++;
      } else {
        console.warn(`  WARNING: No role found for user ${user.id} with role "${userRoleStr}"`);
      }
    }

    // 6. Map roleId onto UserCompany records
    const userCompanies = await prisma.userCompany.findMany({
      where: { companyId: company.id, roleId: null },
      select: { id: true, role: true },
    });

    for (const uc of userCompanies) {
      const ucRoleStr = String(uc.role);
      const slug = enumToSlug[ucRoleStr] || ucRoleStr.toLowerCase().replace('_', '-');
      const roleId = slugToRoleId.get(slug);
      if (roleId) {
        await prisma.userCompany.update({
          where: { id: uc.id },
          data: { roleId },
        });
        totalUserCompaniesUpdated++;
      } else {
        console.warn(`  WARNING: No role found for UserCompany ${uc.id} with role "${ucRoleStr}"`);
      }
    }

    console.log(`  Updated ${users.length} users, ${userCompanies.length} user-companies.\n`);
  }

  // 7. Verification
  console.log('--- Verification ---');
  const usersWithoutRole = await prisma.user.count({ where: { roleId: null } });
  const ucWithoutRole = await prisma.userCompany.count({ where: { roleId: null } });

  console.log(`Users without roleId: ${usersWithoutRole}`);
  console.log(`UserCompany without roleId: ${ucWithoutRole}`);

  if (usersWithoutRole > 0 || ucWithoutRole > 0) {
    console.error('\nWARNING: Some records still missing roleId. Do NOT proceed to Migration 2.');
  } else {
    console.log('\nAll records have roleId set. Safe to proceed to Migration 2.');
  }

  console.log(`\n--- Summary ---`);
  console.log(`Roles created: ${totalRolesCreated}`);
  console.log(`Permissions created: ${totalPermissionsCreated}`);
  console.log(`Users updated: ${totalUsersUpdated}`);
  console.log(`UserCompanies updated: ${totalUserCompaniesUpdated}`);
}

migrateRolesToDb()
  .then(() => {
    console.log('\nMigration complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
