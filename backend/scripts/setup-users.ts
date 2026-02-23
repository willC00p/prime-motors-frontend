import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { UserRole } from '../src/types/auth';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

interface UserSeed {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
  branchId: number | null;
}

const users: UserSeed[] = [
  // Management Users
  {
    username: 'admin',
    password: 'password123',
    role: 'gm',
    name: 'System Administrator',
    email: 'admin@primemotors.com',
    branchId: null
  },
  {
    username: 'ceo',
    password: 'password123',
    role: 'ceo',
    name: 'Chief Executive Officer',
    email: 'ceo@primemotors.com',
    branchId: null
  },
  {
    username: 'gm',
    password: 'password123',
    role: 'gm',
    name: 'General Manager',
    email: 'gm@primemotors.com',
    branchId: null
  },
  {
    username: 'nsm',
    password: 'password123',
    role: 'nsm',
    name: 'National Sales Manager',
    email: 'nsm@primemotors.com',
    branchId: null
  },
  // Department Heads
  {
    username: 'purchasing',
    password: 'password123',
    role: 'purchasing',
    name: 'Purchasing Manager',
    email: 'purchasing@primemotors.com',
    branchId: null
  },
  {
    username: 'accounting',
    password: 'password123',
    role: 'accounting',
    name: 'Accounting Manager',
    email: 'accounting@primemotors.com',
    branchId: null
  },
  {
    username: 'finance',
    password: 'password123',
    role: 'finance',
    name: 'Finance Manager',
    email: 'finance@primemotors.com',
    branchId: null
  },
  {
    username: 'audit',
    password: 'password123',
    role: 'audit',
    name: 'Audit Manager',
    email: 'audit@primemotors.com',
    branchId: null
  },
  // Branch Users
  {
    username: 'branch1',
    password: 'password123',
    role: 'branch',
    name: 'Branch 1 Manager',
    email: 'branch1@primemotors.com',
    branchId: 1
  }
];

async function setupUsers() {
  try {
    // First, delete existing test users
    console.log('Cleaning up existing users...');
    await prisma.users.deleteMany({
      where: {
        username: {
          in: users.map(u => u.username)
        }
      }
    });

    // Create new users with hashed passwords
    console.log('Creating new users...');
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      await prisma.users.create({
        data: {
          username: user.username,
          password: hashedPassword,
          role: user.role,
          name: user.name,
          email: user.email,
          branchId: user.branchId,
          isActive: true
        }
      });
      console.log(`Created user: ${user.username}`);
    }

    console.log('✅ Users setup completed successfully');
  } catch (error) {
    console.error('Error setting up users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupUsers().catch(console.error);
