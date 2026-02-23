#!/usr/bin/env ts-node
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: ts-node scripts/apply-sql.ts <path-to-sql>')
    process.exit(2)
  }
  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(__dirname, '..', fileArg)
  if (!fs.existsSync(filePath)) {
    console.error('SQL file not found:', filePath)
    process.exit(2)
  }
  const sql = fs.readFileSync(filePath, 'utf8')
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not set. Please set it in backend/.env')
    process.exit(2)
  }
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    console.log('[apply-sql] Applying:', filePath)
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('[apply-sql] Done.')
  } catch (e:any) {
    try { await client.query('ROLLBACK') } catch {}
    console.error('[apply-sql] Failed:', e?.message || e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
