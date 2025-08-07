import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create system configurations
  const systemConfigs = [
    {
      key: 'DEFAULT_SUBSCRIPTION_PLAN',
      value: 'FREE',
      description: 'Default subscription plan for new users'
    },
    {
      key: 'FREE_PLAN_DOMAINS',
      value: '1',
      description: 'Number of domains allowed in FREE plan'
    },
    {
      key: 'FREE_PLAN_MAILBOXES',
      value: '1',
      description: 'Number of mailboxes allowed in FREE plan'
    },
    {
      key: 'BASIC_PLAN_DOMAINS',
      value: '3',
      description: 'Number of domains allowed in BASIC plan'
    },
    {
      key: 'BASIC_PLAN_MAILBOXES',
      value: '10',
      description: 'Number of mailboxes allowed in BASIC plan'
    },
    {
      key: 'PREMIUM_PLAN_DOMAINS',
      value: '10',
      description: 'Number of domains allowed in PREMIUM plan'
    },
    {
      key: 'PREMIUM_PLAN_MAILBOXES',
      value: '50',
      description: 'Number of mailboxes allowed in PREMIUM plan'
    },
    {
      key: 'ENTERPRISE_PLAN_DOMAINS',
      value: '100',
      description: 'Number of domains allowed in ENTERPRISE plan'
    },
    {
      key: 'ENTERPRISE_PLAN_MAILBOXES',
      value: '1000',
      description: 'Number of mailboxes allowed in ENTERPRISE plan'
    }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config
    });
  }

  console.log('✅ System configurations created');

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!existingSuperAdmin) {
    // Create super admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@system.com',
        password: hashedPassword,
        name: 'System Super Admin',
        role: 'SUPER_ADMIN'
      }
    });

    // Create enterprise subscription for super admin
    await prisma.subscription.create({
      data: {
        userId: superAdmin.id,
        plan: 'ENTERPRISE',
        maxDomains: 100,
        maxMailboxes: 1000
      }
    });

    console.log('✅ Super admin created: admin@system.com / admin123');
  } else {
    console.log('ℹ️ Super admin already exists');
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Super Admin Account:');
  console.log('Email: admin@system.com');
  console.log('Password: admin123');
  console.log('\n💡 Ab aap Postman se baaki users create kar sakte hain!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 