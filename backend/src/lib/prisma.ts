import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  //.catch(err => console.error('Database connection failed:', err));

export default prisma;
