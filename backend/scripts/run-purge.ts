#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import prisma from '../src/lib/prisma';
import readline from 'readline';

// Load env from backend/.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PRESERVE = ['users', 'branches', '_prisma_migrations', 'prisma_migrations'];

async function ask(question: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) => rl.question(question, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function backupPreserved(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
  console.log('Backing up preserved tables to', dir);
  const users = await prisma.users.findMany();
  await fs.promises.writeFile(path.join(dir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
  const branches = await prisma.branches.findMany();
  await fs.promises.writeFile(path.join(dir, 'branches.json'), JSON.stringify(branches, null, 2), 'utf8');
}

async function main() {
  try {
    console.log('Purge runner starting. .env DATABASE_URL used:', !!process.env.DATABASE_URL);

    const autoConfirm = process.env.CONFIRM === 'yes' || process.argv.includes('--yes');
    if (!autoConfirm) {
      const answer = await ask('This will DELETE ALL DATA except users and branches. Type YES to continue: ');
      if (answer !== 'YES') {
        console.log('Aborting. No changes made.');
        process.exit(0);
      }
    }

    const doBackup = process.argv.includes('--backup');
    const backupDir = path.resolve(__dirname, '..', 'db', 'backups', `${Date.now()}`);
    if (doBackup) {
      console.log('Creating JSON backups for preserved tables...');
      await backupPreserved(backupDir);
    }

    // Get list of tables to truncate
    const excludeList = PRESERVE.map(n => `'${n}'`).join(', ');
    const rows: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (${excludeList}) ORDER BY tablename`,
    );

    if (!rows || rows.length === 0) {
      console.log('No tables found to truncate (after exclusions). Nothing to do.');
      return;
    }

    const tableNames = rows.map(r => r.tablename).filter(n => n && n.length > 0);
    console.log('Tables to truncate:', tableNames.join(', '));

    // Double-check counts before truncation
    console.log('Row counts (before):');
    for (const t of tableNames.slice(0, 30)) {
      try {
        // Use format to avoid quoting issues
        const res: Array<{ count: string }> = await prisma.$queryRawUnsafe(`SELECT count(*)::text as count FROM "${t}"`);
        console.log(`  ${t}: ${res[0]?.count ?? '0'}`);
      } catch (err) {
        console.log(`  ${t}: (count failed)`, (err as Error).message);
      }
    }

    // Perform truncation
    const quoted = tableNames.map(n => `"${n.replace(/"/g, '""')}"`).join(', ');
    console.log('Executing TRUNCATE...');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    console.log('Truncation complete. Row counts (after):');
    const preservedCountsUsers: Array<{ count: string }> = await prisma.$queryRawUnsafe('SELECT count(*)::text as count FROM "users"');
    const preservedCountsBranches: Array<{ count: string }> = await prisma.$queryRawUnsafe('SELECT count(*)::text as count FROM "branches"');
    console.log(`  users: ${preservedCountsUsers[0]?.count ?? '0'}`);
    console.log(`  branches: ${preservedCountsBranches[0]?.count ?? '0'}`);

    if (doBackup) console.log('Backups are in', backupDir);
    console.log('Purge finished successfully.');
  } catch (err) {
    console.error('Purge failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
