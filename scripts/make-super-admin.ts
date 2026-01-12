import { prisma } from '../lib/prisma';

async function makeSuperAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('Usage: npx tsx scripts/make-super-admin.ts <email>');
        process.exit(1);
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Promoting ${normalizedEmail} to SUPER_ADMIN...`);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
        console.error(`User not found: ${normalizedEmail}`);
        process.exit(1);
    }

    try {
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'SUPER_ADMIN' },
        });
        console.log(`✅ ${updated.firstName} ${updated.lastName} (${updated.email}) is now a SUPER_ADMIN`);
        console.log('   Note: Passwords and other data remain unchanged.');

    } catch (error) {
        console.error('Error updating user role:', error);
    } finally {
        await prisma.$disconnect();
    }
}

makeSuperAdmin()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
