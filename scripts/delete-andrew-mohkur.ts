import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAndrewMohkur() {
  console.log('🔍 Searching for "andrew mohkur" in the database...');
  
  try {
    // Search in users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'andrew', mode: 'insensitive' } },
          { lastName: { contains: 'mohkur', mode: 'insensitive' } },
          { email: { contains: 'andrew', mode: 'insensitive' } },
          { email: { contains: 'mohkur', mode: 'insensitive' } },
        ],
      },
    });

    if (users.length > 0) {
      console.log(`Found ${users.length} user(s) matching "andrew mohkur":`);
      users.forEach((user) => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
      });

      // Delete related data first
      for (const user of users) {
        // Delete driver if exists
        await prisma.driver.deleteMany({
          where: { userId: user.id },
        });

        // Delete user companies
        await prisma.userCompany.deleteMany({
          where: { userId: user.id },
        });

        // Delete activity logs
        await prisma.activityLog.deleteMany({
          where: { userId: user.id },
        });

        // Delete notifications
        await prisma.notification.deleteMany({
          where: { userId: user.id },
        });

        // Delete notification preferences
        await prisma.notificationPreferences.deleteMany({
          where: { userId: user.id },
        });
      }

      // Delete users
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          id: { in: users.map((u) => u.id) },
        },
      });

      console.log(`✅ Deleted ${deletedUsers.count} user(s) and all related data`);
    } else {
      console.log('ℹ️  No users found matching "andrew mohkur"');
    }

    // Search in drivers
    const drivers = await prisma.driver.findMany({
      where: {
        OR: [
          { user: { firstName: { contains: 'andrew', mode: 'insensitive' } } },
          { user: { lastName: { contains: 'mohkur', mode: 'insensitive' } } },
        ],
      },
      include: { user: true },
    });

    if (drivers.length > 0) {
      console.log(`Found ${drivers.length} driver(s) matching "andrew mohkur"`);
      // Drivers are already deleted above when deleting users
    }

    // Search in customers
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: 'andrew', mode: 'insensitive' } },
          { name: { contains: 'mohkur', mode: 'insensitive' } },
        ],
      },
    });

    if (customers.length > 0) {
      console.log(`Found ${customers.length} customer(s) matching "andrew mohkur":`);
      customers.forEach((customer) => {
        console.log(`  - ${customer.name} - ID: ${customer.id}`);
      });

      // Delete related data
      for (const customer of customers) {
        // Delete loads
        await prisma.load.deleteMany({
          where: { customerId: customer.id },
        });

        // Delete invoices
        await prisma.invoice.deleteMany({
          where: { customerId: customer.id },
        });

        // Delete customer contacts
        await prisma.customerContact.deleteMany({
          where: { customerId: customer.id },
        });

        // Delete customer tags
        await prisma.customerTag.deleteMany({
          where: { customerId: customer.id },
        });
      }

      const deletedCustomers = await prisma.customer.deleteMany({
        where: {
          id: { in: customers.map((c) => c.id) },
        },
      });

      console.log(`✅ Deleted ${deletedCustomers.count} customer(s) and all related data`);
    } else {
      console.log('ℹ️  No customers found matching "andrew mohkur"');
    }

    // Search in MC numbers (owner field)
    const mcNumbers = await prisma.mcNumber.findMany({
      where: {
        owner: { contains: 'andrew', mode: 'insensitive' },
      },
    });

    if (mcNumbers.length > 0) {
      console.log(`Found ${mcNumbers.length} MC number(s) with owner matching "andrew":`);
      mcNumbers.forEach((mc) => {
        console.log(`  - ${mc.companyName} (MC ${mc.number}) - Owner: ${mc.owner}`);
      });

      // Update MC numbers to remove owner
      const updated = await prisma.mcNumber.updateMany({
        where: {
          id: { in: mcNumbers.map((mc) => mc.id) },
        },
        data: {
          owner: null,
        },
      });

      console.log(`✅ Cleared owner field from ${updated.count} MC number(s)`);
    } else {
      console.log('ℹ️  No MC numbers found with owner matching "andrew"');
    }

    console.log('');
    console.log('✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error deleting andrew mohkur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndrewMohkur()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });

