import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function listUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, username, role, name, email, "isActive"
      FROM users
      ORDER BY id;
    `);
    
    console.log('Users in the database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

listUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
