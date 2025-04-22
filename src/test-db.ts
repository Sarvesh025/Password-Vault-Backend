import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('Database connection successful!');

    // Try to create a test user with tenant
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'Test User',
        tenant: {
          create: {
            name: 'Test Tenant'
          }
        }
      },
    });
    console.log('Test user created successfully:', testUser);

    // Try to find the user
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: { tenant: true }
    });
    console.log('Found user:', foundUser);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 