const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Creating demo admin user...\n');

    // Create or find company
    let company = await prisma.company.findFirst({
        where: { dotNumber: 'DOT123456' }
    });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Demo Company',
                dotNumber: 'DOT123456',
                address: '123 Main St',
                city: 'Dallas',
                state: 'TX',
                zip: '75001',
                phone: '555-1234',
                email: 'demo@company.com',
            },
        });
        console.log('✅ Company created:', company.name);
    } else {
        console.log('✅ Company found:', company.name);
    }

    // Create or find MC Number
    let mcNumber = await prisma.mcNumber.findFirst({
        where: {
            companyId: company.id,
            number: 'MC123456'
        }
    });

    if (!mcNumber) {
        mcNumber = await prisma.mcNumber.create({
            data: {
                number: 'MC123456',
                companyId: company.id,
                companyName: 'Demo Company LLC',
                type: 'CARRIER', // Using valid enum value
                usdot: 'DOT123456',
                isDefault: true,
            },
        });
        console.log('✅ MC Number created:', mcNumber.number);
    } else {
        console.log('✅ MC Number found:', mcNumber.number);
    }

    // Create or update admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    let user = await prisma.user.findUnique({
        where: { email: 'admin@demo.com' }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'admin@demo.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                companyId: company.id,
                mcNumberId: mcNumber.id,
                isActive: true,
            },
        });
        console.log('✅ Admin user created!');
    } else {
        user = await prisma.user.update({
            where: { email: 'admin@demo.com' },
            data: { password: hashedPassword }
        });
        console.log('✅ Admin user password updated!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📧 Email:    admin@demo.com');
    console.log('🔑 Password: admin123\n');
    console.log('🌐 Login:    http://localhost:3000/login');
    console.log('⚙️  Telegram: http://localhost:3000/dashboard/settings/integrations/telegram\n');
}

main()
    .catch((e) => {
        console.error('\n❌ Error:', e.message);
        console.error('\nFull error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
