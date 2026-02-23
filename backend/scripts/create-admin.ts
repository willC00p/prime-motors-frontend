import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createInitialAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.users.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await prisma.users.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        role: 'ceo',
        name: 'System Administrator',
        email: 'admin@primemotors.com',
        isActive: true
      }
    });

    console.log('Admin user created successfully:', {
      id: admin.id,
      username: admin.username,
      role: admin.role
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createInitialAdmin();
